import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { CustomLogger } from '../../common/services/logger.service';
import { EmailService } from '../../common/modules/email.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import Stripe from 'stripe';

@Injectable()
export class WebhooksService {
  constructor(
    private prisma: PrismaService,
    private subscriptionsService: SubscriptionsService,
    private logger: CustomLogger,
    private emailService: EmailService,
  ) {
    this.logger.setContext('WebhooksService');
  }

  // =====================================================
  // STRIPE WEBHOOKS
  // =====================================================

  async handleStripeWebhook(event: Stripe.Event) {
    this.logger.log(`Handling Stripe webhook: ${event.type}`);

    // Store webhook event for audit trail
    await this.storeWebhookEvent('stripe', event.type, event);

    try {
      switch (event.type) {
        // Subscription events
        case 'customer.subscription.created':
          await this.subscriptionsService.handleSubscriptionCreated(
            event.data.object as Stripe.Subscription,
          );
          break;

        case 'customer.subscription.updated':
          await this.subscriptionsService.handleSubscriptionUpdated(
            event.data.object as Stripe.Subscription,
          );
          break;

        case 'customer.subscription.deleted':
          await this.subscriptionsService.handleSubscriptionDeleted(
            event.data.object as Stripe.Subscription,
          );
          break;

        case 'customer.subscription.trial_will_end':
          await this.handleTrialWillEnd(event.data.object as Stripe.Subscription);
          break;

        // Payment events
        case 'invoice.paid':
          await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(
            event.data.object as Stripe.Invoice,
          );
          break;

        case 'invoice.payment_action_required':
          await this.handlePaymentActionRequired(
            event.data.object as Stripe.Invoice,
          );
          break;

        // Payment method events
        case 'payment_method.attached':
          await this.handlePaymentMethodAttached(
            event.data.object as Stripe.PaymentMethod,
          );
          break;

        case 'payment_method.detached':
          await this.handlePaymentMethodDetached(
            event.data.object as Stripe.PaymentMethod,
          );
          break;

        // Customer events
        case 'customer.created':
          await this.handleCustomerCreated(event.data.object as Stripe.Customer);
          break;

        case 'customer.updated':
          await this.handleCustomerUpdated(event.data.object as Stripe.Customer);
          break;

        case 'customer.deleted':
          await this.handleCustomerDeleted(event.data.object as Stripe.Customer);
          break;

        // Checkout events
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(
            event.data.object as Stripe.Checkout.Session,
          );
          break;

        default:
          this.logger.log(`Unhandled webhook event type: ${event.type}`);
      }

      // Mark webhook as processed
      await this.markWebhookProcessed(event.id);

      this.logger.log(`Webhook processed successfully: ${event.type}`);
    } catch (error) {
      this.logger.error(`Error processing webhook ${event.type}`, error);
      await this.markWebhookFailed(event.id, error.message);
      throw error;
    }
  }

