import { Controller, Post, Param, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('ai')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('suggestions/business/:businessId')
  @Roles(Role.AGENCY_OWNER, Role.AGENCY_MEMBER)
  async getSuggestions(@Param('businessId') businessId: string) {
    return this.aiService.generateSuggestions(businessId);
  }
}
