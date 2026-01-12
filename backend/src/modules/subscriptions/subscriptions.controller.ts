import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';

@ApiTags('subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('agencies/:agencyId/subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post('businesses/:businessId')
  @ApiOperation({ summary: 'Create a new subscription for a business' })
  @ApiParam({ name: 'agencyId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'businessId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 201,
    description: 'Subscription created successfully',
  })
  @ApiResponse({ status: 404, description: 'Business not found' })
  create(
    @Param('agencyId') agencyId: string,
    @Param('businessId') businessId: string,
    @Body() createSubscriptionDto: CreateSubscriptionDto,
    @Request() req,
  ) {
    return this.subscriptionsService.createSubscription(
      agencyId,
      businessId,
      createSubscriptionDto,
      req.user.userId,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all subscriptions for an agency' })
  @ApiParam({ name: 'agencyId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'List of subscriptions',
  })
  findAll(@Param('agencyId') agencyId: string, @Request() req) {
    return this.subscriptionsService.findAll(agencyId, req.user.userId);
  }

  @Get('prices')
  @ApiOperation({ summary: 'Get all available subscription prices' })
  @ApiResponse({
    status: 200,
    description: 'List of available prices',
  })
  listPrices() {
    return this.subscriptionsService.listPrices();
  }

  @Get('invoices')
  @ApiOperation({ summary: 'Get all invoices for an agency' })
  @ApiParam({ name: 'agencyId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'List of invoices',
  })
  listInvoices(@Param('agencyId') agencyId: string, @Request() req) {
    return this.subscriptionsService.listInvoices(agencyId, req.user.userId);
  }

  @Get(':subscriptionId')
  @ApiOperation({ summary: 'Get subscription details' })
  @ApiParam({ name: 'agencyId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'subscriptionId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Subscription details',
  })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  findOne(
    @Param('subscriptionId') subscriptionId: string,
    @Param('agencyId') agencyId: string,
    @Request() req,
  ) {
    return this.subscriptionsService.findOne(
      subscriptionId,
      agencyId,
      req.user.userId,
    );
  }

  @Patch(':subscriptionId')
  @ApiOperation({ summary: 'Update subscription (change plan or cancel)' })
  @ApiParam({ name: 'agencyId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'subscriptionId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Subscription updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  update(
    @Param('subscriptionId') subscriptionId: string,
    @Param('agencyId') agencyId: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
    @Request() req,
  ) {
    return this.subscriptionsService.update(
      subscriptionId,
      agencyId,
      updateSubscriptionDto,
      req.user.userId,
    );
  }

  @Delete(':subscriptionId')
  @ApiOperation({ summary: 'Cancel subscription' })
  @ApiParam({ name: 'agencyId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'subscriptionId', type: 'string', format: 'uuid' })
  @ApiQuery({
    name: 'immediately',
    required: false,
    type: 'boolean',
    description: 'Cancel immediately (true) or at period end (false, default)',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscription canceled successfully',
  })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  remove(
    @Param('subscriptionId') subscriptionId: string,
    @Param('agencyId') agencyId: string,
    @Query('immediately') immediately: string,
    @Request() req,
  ) {
    return this.subscriptionsService.cancel(
      subscriptionId,
      agencyId,
      req.user.userId,
      immediately === 'true',
    );
  }

  @Post(':subscriptionId/resume')
  @ApiOperation({ summary: 'Resume a canceled subscription' })
  @ApiParam({ name: 'agencyId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'subscriptionId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Subscription resumed successfully',
  })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  resume(
    @Param('subscriptionId') subscriptionId: string,
    @Param('agencyId') agencyId: string,
    @Request() req,
  ) {
    return this.subscriptionsService.resume(
      subscriptionId,
      agencyId,
      req.user.userId,
    );
  }

  // =====================================================
  // CHECKOUT & BILLING PORTAL
  // =====================================================

  @Post('checkout/businesses/:businessId')
  @ApiOperation({ summary: 'Create a Stripe Checkout session' })
  @ApiParam({ name: 'agencyId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'businessId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 201,
    description: 'Checkout session created',
  })
  createCheckoutSession(
    @Param('agencyId') agencyId: string,
    @Param('businessId') businessId: string,
    @Body() createCheckoutSessionDto: CreateCheckoutSessionDto,
    @Request() req,
  ) {
    return this.subscriptionsService.createCheckoutSession(
      agencyId,
      businessId,
      createCheckoutSessionDto,
      req.user.userId,
    );
  }

  @Post('billing-portal')
  @ApiOperation({ summary: 'Create a Stripe Billing Portal session' })
  @ApiParam({ name: 'agencyId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 201,
    description: 'Billing portal session created',
  })
  createBillingPortalSession(
    @Param('agencyId') agencyId: string,
    @Body('returnUrl') returnUrl: string,
    @Request() req,
  ) {
    return this.subscriptionsService.createBillingPortalSession(
      agencyId,
      returnUrl,
      req.user.userId,
    );
  }
}
