import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BusinessesService } from './businesses.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AgencyGuard } from '../auth/guards/agency.guard';
import { GetCurrentUser, CurrentUser } from '../auth/decorators/current-user.decorator';
import { Query } from '@nestjs/common';
import { CreateBusinessDto, UpdateBusinessDto } from './dto/business.dto';

@ApiTags('businesses')
@ApiBearerAuth()
@Controller('businesses')
@UseGuards(JwtAuthGuard, AgencyGuard)
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new business' })
  @ApiResponse({ status: 201, description: 'Business created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(
    @Body() createBusinessDto: CreateBusinessDto,
    @GetCurrentUser() user: any,
  ) {
    return this.businessesService.create(createBusinessDto, user.agencyId, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all businesses for agency' })
  @ApiResponse({ status: 200, description: 'Returns all businesses' })
  async findAll(@GetCurrentUser() user: any, @Query() filters: { status?: string, search?: string }) {
    return this.businessesService.findAll(user.agencyId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get business by ID' })
  @ApiResponse({ status: 200, description: 'Returns business details' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  async findOne(@Param('id') id: string, @GetCurrentUser() user: any) {
    return this.businessesService.findOne(id, user.agencyId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update business' })
  @ApiResponse({ status: 200, description: 'Business updated successfully' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  async update(
    @Param('id') id: string,
    @Body() updateBusinessDto: UpdateBusinessDto,
    @GetCurrentUser() user: any,
  ) {
    return this.businessesService.update(id, updateBusinessDto, user.agencyId, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete business' })
  @ApiResponse({ status: 204, description: 'Business deleted successfully' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  async remove(@Param('id') id: string, @GetCurrentUser() user: any) {
    return this.businessesService.delete(id, user.agencyId, user.id);
  }
}
