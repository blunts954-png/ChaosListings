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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AgenciesService } from './agencies.service';
import { CreateAgencyDto } from './dto/create-agency.dto';
import { UpdateAgencyDto } from './dto/update-agency.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';

@ApiTags('agencies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('agencies')
export class AgenciesController {
  constructor(private readonly agenciesService: AgenciesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new agency' })
  @ApiResponse({
    status: 201,
    description: 'Agency created successfully',
  })
  @ApiResponse({ status: 409, description: 'Agency slug already exists' })
  create(@Body() createAgencyDto: CreateAgencyDto, @Request() req) {
    return this.agenciesService.create(createAgencyDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all agencies for current user' })
  @ApiResponse({
    status: 200,
    description: 'List of agencies',
  })
  findAll(@Request() req) {
    return this.agenciesService.findAll(req.user.userId);
  }

  @Get(':agencyId')
  @ApiOperation({ summary: 'Get agency details' })
  @ApiParam({ name: 'agencyId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Agency details',
  })
  @ApiResponse({ status: 404, description: 'Agency not found' })
  findOne(@Param('agencyId') agencyId: string, @Request() req) {
    return this.agenciesService.findOne(agencyId, req.user.userId);
  }

  @Patch(':agencyId')
  @ApiOperation({ summary: 'Update agency' })
  @ApiParam({ name: 'agencyId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Agency updated successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Agency not found' })
  update(
    @Param('agencyId') agencyId: string,
    @Body() updateAgencyDto: UpdateAgencyDto,
    @Request() req,
  ) {
    return this.agenciesService.update(agencyId, updateAgencyDto, req.user.userId);
  }

  @Delete(':agencyId')
  @ApiOperation({ summary: 'Delete agency (soft delete)' })
  @ApiParam({ name: 'agencyId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Agency deleted successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Owner access required' })
  @ApiResponse({ status: 404, description: 'Agency not found' })
  remove(@Param('agencyId') agencyId: string, @Request() req) {
    return this.agenciesService.remove(agencyId, req.user.userId);
  }

  // =====================================================
  // TEAM MANAGEMENT
  // =====================================================

  @Get(':agencyId/members')
  @ApiOperation({ summary: 'Get all agency members' })
  @ApiParam({ name: 'agencyId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'List of agency members',
  })
  getMembers(@Param('agencyId') agencyId: string, @Request() req) {
    return this.agenciesService.getMembers(agencyId, req.user.userId);
  }

  @Post(':agencyId/members')
  @ApiOperation({ summary: 'Invite a member to the agency' })
  @ApiParam({ name: 'agencyId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 201,
    description: 'Member invited successfully',
  })
  @ApiResponse({ status: 409, description: 'User is already a member' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  inviteMember(
    @Param('agencyId') agencyId: string,
    @Body() inviteMemberDto: InviteMemberDto,
    @Request() req,
  ) {
    return this.agenciesService.inviteMember(
      agencyId,
      inviteMemberDto,
      req.user.userId,
    );
  }

  @Patch(':agencyId/members/:membershipId')
  @ApiOperation({ summary: 'Update agency member' })
  @ApiParam({ name: 'agencyId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'membershipId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Member updated successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  updateMember(
    @Param('agencyId') agencyId: string,
    @Param('membershipId') membershipId: string,
    @Body() updateMemberDto: UpdateMemberDto,
    @Request() req,
  ) {
    return this.agenciesService.updateMember(
      agencyId,
      membershipId,
      updateMemberDto,
      req.user.userId,
    );
  }

  @Delete(':agencyId/members/:membershipId')
  @ApiOperation({ summary: 'Remove agency member' })
  @ApiParam({ name: 'agencyId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'membershipId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Member removed successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  removeMember(
    @Param('agencyId') agencyId: string,
    @Param('membershipId') membershipId: string,
    @Request() req,
  ) {
    return this.agenciesService.removeMember(
      agencyId,
      membershipId,
      req.user.userId,
    );
  }
}
