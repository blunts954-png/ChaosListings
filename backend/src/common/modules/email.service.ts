import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { CustomLogger } from '../services/logger.service';

export interface SendEmailOptions {
  to: string;
  subject: string;
  template: string;
  context: Record<string, any>;
  from?: string;
}

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private templates: Map<string, handlebars.TemplateDelegate> = new Map();

  constructor(
    private configService: ConfigService,
    private logger: CustomLogger,
  ) {
    this.logger.setContext('EmailService');
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const emailProvider = this.configService.get<string>('EMAIL_PROVIDER', 'smtp');

    if (emailProvider === 'smtp') {
      this.transporter = nodemailer.createTransporter({
        host: this.configService.get<string>('SMTP_HOST'),
        port: this.configService.get<number>('SMTP_PORT', 587),
        secure: this.configService.get<boolean>('SMTP_SECURE', false),
        auth: {
          user: this.configService.get<string>('SMTP_USER'),
          pass: this.configService.get<string>('SMTP_PASS'),
        },
      });
    } else if (emailProvider === 'sendgrid') {
      // SendGrid SMTP
      this.transporter = nodemailer.createTransporter({
        host: 'smtp.sendgrid.net',
        port: 587,
        auth: {
          user: 'apikey',
          pass: this.configService.get<string>('SENDGRID_API_KEY'),
        },
      });
    }

    this.logger.log(`Email service initialized with provider: ${emailProvider}`);
  }

  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    try {
      const html = await this.renderTemplate(options.template, options.context);

      const from = options.from || this.configService.get<string>('EMAIL_FROM', 'noreply@chaoslistings.com');

      const mailOptions = {
        from,
        to: options.to,
        subject: options.subject,
        html,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent to ${options.to}: ${options.subject}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}`, error);
      return false;
    }
  }

  private async renderTemplate(
    templateName: string,
    context: Record<string, any>,
  ): Promise<string> {
    // Check cache
    if (!this.templates.has(templateName)) {
      const templatePath = path.join(
        __dirname,
        '../templates/emails',
        `${templateName}.hbs`,
      );

      try {
        const templateSource = fs.readFileSync(templatePath, 'utf-8');
        const template = handlebars.compile(templateSource);
        this.templates.set(templateName, template);
      } catch (error) {
        this.logger.error(`Template not found: ${templateName}`, error);
        throw new Error(`Email template not found: ${templateName}`);
      }
    }

    const template = this.templates.get(templateName)!;
    return template(context);
  }

  // Convenience methods for common emails

  async sendPasswordResetEmail(email: string, resetToken: string, resetUrl: string) {
    return this.sendEmail({
      to: email,
      subject: 'Reset Your Password - ChaosListings',
      template: 'password-reset',
      context: {
        resetUrl,
        resetToken,
        expiresIn: '1 hour',
      },
    });
  }

  async sendWelcomeEmail(email: string, firstName: string, agencyName: string) {
    return this.sendEmail({
      to: email,
      subject: 'Welcome to ChaosListings!',
      template: 'welcome',
      context: {
        firstName,
        agencyName,
        dashboardUrl: this.configService.get<string>('FRONTEND_URL') + '/dashboard',
      },
    });
  }

  async sendTeamInvitationEmail(
    email: string,
    inviterName: string,
    agencyName: string,
    invitationUrl: string,
  ) {
    return this.sendEmail({
      to: email,
      subject: `You've been invited to join ${agencyName} on ChaosListings`,
      template: 'team-invitation',
      context: {
        inviterName,
        agencyName,
        invitationUrl,
      },
    });
  }

  async sendTrialEndingEmail(email: string, agencyName: string, daysLeft: number) {
    return this.sendEmail({
      to: email,
      subject: `Your trial is ending in ${daysLeft} days`,
      template: 'trial-ending',
      context: {
        agencyName,
        daysLeft,
        billingUrl: this.configService.get<string>('FRONTEND_URL') + '/settings/billing',
      },
    });
  }

  async sendPaymentFailedEmail(email: string, agencyName: string, amount: number) {
    return this.sendEmail({
      to: email,
      subject: 'Payment Failed - Action Required',
      template: 'payment-failed',
      context: {
        agencyName,
        amount,
        currency: 'USD',
        billingUrl: this.configService.get<string>('FRONTEND_URL') + '/settings/billing',
      },
    });
  }

  async sendInvoiceReceiptEmail(
    email: string,
    invoiceNumber: string,
    amount: number,
    invoiceUrl: string,
  ) {
    return this.sendEmail({
      to: email,
      subject: `Invoice ${invoiceNumber} - Payment Received`,
      template: 'invoice-receipt',
      context: {
        invoiceNumber,
        amount,
        currency: 'USD',
        invoiceUrl,
        date: new Date().toLocaleDateString(),
      },
    });
  }
}
