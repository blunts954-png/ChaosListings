import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/modules/prisma.service';
import { CustomLogger } from '../../common/modules/logger.service';
import { StripeService } from '../../integrations/stripe/stripe.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import Stripe from 'stripe';

@Injectable()
export class SubscriptionsService {
  constructor(
    private prisma: PrismaService,
    private stripe: StripeService,
    private logger: CustomLogger,
  ) {
    this.logger.setContext('SubscriptionsService');
  }

  // =====================================================
  // SUBSCRIPTION MANAGEMENT
  // =====================================================

  async createSubscription(
    agencyId: string,
    businessId: string,
    createSubscriptionDto: CreateSubscriptionDto,
    userId: string,
  ) {
    this.logger.log(
      `Creating subscription for business ${businessId} in agency ${agencyId}`,
    );

    // Verify agency membership
    await this.verifyAgencyAccess(agencyId, userId);

    // Verify business belongs to agency
    const business = await this.prisma.business.findFirst({
      where: {
        id: businessId,
        agencyId,
        deletedAt: null,
      },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    // Get or create Stripe customer
    const agency = await this.prisma.agency.findUnique({
      where: { id: agencyId },
    });

    let stripeCustomerId = agency.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await this.stripe.createCustomer({
        email: agency.email,
        name: agency.name,
        metadata: {
          agencyId: agency.id,
        },
      });

      stripeCustomerId = customer.id;

      await this.prisma.agency.update({
        where: { id: agencyId },
        data: { stripeCustomerId: customer.id },
      });
    }

    // Attach payment method if provided
    if (createSubscriptionDto.paymentMethodId) {
      await this.stripe.attachPaymentMethod(
        createSubscriptionDto.paymentMethodId,
        stripeCustomerId,
      );
      await this.stripe.setDefaultPaymentMethod(
        stripeCustomerId,
        createSubscriptionDto.paymentMethodId,
      );
    }

    // Get price details
    const price = await this.stripe.getPrice(createSubscriptionDto.priceId);
    const product = price.product as Stripe.Product;

    // Create Stripe subscription
    const stripeSubscription = await this.stripe.createSubscription({
      customerId: stripeCustomerId,
      priceId: createSubscriptionDto.priceId,
      trialDays: createSubscriptionDto.trialDays,
      metadata: {
        agencyId,
        businessId,
      },
    });

    // Create subscription record
    const subscription = await this.prisma.subscription.create({
      data: {
        businessId,
        agencyId,
        stripeCustomerId,
        stripeSubscriptionId: stripeSubscription.id,
        stripePriceId: price.id,
        planName: product.name,
        planTier: this.getPlanTierFromProduct(product),
        priceToClient: (price.unit_amount || 0) / 100,
        currency: price.currency.toUpperCase(),
        billingInterval: price.recurring?.interval || 'month',
        status: stripeSubscription.status,
        trialEnd: stripeSubscription.trial_end
          ? new Date(stripeSubscription.trial_end * 1000)
          : null,
        currentPeriodStart: new Date(
          stripeSubscription.current_period_start * 1000,
        ),
        currentPeriodEnd: new Date(
          stripeSubscription.current_period_end * 1000,
        ),
        metadata: {
          stripeProductId: product.id,
        },
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    this.logger.log(`Subscription created: ${subscription.id}`);
    return subscription;
  }

  async findAll(agencyId: string, userId: string) {
    this.logger.log(`Finding all subscriptions for agency: ${agencyId}`);

    await this.verifyAgencyAccess(agencyId, userId);

    const subscriptions = await this.prisma.subscription.findMany({
      where: { agencyId },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return subscriptions;
  }

  async findOne(subscriptionId: string, agencyId: string, userId: string) {
    this.logger.log(`Finding subscription: ${subscriptionId}`);

    await this.verifyAgencyAccess(agencyId, userId);

    const subscription = await this.prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        agencyId,
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Get latest info from Stripe
    const stripeSubscription = await this.stripe.getSubscription(
      subscription.stripeSubscriptionId,
    );

    return {
      ...subscription,
      stripeData: stripeSubscription,
    };
  }

  async update(
    subscriptionId: string,
    agencyId: string,
    updateSubscriptionDto: UpdateSubscriptionDto,
    userId: string,
  ) {
    this.logger.log(`Updating subscription: ${subscriptionId}`);

    await this.verifyAgencyAccess(agencyId, userId);

    const subscription = await this.prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        agencyId,
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Update Stripe subscription
    const stripeSubscription = await this.stripe.updateSubscription({
      subscriptionId: subscription.stripeSubscriptionId,
      priceId: updateSubscriptionDto.priceId,
      cancelAtPeriodEnd: updateSubscriptionDto.cancelAtPeriodEnd,
    });

    // Update local record
    const updateData: any = {
      status: stripeSubscription.status,
      currentPeriodStart: new Date(
        stripeSubscription.current_period_start * 1000,
      ),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
    };

    if (updateSubscriptionDto.priceId) {
      const price = await this.stripe.getPrice(updateSubscriptionDto.priceId);
      const product = price.product as Stripe.Product;

      updateData.stripePriceId = price.id;
      updateData.planName = product.name;
      updateData.planTier = this.getPlanTierFromProduct(product);
      updateData.priceToClient = (price.unit_amount || 0) / 100;
      updateData.currency = price.currency.toUpperCase();
      updateData.billingInterval = price.recurring?.interval || 'month';
    }

    const updated = await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: updateData,
      include: {
        business: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    this.logger.log(`Subscription updated: ${updated.id}`);
    return updated;
  }

  async cancel(
    subscriptionId: string,
    agencyId: string,
    userId: string,
    immediately: boolean = false,
  ) {
    this.logger.log(
      `Canceling subscription: ${subscriptionId} (immediate: ${immediately})`,
    );

    await this.verifyAgencyAccess(agencyId, userId);

    const subscription = await this.prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        agencyId,
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Cancel in Stripe
    const stripeSubscription = await this.stripe.cancelSubscription(
      subscription.stripeSubscriptionId,
      immediately,
    );

    // Update local record
    const updated = await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: stripeSubscription.status,
        canceledAt: stripeSubscription.canceled_at
          ? new Date(stripeSubscription.canceled_at * 1000)
          : new Date(),
        endedAt:
          immediately && stripeSubscription.ended_at
            ? new Date(stripeSubscription.ended_at * 1000)
            : null,
      },
    });

    this.logger.log(`Subscription canceled: ${updated.id}`);
    return updated;
  }

  async resume(subscriptionId: string, agencyId: string, userId: string) {
    this.logger.log(`Resuming subscription: ${subscriptionId}`);

    await this.verifyAgencyAccess(agencyId, userId);

    const subscription = await this.prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        agencyId,
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Resume in Stripe
    const stripeSubscription = await this.stripe.resumeSubscription(
      subscription.stripeSubscriptionId,
    );

    // Update local record
    const updated = await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: stripeSubscription.status,
        canceledAt: null,
      },
    });

    this.logger.log(`Subscription resumed: ${updated.id}`);
    return updated;
  }

  // =====================================================
  // BILLING PORTAL & CHECKOUT
  // =====================================================

  async createCheckoutSession(
    agencyId: string,
    businessId: string,
    createCheckoutSessionDto: CreateCheckoutSessionDto,
    userId: string,
  ) {
    this.logger.log(
      `Creating checkout session for business ${businessId} in agency ${agencyId}`,
    );

    await this.verifyAgencyAccess(agencyId, userId);

    // Verify business belongs to agency
    const business = await this.prisma.business.findFirst({
      where: {
        id: businessId,
        agencyId,
        deletedAt: null,
      },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const agency = await this.prisma.agency.findUnique({
      where: { id: agencyId },
    });

    // Create checkout session
    const session = await this.stripe.createCheckoutSession({
      customerId: agency.stripeCustomerId,
      customerEmail: !agency.stripeCustomerId ? agency.email : undefined,
      priceId: createCheckoutSessionDto.priceId,
      successUrl: createCheckoutSessionDto.successUrl,
      cancelUrl: createCheckoutSessionDto.cancelUrl,
      trialDays: createCheckoutSessionDto.trialDays,
      metadata: {
        agencyId,
        businessId,
      },
    });

    this.logger.log(`Checkout session created: ${session.id}`);
    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  async createBillingPortalSession(agencyId: string, returnUrl: string, userId: string) {
    this.logger.log(
      `Creating billing portal session for agency: ${agencyId}`,
    );

    await this.verifyAgencyAccess(agencyId, userId);

    const agency = await this.prisma.agency.findUnique({
      where: { id: agencyId },
    });

    if (!agency.stripeCustomerId) {
      throw new BadRequestException(
        'No Stripe customer found. Please create a subscription first.',
      );
    }

    const session = await this.stripe.createBillingPortalSession(
      agency.stripeCustomerId,
      returnUrl,
    );

    this.logger.log(`Billing portal session created: ${session.id}`);
    return {
      url: session.url,
    };
  }

  // =====================================================
  // PRICES & PLANS
  // =====================================================

  async listPrices() {
    this.logger.log('Listing available subscription prices');

    const prices = await this.stripe.listPrices(true);

    return prices.map((price) => {
      const product = price.product as Stripe.Product;
      return {
        id: price.id,
        productId: product.id,
        productName: product.name,
        productDescription: product.description,
        amount: price.unit_amount,
        currency: price.currency,
        interval: price.recurring?.interval,
        intervalCount: price.recurring?.interval_count,
        tier: this.getPlanTierFromProduct(product),
      };
    });
  }

  // =====================================================
  // INVOICES
  // =====================================================

  async listInvoices(agencyId: string, userId: string) {
    this.logger.log(`Listing invoices for agency: ${agencyId}`);

    await this.verifyAgencyAccess(agencyId, userId);

    const agency = await this.prisma.agency.findUnique({
      where: { id: agencyId },
    });

    if (!agency.stripeCustomerId) {
      return [];
    }

    const invoices = await this.stripe.listInvoices(agency.stripeCustomerId);

    return invoices.map((invoice) => ({
      id: invoice.id,
      number: invoice.number,
      amount: invoice.amount_due,
      currency: invoice.currency,
      status: invoice.status,
      paidAt: invoice.status_transitions.paid_at
        ? new Date(invoice.status_transitions.paid_at * 1000)
        : null,
      dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      invoicePdf: invoice.invoice_pdf,
    }));
  }

  // =====================================================
  // WEBHOOK HANDLERS (called from WebhooksModule)
  // =====================================================

  async handleSubscriptionCreated(stripeSubscription: Stripe.Subscription) {
    this.logger.log(
      `Handling subscription.created webhook: ${stripeSubscription.id}`,
    );

    const agencyId = stripeSubscription.metadata.agencyId;
    const businessId = stripeSubscription.metadata.businessId;

    if (!agencyId || !businessId) {
      this.logger.warn('Missing metadata in subscription webhook');
      return;
    }

    // Check if already exists
    const existing = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: stripeSubscription.id },
    });

    if (existing) {
      this.logger.log('Subscription already exists, skipping creation');
      return;
    }

    const price = stripeSubscription.items.data[0].price;
    const product = price.product as Stripe.Product;

    await this.prisma.subscription.create({
      data: {
        businessId,
        agencyId,
        stripeCustomerId: stripeSubscription.customer as string,
        stripeSubscriptionId: stripeSubscription.id,
        stripePriceId: price.id,
        planName: product.name,
        planTier: this.getPlanTierFromProduct(product),
        priceToClient: (price.unit_amount || 0) / 100,
        currency: price.currency.toUpperCase(),
        billingInterval: price.recurring?.interval || 'month',
        status: stripeSubscription.status,
        trialEnd: stripeSubscription.trial_end
          ? new Date(stripeSubscription.trial_end * 1000)
          : null,
        currentPeriodStart: new Date(
          stripeSubscription.current_period_start * 1000,
        ),
        currentPeriodEnd: new Date(
          stripeSubscription.current_period_end * 1000,
        ),
        metadata: {
          stripeProductId: product.id,
        },
      },
    });

    this.logger.log('Subscription created from webhook');
  }

  async handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription) {
    this.logger.log(
      `Handling subscription.updated webhook: ${stripeSubscription.id}`,
    );

    const subscription = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: stripeSubscription.id },
    });

    if (!subscription) {
      this.logger.warn('Subscription not found for webhook update');
      return;
    }

    const price = stripeSubscription.items.data[0].price;
    const product = price.product as Stripe.Product;

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        stripePriceId: price.id,
        planName: product.name,
        planTier: this.getPlanTierFromProduct(product),
        priceToClient: (price.unit_amount || 0) / 100,
        currency: price.currency.toUpperCase(),
        billingInterval: price.recurring?.interval || 'month',
        status: stripeSubscription.status,
        trialEnd: stripeSubscription.trial_end
          ? new Date(stripeSubscription.trial_end * 1000)
          : null,
        currentPeriodStart: new Date(
          stripeSubscription.current_period_start * 1000,
        ),
        currentPeriodEnd: new Date(
          stripeSubscription.current_period_end * 1000,
        ),
        canceledAt: stripeSubscription.canceled_at
          ? new Date(stripeSubscription.canceled_at * 1000)
          : null,
        endedAt: stripeSubscription.ended_at
          ? new Date(stripeSubscription.ended_at * 1000)
          : null,
      },
    });

    this.logger.log('Subscription updated from webhook');
  }

  async handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription) {
    this.logger.log(
      `Handling subscription.deleted webhook: ${stripeSubscription.id}`,
    );

    const subscription = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: stripeSubscription.id },
    });

    if (!subscription) {
      this.logger.warn('Subscription not found for webhook deletion');
      return;
    }

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'canceled',
        endedAt: new Date(),
      },
    });

    this.logger.log('Subscription deleted from webhook');
  }

  // =====================================================
  // HELPER METHODS
  // =====================================================

  private async verifyAgencyAccess(
    agencyId: string,
    userId: string,
  ): Promise<void> {
    const membership = await this.prisma.agencyMembership.findFirst({
      where: {
        agencyId,
        userId,
        status: 'active',
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this agency');
    }
  }

  private getPlanTierFromProduct(product: Stripe.Product): string {
    const name = product.name.toLowerCase();
    if (name.includes('enterprise')) return 'enterprise';
    if (name.includes('pro') || name.includes('professional')) return 'pro';
    return 'starter';
  }
}
