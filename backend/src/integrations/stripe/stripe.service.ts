import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { CustomLogger } from '../../common/services/logger.service';

export interface CreateCustomerParams {
  email: string;
  name: string;
  metadata?: Record<string, string>;
}

export interface CreateSubscriptionParams {
  customerId: string;
  priceId: string;
  metadata?: Record<string, string>;
  trialDays?: number;
}

export interface UpdateSubscriptionParams {
  subscriptionId: string;
  priceId?: string;
  cancelAtPeriodEnd?: boolean;
  metadata?: Record<string, string>;
}

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    private logger: CustomLogger,
  ) {
    this.logger.setContext('StripeService');

    const apiKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!apiKey) {
      this.logger.warn('Stripe API key not configured');
    }

    this.stripe = new Stripe(apiKey || '', {
      apiVersion: '2023-10-16',
      typescript: true,
    });
  }

  // =====================================================
  // CUSTOMER MANAGEMENT
  // =====================================================

  async createCustomer(params: CreateCustomerParams): Promise<Stripe.Customer> {
    this.logger.log(`Creating Stripe customer: ${params.email}`);

    try {
      const customer = await this.stripe.customers.create({
        email: params.email,
        name: params.name,
        metadata: params.metadata || {},
      });

      this.logger.log(`Stripe customer created: ${customer.id}`);
      return customer;
    } catch (error) {
      this.logger.error('Failed to create Stripe customer', error);
      throw new BadRequestException('Failed to create customer');
    }
  }

  async getCustomer(customerId: string): Promise<Stripe.Customer> {
    this.logger.log(`Fetching Stripe customer: ${customerId}`);

    try {
      const customer = await this.stripe.customers.retrieve(customerId);

      if (customer.deleted) {
        throw new BadRequestException('Customer has been deleted');
      }

      return customer as Stripe.Customer;
    } catch (error) {
      this.logger.error('Failed to fetch Stripe customer', error);
      throw new BadRequestException('Failed to fetch customer');
    }
  }

  async updateCustomer(
    customerId: string,
    params: Partial<CreateCustomerParams>,
  ): Promise<Stripe.Customer> {
    this.logger.log(`Updating Stripe customer: ${customerId}`);

    try {
      const customer = await this.stripe.customers.update(customerId, {
        email: params.email,
        name: params.name,
        metadata: params.metadata,
      });

      this.logger.log(`Stripe customer updated: ${customer.id}`);
      return customer;
    } catch (error) {
      this.logger.error('Failed to update Stripe customer', error);
      throw new BadRequestException('Failed to update customer');
    }
  }

  async deleteCustomer(customerId: string): Promise<Stripe.DeletedCustomer> {
    this.logger.log(`Deleting Stripe customer: ${customerId}`);

    try {
      const deleted = await this.stripe.customers.del(customerId);
      this.logger.log(`Stripe customer deleted: ${customerId}`);
      return deleted;
    } catch (error) {
      this.logger.error('Failed to delete Stripe customer', error);
      throw new BadRequestException('Failed to delete customer');
    }
  }

  // =====================================================
  // SUBSCRIPTION MANAGEMENT
  // =====================================================

  async createSubscription(
    params: CreateSubscriptionParams,
  ): Promise<Stripe.Subscription> {
    this.logger.log(
      `Creating subscription for customer: ${params.customerId}`,
    );

    try {
      const subscriptionParams: Stripe.SubscriptionCreateParams = {
        customer: params.customerId,
        items: [{ price: params.priceId }],
        metadata: params.metadata || {},
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
      };

      if (params.trialDays && params.trialDays > 0) {
        subscriptionParams.trial_period_days = params.trialDays;
      }

      const subscription = await this.stripe.subscriptions.create(
        subscriptionParams,
      );

      this.logger.log(`Subscription created: ${subscription.id}`);
      return subscription;
    } catch (error) {
      this.logger.error('Failed to create subscription', error);
      throw new BadRequestException('Failed to create subscription');
    }
  }

  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    this.logger.log(`Fetching subscription: ${subscriptionId}`);

    try {
      const subscription = await this.stripe.subscriptions.retrieve(
        subscriptionId,
        {
          expand: ['latest_invoice', 'customer'],
        },
      );

      return subscription;
    } catch (error) {
      this.logger.error('Failed to fetch subscription', error);
      throw new BadRequestException('Failed to fetch subscription');
    }
  }

  async updateSubscription(
    params: UpdateSubscriptionParams,
  ): Promise<Stripe.Subscription> {
    this.logger.log(`Updating subscription: ${params.subscriptionId}`);

    try {
      const updateParams: Stripe.SubscriptionUpdateParams = {
        metadata: params.metadata,
        cancel_at_period_end: params.cancelAtPeriodEnd,
      };

      if (params.priceId) {
        // Get current subscription to find the item to update
        const currentSub = await this.stripe.subscriptions.retrieve(
          params.subscriptionId,
        );

        updateParams.items = [
          {
            id: currentSub.items.data[0].id,
            price: params.priceId,
          },
        ];
      }

      const subscription = await this.stripe.subscriptions.update(
        params.subscriptionId,
        updateParams,
      );

      this.logger.log(`Subscription updated: ${subscription.id}`);
      return subscription;
    } catch (error) {
      this.logger.error('Failed to update subscription', error);
      throw new BadRequestException('Failed to update subscription');
    }
  }

  async cancelSubscription(
    subscriptionId: string,
    immediately: boolean = false,
  ): Promise<Stripe.Subscription> {
    this.logger.log(
      `Canceling subscription: ${subscriptionId} (immediate: ${immediately})`,
    );

    try {
      let subscription: Stripe.Subscription;

      if (immediately) {
        subscription = await this.stripe.subscriptions.cancel(subscriptionId);
      } else {
        subscription = await this.stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });
      }

      this.logger.log(`Subscription canceled: ${subscription.id}`);
      return subscription;
    } catch (error) {
      this.logger.error('Failed to cancel subscription', error);
      throw new BadRequestException('Failed to cancel subscription');
    }
  }

  async resumeSubscription(
    subscriptionId: string,
  ): Promise<Stripe.Subscription> {
    this.logger.log(`Resuming subscription: ${subscriptionId}`);

    try {
      const subscription = await this.stripe.subscriptions.update(
        subscriptionId,
        {
          cancel_at_period_end: false,
        },
      );

      this.logger.log(`Subscription resumed: ${subscription.id}`);
      return subscription;
    } catch (error) {
      this.logger.error('Failed to resume subscription', error);
      throw new BadRequestException('Failed to resume subscription');
    }
  }

  // =====================================================
  // PAYMENT METHODS
  // =====================================================

  async listPaymentMethods(
    customerId: string,
  ): Promise<Stripe.PaymentMethod[]> {
    this.logger.log(`Listing payment methods for customer: ${customerId}`);

    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });

      return paymentMethods.data;
    } catch (error) {
      this.logger.error('Failed to list payment methods', error);
      throw new BadRequestException('Failed to list payment methods');
    }
  }

  async attachPaymentMethod(
    paymentMethodId: string,
    customerId: string,
  ): Promise<Stripe.PaymentMethod> {
    this.logger.log(
      `Attaching payment method ${paymentMethodId} to customer ${customerId}`,
    );

    try {
      const paymentMethod = await this.stripe.paymentMethods.attach(
        paymentMethodId,
        {
          customer: customerId,
        },
      );

      this.logger.log(`Payment method attached: ${paymentMethod.id}`);
      return paymentMethod;
    } catch (error) {
      this.logger.error('Failed to attach payment method', error);
      throw new BadRequestException('Failed to attach payment method');
    }
  }

  async detachPaymentMethod(
    paymentMethodId: string,
  ): Promise<Stripe.PaymentMethod> {
    this.logger.log(`Detaching payment method: ${paymentMethodId}`);

    try {
      const paymentMethod =
        await this.stripe.paymentMethods.detach(paymentMethodId);

      this.logger.log(`Payment method detached: ${paymentMethod.id}`);
      return paymentMethod;
    } catch (error) {
      this.logger.error('Failed to detach payment method', error);
      throw new BadRequestException('Failed to detach payment method');
    }
  }

  async setDefaultPaymentMethod(
    customerId: string,
    paymentMethodId: string,
  ): Promise<Stripe.Customer> {
    this.logger.log(
      `Setting default payment method for customer: ${customerId}`,
    );

    try {
      const customer = await this.stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      this.logger.log(`Default payment method set: ${paymentMethodId}`);
      return customer;
    } catch (error) {
      this.logger.error('Failed to set default payment method', error);
      throw new BadRequestException('Failed to set default payment method');
    }
  }

  // =====================================================
  // INVOICES
  // =====================================================

  async listInvoices(customerId: string): Promise<Stripe.Invoice[]> {
    this.logger.log(`Listing invoices for customer: ${customerId}`);

    try {
      const invoices = await this.stripe.invoices.list({
        customer: customerId,
        limit: 100,
      });

      return invoices.data;
    } catch (error) {
      this.logger.error('Failed to list invoices', error);
      throw new BadRequestException('Failed to list invoices');
    }
  }

  async getInvoice(invoiceId: string): Promise<Stripe.Invoice> {
    this.logger.log(`Fetching invoice: ${invoiceId}`);

    try {
      const invoice = await this.stripe.invoices.retrieve(invoiceId);
      return invoice;
    } catch (error) {
      this.logger.error('Failed to fetch invoice', error);
      throw new BadRequestException('Failed to fetch invoice');
    }
  }

  // =====================================================
  // PRICES & PRODUCTS
  // =====================================================

  async listPrices(active: boolean = true): Promise<Stripe.Price[]> {
    this.logger.log('Listing Stripe prices');

    try {
      const prices = await this.stripe.prices.list({
        active,
        expand: ['data.product'],
        limit: 100,
      });

      return prices.data;
    } catch (error) {
      this.logger.error('Failed to list prices', error);
      throw new BadRequestException('Failed to list prices');
    }
  }

  async getPrice(priceId: string): Promise<Stripe.Price> {
    this.logger.log(`Fetching price: ${priceId}`);

    try {
      const price = await this.stripe.prices.retrieve(priceId, {
        expand: ['product'],
      });

      return price;
    } catch (error) {
      this.logger.error('Failed to fetch price', error);
      throw new BadRequestException('Failed to fetch price');
    }
  }

  // =====================================================
  // BILLING PORTAL
  // =====================================================

  async createBillingPortalSession(
    customerId: string,
    returnUrl: string,
  ): Promise<Stripe.BillingPortal.Session> {
    this.logger.log(`Creating billing portal session for: ${customerId}`);

    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      this.logger.log(`Billing portal session created: ${session.id}`);
      return session;
    } catch (error) {
      this.logger.error('Failed to create billing portal session', error);
      throw new BadRequestException('Failed to create billing portal session');
    }
  }

  // =====================================================
  // CHECKOUT
  // =====================================================

  async createCheckoutSession(params: {
    customerId?: string;
    customerEmail?: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    trialDays?: number;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Checkout.Session> {
    this.logger.log('Creating checkout session');

    try {
      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        mode: 'subscription',
        line_items: [
          {
            price: params.priceId,
            quantity: 1,
          },
        ],
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        metadata: params.metadata || {},
      };

      if (params.customerId) {
        sessionParams.customer = params.customerId;
      } else if (params.customerEmail) {
        sessionParams.customer_email = params.customerEmail;
      }

      if (params.trialDays && params.trialDays > 0) {
        sessionParams.subscription_data = {
          trial_period_days: params.trialDays,
        };
      }

      const session = await this.stripe.checkout.sessions.create(sessionParams);

      this.logger.log(`Checkout session created: ${session.id}`);
      return session;
    } catch (error) {
      this.logger.error('Failed to create checkout session', error);
      throw new BadRequestException('Failed to create checkout session');
    }
  }

  // =====================================================
  // WEBHOOKS
  // =====================================================

  constructWebhookEvent(
    payload: string | Buffer,
    signature: string,
    secret: string,
  ): Stripe.Event {
    try {
      return this.stripe.webhooks.constructEvent(payload, signature, secret);
    } catch (error) {
      this.logger.error('Webhook signature verification failed', error);
      throw new BadRequestException('Invalid webhook signature');
    }
  }

  // =====================================================
  // USAGE RECORDS (for metered billing)
  // =====================================================

  async createUsageRecord(
    subscriptionItemId: string,
    quantity: number,
    timestamp?: number,
  ): Promise<Stripe.UsageRecord> {
    this.logger.log(`Creating usage record for item: ${subscriptionItemId}`);

    try {
      const usageRecord = await this.stripe.subscriptionItems.createUsageRecord(
        subscriptionItemId,
        {
          quantity,
          timestamp: timestamp || Math.floor(Date.now() / 1000),
          action: 'set',
        },
      );

      this.logger.log(`Usage record created: ${quantity} units`);
      return usageRecord;
    } catch (error) {
      this.logger.error('Failed to create usage record', error);
      throw new BadRequestException('Failed to create usage record');
    }
  }
}
