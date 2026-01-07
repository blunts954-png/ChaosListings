import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../common/services/prisma.service';
import { JwtPayload } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret'),
    });
  }

  async validate(payload: JwtPayload) {
    // Verify user still exists and is active
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        status: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt || user.status !== 'active') {
      throw new UnauthorizedException('User account is not active');
    }

    // Verify agency membership still exists and is active
    const membership = await this.prisma.agencyMembership.findFirst({
      where: {
        userId: payload.sub,
        agencyId: payload.agencyId,
        status: 'active',
      },
    });

    if (!membership) {
      throw new UnauthorizedException('Agency membership not found or inactive');
    }

    // Return user context for request
    return {
      userId: payload.sub,
      email: payload.email,
      agencyId: payload.agencyId,
      role: payload.role,
    };
  }
}
