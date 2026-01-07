import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../common/services/prisma.service';
import { LoggerService } from '../../common/services/logger.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

export interface JwtPayload {
  sub: string; // userId
  email: string;
  agencyId: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    agency: {
      id: string;
      name: string;
      slug: string;
    };
    role: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private logger: LoggerService,
  ) {}

  /**
   * Validate user credentials
   */
  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email, deletedAt: null },
      include: {
        memberships: {
          where: { status: 'active' },
          include: {
            agency: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('Account is not active');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Get primary agency (first active membership)
    const primaryMembership = user.memberships[0];
    if (!primaryMembership) {
      throw new UnauthorizedException('No active agency membership found');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      agency: primaryMembership.agency,
      role: primaryMembership.role,
    };
  }

  /**
   * Login user and generate JWT tokens
   */
  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      agencyId: user.agency.id,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
    });

    this.logger.log(`User logged in: ${user.email}`, 'AuthService');

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        agency: user.agency,
        role: user.role,
      },
    };
  }

  /**
   * Register new agency and admin user
   */
  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Check if agency slug exists
    const existingAgency = await this.prisma.agency.findUnique({
      where: { slug: registerDto.agencySlug },
    });

    if (existingAgency) {
      throw new ConflictException('Agency slug already taken');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(registerDto.password, salt);

    // Create agency and user in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create agency
      const agency = await tx.agency.create({
        data: {
          name: registerDto.agencyName,
          slug: registerDto.agencySlug,
          email: registerDto.email,
          plan: 'starter',
          status: 'active',
        },
      });

      // Create user
      const user = await tx.user.create({
        data: {
          email: registerDto.email,
          passwordHash,
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
          status: 'active',
          emailVerified: false,
        },
      });

      // Create membership
      await tx.agencyMembership.create({
        data: {
          agencyId: agency.id,
          userId: user.id,
          role: 'owner',
          status: 'active',
        },
      });

      return { agency, user };
    });

    this.logger.log(
      `New agency registered: ${result.agency.name} (${result.user.email})`,
      'AuthService',
    );

    // Generate tokens
    const payload: JwtPayload = {
      sub: result.user.id,
      email: result.user.email,
      agencyId: result.agency.id,
      role: 'owner',
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        agency: {
          id: result.agency.id,
          name: result.agency.name,
          slug: result.agency.slug,
        },
        role: 'owner',
      },
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken);

      const newPayload: JwtPayload = {
        sub: payload.sub,
        email: payload.email,
        agencyId: payload.agencyId,
        role: payload.role,
      };

      const accessToken = this.jwtService.sign(newPayload);

      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Verify JWT token
   */
  async verifyToken(token: string): Promise<JwtPayload> {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        phone: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        memberships: {
          where: { status: 'active' },
          select: {
            role: true,
            agency: {
              select: {
                id: true,
                name: true,
                slug: true,
                logoUrl: true,
                plan: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}
