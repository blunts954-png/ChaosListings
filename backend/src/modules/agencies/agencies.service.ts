import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { CustomLogger } from '../../common/services/logger.service';
import { CreateAgencyDto } from './dto/create-agency.dto';
import { UpdateAgencyDto } from './dto/update-agency.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AgenciesService {
  constructor(
    private prisma: PrismaService,
    private logger: CustomLogger,
  ) {
    this.logger.setContext('AgenciesService');
  }

  async create(createAgencyDto: CreateAgencyDto, ownerId: string) {
    this.logger.log(`Creating agency: ${createAgencyDto.name}`);

    // Check if slug is already taken
    const existing = await this.prisma.agency.findUnique({
      where: { slug: createAgencyDto.slug },
    });

    if (existing) {
      throw new ConflictException(
        `Agency with slug '${createAgencyDto.slug}' already exists`,
      );
    }

    // Create agency and owner membership in a transaction
    const agency = await this.prisma.$transaction(async (tx) => {
      const newAgency = await tx.agency.create({
        data: {
          name: createAgencyDto.name,
          slug: createAgencyDto.slug,
          email: createAgencyDto.email,
          phone: createAgencyDto.phone,
          website: createAgencyDto.website,
          logoUrl: createAgencyDto.logoUrl,
          settings: createAgencyDto.settings || {},
        },
        include: {
          memberships: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });

      // Create owner membership
      await tx.agencyMembership.create({
        data: {
          agencyId: newAgency.id,
          userId: ownerId,
          role: 'owner',
          status: 'active',
        },
      });

      return newAgency;
    });

    this.logger.log(`Agency created: ${agency.id}`);
    return agency;
  }

  async findAll(userId: string) {
    this.logger.log(`Finding all agencies for user: ${userId}`);

    const memberships = await this.prisma.agencyMembership.findMany({
      where: {
        userId,
        status: 'active',
        agency: {
          deletedAt: null,
        },
      },
      include: {
        agency: {
          include: {
            _count: {
              select: {
                businesses: true,
                memberships: true,
              },
            },
          },
        },
      },
    });

    return memberships.map((m) => ({
      ...m.agency,
      role: m.role,
      businessCount: m.agency._count.businesses,
      memberCount: m.agency._count.memberships,
    }));
  }

  async findOne(agencyId: string, userId: string) {
    this.logger.log(`Finding agency: ${agencyId} for user: ${userId}`);

    await this.verifyMembership(agencyId, userId);

    const agency = await this.prisma.agency.findUnique({
      where: { id: agencyId, deletedAt: null },
      include: {
        memberships: {
          where: { status: 'active' },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
        subscriptions: {
          where: { status: { in: ['active', 'trialing'] } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            businesses: true,
            jobs: true,
          },
        },
      },
    });

    if (!agency) {
      throw new NotFoundException('Agency not found');
    }

    return agency;
  }

  async update(
    agencyId: string,
    updateAgencyDto: UpdateAgencyDto,
    userId: string,
  ) {
    this.logger.log(`Updating agency: ${agencyId}`);

    await this.verifyAdminAccess(agencyId, userId);

    // Check slug uniqueness if updating
    if (updateAgencyDto.slug) {
      const existing = await this.prisma.agency.findUnique({
        where: { slug: updateAgencyDto.slug },
      });

      if (existing && existing.id !== agencyId) {
        throw new ConflictException(
          `Agency with slug '${updateAgencyDto.slug}' already exists`,
        );
      }
    }

    const agency = await this.prisma.agency.update({
      where: { id: agencyId, deletedAt: null },
      data: {
        ...(updateAgencyDto.name && { name: updateAgencyDto.name }),
        ...(updateAgencyDto.slug && { slug: updateAgencyDto.slug }),
        ...(updateAgencyDto.email && { email: updateAgencyDto.email }),
        ...(updateAgencyDto.phone !== undefined && {
          phone: updateAgencyDto.phone,
        }),
        ...(updateAgencyDto.website !== undefined && {
          website: updateAgencyDto.website,
        }),
        ...(updateAgencyDto.logoUrl !== undefined && {
          logoUrl: updateAgencyDto.logoUrl,
        }),
        ...(updateAgencyDto.settings && {
          settings: updateAgencyDto.settings,
        }),
      },
    });

    this.logger.log(`Agency updated: ${agency.id}`);
    return agency;
  }

  async remove(agencyId: string, userId: string) {
    this.logger.log(`Soft deleting agency: ${agencyId}`);

    await this.verifyOwnerAccess(agencyId, userId);

    const agency = await this.prisma.agency.update({
      where: { id: agencyId, deletedAt: null },
      data: {
        deletedAt: new Date(),
        status: 'inactive',
      },
    });

    this.logger.log(`Agency soft deleted: ${agency.id}`);
    return { message: 'Agency deleted successfully' };
  }

  // =====================================================
  // TEAM MANAGEMENT
  // =====================================================

  async inviteMember(
    agencyId: string,
    inviteMemberDto: InviteMemberDto,
    inviterId: string,
  ) {
    this.logger.log(
      `Inviting member to agency ${agencyId}: ${inviteMemberDto.email}`,
    );

    await this.verifyAdminAccess(agencyId, inviterId);

    // Check if user exists, create if not
    let user = await this.prisma.user.findUnique({
      where: { email: inviteMemberDto.email },
    });

    if (!user) {
      // Create user with temporary password (they'll need to reset it)
      const tempPassword = Math.random().toString(36).slice(-12);
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      user = await this.prisma.user.create({
        data: {
          email: inviteMemberDto.email,
          passwordHash,
          firstName: inviteMemberDto.firstName,
          lastName: inviteMemberDto.lastName,
          status: 'active',
        },
      });

      // TODO: Send email with invitation link and temp password
      this.logger.log(`New user created: ${user.id} (needs email invitation)`);
    }

    // Check if already a member
    const existingMembership = await this.prisma.agencyMembership.findFirst({
      where: {
        agencyId,
        userId: user.id,
      },
    });

    if (existingMembership) {
      if (existingMembership.status === 'active') {
        throw new ConflictException('User is already a member of this agency');
      }

      // Reactivate if previously inactive
      const membership = await this.prisma.agencyMembership.update({
        where: { id: existingMembership.id },
        data: {
          status: 'active',
          role: inviteMemberDto.role,
          invitedBy: inviterId,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
      });

      return membership;
    }

    // Create new membership
    const membership = await this.prisma.agencyMembership.create({
      data: {
        agencyId,
        userId: user.id,
        role: inviteMemberDto.role,
        status: 'pending',
        invitedBy: inviterId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    this.logger.log(`Member invited: ${membership.id}`);
    return membership;
  }

  async updateMember(
    agencyId: string,
    membershipId: string,
    updateMemberDto: UpdateMemberDto,
    userId: string,
  ) {
    this.logger.log(`Updating member ${membershipId} in agency ${agencyId}`);

    await this.verifyAdminAccess(agencyId, userId);

    const membership = await this.prisma.agencyMembership.findFirst({
      where: {
        id: membershipId,
        agencyId,
      },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    // Prevent changing the last owner's role
    if (membership.role === 'owner' && updateMemberDto.role !== 'owner') {
      const ownerCount = await this.prisma.agencyMembership.count({
        where: {
          agencyId,
          role: 'owner',
          status: 'active',
        },
      });

      if (ownerCount <= 1) {
        throw new BadRequestException(
          'Cannot change the role of the last owner',
        );
      }
    }

    const updated = await this.prisma.agencyMembership.update({
      where: { id: membershipId },
      data: {
        ...(updateMemberDto.role && { role: updateMemberDto.role }),
        ...(updateMemberDto.permissions && {
          permissions: updateMemberDto.permissions,
        }),
        ...(updateMemberDto.status && { status: updateMemberDto.status }),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    this.logger.log(`Member updated: ${updated.id}`);
    return updated;
  }

  async removeMember(agencyId: string, membershipId: string, userId: string) {
    this.logger.log(`Removing member ${membershipId} from agency ${agencyId}`);

    await this.verifyAdminAccess(agencyId, userId);

    const membership = await this.prisma.agencyMembership.findFirst({
      where: {
        id: membershipId,
        agencyId,
      },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    // Prevent removing the last owner
    if (membership.role === 'owner') {
      const ownerCount = await this.prisma.agencyMembership.count({
        where: {
          agencyId,
          role: 'owner',
          status: 'active',
        },
      });

      if (ownerCount <= 1) {
        throw new BadRequestException('Cannot remove the last owner');
      }
    }

    await this.prisma.agencyMembership.delete({
      where: { id: membershipId },
    });

    this.logger.log(`Member removed: ${membershipId}`);
    return { message: 'Member removed successfully' };
  }

  async getMembers(agencyId: string, userId: string) {
    this.logger.log(`Getting members for agency: ${agencyId}`);

    await this.verifyMembership(agencyId, userId);

    const memberships = await this.prisma.agencyMembership.findMany({
      where: {
        agencyId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            lastLoginAt: true,
            status: true,
          },
        },
        inviter: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    });

    return memberships;
  }

  // =====================================================
  // HELPER METHODS
  // =====================================================

  private async verifyMembership(
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

  private async verifyAdminAccess(
    agencyId: string,
    userId: string,
  ): Promise<void> {
    const membership = await this.prisma.agencyMembership.findFirst({
      where: {
        agencyId,
        userId,
        status: 'active',
        role: { in: ['owner', 'admin'] },
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'You do not have admin access to this agency',
      );
    }
  }

  private async verifyOwnerAccess(
    agencyId: string,
    userId: string,
  ): Promise<void> {
    const membership = await this.prisma.agencyMembership.findFirst({
      where: {
        agencyId,
        userId,
        status: 'active',
        role: 'owner',
      },
    });

    if (!membership) {
      throw new ForbiddenException('Only agency owners can perform this action');
    }
  }
}