  private async handleTrialWillEnd(subscription: Stripe.Subscription) {
    this.logger.log(
      `Trial will end soon for subscription: ${subscription.id}`,
    );

    const dbSubscription = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscription.id },
      include: {
        agency: {
          include: {
            memberships: {
              where: { role: 'owner', status: 'active' },
              include: {
                user: true,
              },
            },
          },
        },
        business: true,
      },
    });

    if (dbSubscription) {
      this.logger.log(
        `Trial ending for agency ${dbSubscription.agency.name}, business ${dbSubscription.business.name}`,
      );

      // Send email notification to agency owners
      const trialEnd = new Date(subscription.trial_end * 1000);
      const daysLeft = Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

      for (const membership of dbSubscription.agency.memberships) {
        await this.emailService.sendTrialEndingEmail(
          membership.user.email,
          dbSubscription.agency.name,
          daysLeft,
        );
      }

      this.logger.log(`Trial ending notification sent to agency owners`);
    }
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice) {
    this.logger.log(`Invoice paid: ${invoice.id}`);

    if (!invoice.subscription) {
      return;
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: invoice.subscription as string },
      include: {
        agency: {
          include: {
            memberships: {
              where: { role: 'owner', status: 'active' },
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (subscription) {
      // Update subscription status if needed
      if (subscription.status !== 'active') {
        await this.prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: 'active' },
        });
      }

      // Send invoice receipt email to agency owners
      const amount = invoice.amount_paid / 100; // Convert from cents to dollars
      const invoiceUrl = invoice.hosted_invoice_url || invoice.invoice_pdf || '';

      for (const membership of subscription.agency.memberships) {
        await this.emailService.sendInvoiceReceiptEmail(
          membership.user.email,
          invoice.number || invoice.id,
          amount,
          invoiceUrl,
        );
      }

      this.logger.log(`Payment successful and receipt sent for subscription: ${subscription.id}`);
    }
  }

  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    this.logger.log(`Invoice payment failed: ${invoice.id}`);

    if (!invoice.subscription) {
      return;
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: invoice.subscription as string },
      include: {
        agency: {
          include: {
            memberships: {
              where: { role: 'owner', status: 'active' },
              include: {
                user: true,
              },
            },
          },
        },
        business: true,
      },
    });

    if (subscription) {
      // Update subscription status
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'past_due' },
      });

      // Send payment failed email to agency owners
      const amount = invoice.amount_due / 100; // Convert from cents to dollars

      for (const membership of subscription.agency.memberships) {
        await this.emailService.sendPaymentFailedEmail(
          membership.user.email,
          subscription.agency.name,
          amount,
        );
      }

      this.logger.log(
        `Payment failed notification sent for subscription: ${subscription.id} - Agency: ${subscription.agency.name}`,
      );
    }
  }

  private async handlePaymentActionRequired(invoice: Stripe.Invoice) {
    this.logger.log(`Payment action required for invoice: ${invoice.id}`);

    if (!invoice.subscription) {
      return;
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: invoice.subscription as string },
      include: {
        agency: {
          include: {
            memberships: {
              where: { role: 'owner', status: 'active' },
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (subscription) {
      // Send email with payment action link to agency owners
      const amount = invoice.amount_due / 100; // Convert from cents to dollars
      const paymentUrl = invoice.hosted_invoice_url || '';

      for (const membership of subscription.agency.memberships) {
        await this.emailService.sendEmail({
          to: membership.user.email,
          subject: 'Payment Action Required - Update Payment Method',
          template: 'payment-action-required',
          context: {
            agencyName: subscription.agency.name,
            amount,
            currency: 'USD',
            paymentUrl,
          },
        });
      }

      this.logger.log(
        `Payment action required notification sent for agency: ${subscription.agency.name}`,
      );
    }
  }

  private async handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod) {
    this.logger.log(`Payment method attached: ${paymentMethod.id}`);
    // Could log this to audit trail if needed
  }

  private async handlePaymentMethodDetached(paymentMethod: Stripe.PaymentMethod) {
    this.logger.log(`Payment method detached: ${paymentMethod.id}`);
    // Could log this to audit trail if needed
  }

  private async handleCustomerCreated(customer: Stripe.Customer) {
    this.logger.log(`Customer created: ${customer.id}`);

    if (customer.metadata?.agencyId) {
      await this.prisma.agency.update({
        where: { id: customer.metadata.agencyId },
        data: { stripeCustomerId: customer.id },
      });
    }
  }

  private async handleCustomerUpdated(customer: Stripe.Customer) {
    this.logger.log(`Customer updated: ${customer.id}`);
    // Could sync customer data if needed
  }

  private async handleCustomerDeleted(customer: Stripe.Customer) {
    this.logger.log(`Customer deleted: ${customer.id}`);

    const agency = await this.prisma.agency.findFirst({
      where: { stripeCustomerId: customer.id },
    });

    if (agency) {
      await this.prisma.agency.update({
        where: { id: agency.id },
        data: { stripeCustomerId: null },
      });
    }
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    this.logger.log(`Checkout completed: ${session.id}`);

    // The subscription will be created via subscription.created webhook
    // This is mainly for confirmation/logging
    if (session.metadata?.agencyId) {
      this.logger.log(
        `Checkout successful for agency: ${session.metadata.agencyId}`,
      );
    }
  }

  // =====================================================
  // YEXT WEBHOOKS
  // =====================================================

  async handleYextWebhook(webhookData: any) {
    this.logger.log('Handling Yext webhook');

    // Store webhook event
    await this.storeWebhookEvent('yext', webhookData.type || 'unknown', webhookData);

    try {
      // Yext webhooks typically notify about:
      // - Location updates
      // - Publisher status changes
      // - Review notifications

      const eventType = webhookData.type || webhookData.meta?.eventType;

      switch (eventType) {
        case 'LOCATION_UPDATED':
          await this.handleYextLocationUpdated(webhookData);
          break;

        case 'PUBLISHER_STATUS_CHANGED':
          await this.handleYextPublisherStatusChanged(webhookData);
          break;

        case 'REVIEW_CREATED':
          await this.handleYextReviewCreated(webhookData);
          break;

        default:
          this.logger.log(`Unhandled Yext webhook type: ${eventType}`);
      }

      await this.markWebhookProcessed(webhookData.id || 'yext-' + Date.now());
      this.logger.log('Yext webhook processed successfully');
    } catch (error) {
      this.logger.error('Error processing Yext webhook', error);
      await this.markWebhookFailed(
        webhookData.id || 'yext-' + Date.now(),
        error.message,
      );
      throw error;
    }
  }

  private async handleYextLocationUpdated(webhookData: any) {
    this.logger.log('Handling Yext location updated event');

    const yextLocationId = webhookData.locationId || webhookData.meta?.locationId;

    if (!yextLocationId) {
      this.logger.warn('No location ID in Yext webhook');
      return;
    }

    const business = await this.prisma.business.findFirst({
      where: { yextLocationId },
    });

    if (business) {
      // Update last synced timestamp
      await this.prisma.business.update({
        where: { id: business.id },
        data: {
          yextLastSyncedAt: new Date(),
          yextSyncStatus: 'synced',
        },
      });

      this.logger.log(`Updated business ${business.id} from Yext webhook`);
    }
  }

  private async handleYextPublisherStatusChanged(webhookData: any) {
    this.logger.log('Handling Yext publisher status changed event');

    const yextLocationId = webhookData.locationId || webhookData.meta?.locationId;
    const publisherId = webhookData.publisherId;
    const newStatus = webhookData.status;

    if (!yextLocationId || !publisherId) {
      this.logger.warn('Missing data in Yext publisher status webhook');
      return;
    }

    const business = await this.prisma.business.findFirst({
      where: { yextLocationId },
    });

    if (!business) {
      this.logger.warn(`Business not found for Yext location: ${yextLocationId}`);
      return;
    }

    // Find the directory by Yext publisher ID
    const directory = await this.prisma.directory.findFirst({
      where: { yextPublisherId: publisherId },
    });

    if (!directory) {
      this.logger.warn(`Directory not found for publisher: ${publisherId}`);
      return;
    }

    // Update or create business directory status
    await this.prisma.businessDirectoryStatus.upsert({
      where: {
        businessId_directoryId: {
          businessId: business.id,
          directoryId: directory.id,
        },
      },
      update: {
        status: newStatus,
        lastCheckedAt: new Date(),
      },
      create: {
        businessId: business.id,
        directoryId: directory.id,
        status: newStatus,
        isActive: true,
        lastCheckedAt: new Date(),
      },
    });

    this.logger.log(
      `Updated ${directory.name} status to ${newStatus} for business ${business.name}`,
    );
  }

  private async handleYextReviewCreated(webhookData: any) {
    this.logger.log('Handling Yext review created event');

    // TODO: Implement review handling
    // This would store the review and potentially send notifications
    const yextLocationId = webhookData.locationId || webhookData.meta?.locationId;

    if (yextLocationId) {
      this.logger.log(`New review for location: ${yextLocationId}`);
      // Could send email notification to business owner
    }
  }

  // =====================================================
  // WEBHOOK EVENT STORAGE
  // =====================================================

  private async storeWebhookEvent(
    source: string,
    eventType: string,
    payload: any,
  ) {
    try {
      const externalEventId = payload?.id || payload?.event_id || `${source}-${Date.now()}`;

      await this.prisma.webhookEvent.create({
        data: {
          source,
          eventType,
          externalEventId,
          payload,
          status: 'pending',
        },
      });
    } catch (error) {
      this.logger.error('Failed to store webhook event', error);
      // Don't throw - we still want to process the webhook
    }
  }

  private async markWebhookProcessed(eventId: string) {
    try {
      await this.prisma.webhookEvent.updateMany({
        where: {
          OR: [
            { externalId: eventId },
            { payload: { path: ['id'], equals: eventId } },
          ],
        },
        data: {
          status: 'processed',
          processedAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error('Failed to mark webhook as processed', error);
    }
  }

  private async markWebhookFailed(eventId: string, errorMessage: string) {
    try {
      await this.prisma.webhookEvent.updateMany({
        where: {
          OR: [
            { externalId: eventId },
            { payload: { path: ['id'], equals: eventId } },
          ],
        },
        data: {
          status: 'failed',
          error: errorMessage,
          processedAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error('Failed to mark webhook as failed', error);
    }
  }

  // =====================================================
  // WEBHOOK RETRY LOGIC
  // =====================================================

  async retryFailedWebhooks(limit: number = 10) {
    this.logger.log('Retrying failed webhooks');

    const failedWebhooks = await this.prisma.webhookEvent.findMany({
      where: {
        status: 'failed',
        retryCount: { lt: 3 }, // Max 3 retries
      },
      take: limit,
      orderBy: { createdAt: 'asc' },
    });

    for (const webhook of failedWebhooks) {
      try {
        if (webhook.source === 'stripe') {
          await this.handleStripeWebhook(webhook.payload as any);
        } else if (webhook.source === 'yext') {
          await this.handleYextWebhook(webhook.payload);
        }

        await this.prisma.webhookEvent.update({
          where: { id: webhook.id },
          data: {
            status: 'processed',
            processedAt: new Date(),
            retryCount: { increment: 1 },
          },
        });
      } catch (error) {
        this.logger.error(`Failed to retry webhook ${webhook.id}`, error);

        await this.prisma.webhookEvent.update({
          where: { id: webhook.id },
          data: {
            retryCount: { increment: 1 },
            error: error.message,
          },
        });
      }
    }

    this.logger.log(`Retried ${failedWebhooks.length} failed webhooks`);
    return failedWebhooks.length;
  }
}
