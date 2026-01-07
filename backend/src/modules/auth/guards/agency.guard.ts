import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * Agency Guard
 * Ensures that the user can only access resources belonging to their agency
 *
 * Usage:
 * - Automatically validates agencyId in request params/query matches JWT agencyId
 * - For business resources, validates business belongs to user's agency
 */
@Injectable()
export class AgencyGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.agencyId) {
      throw new ForbiddenException('No agency context found');
    }

    // If route explicitly requires agency validation
    const params = request.params;
    const query = request.query;
    const body = request.body;

    // Check if agencyId in params/query matches user's agencyId
    if (params.agencyId && params.agencyId !== user.agencyId) {
      throw new ForbiddenException('Access denied to this agency resource');
    }

    if (query.agencyId && query.agencyId !== user.agencyId) {
      throw new ForbiddenException('Access denied to this agency resource');
    }

    // For create operations, inject agencyId from JWT
    if (body && !body.agencyId) {
      body.agencyId = user.agencyId;
    }

    return true;
  }
}
