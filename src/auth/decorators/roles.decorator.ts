import { SetMetadata } from '@nestjs/common';
import { ROLE } from '../../../generated/prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: ROLE[]) => SetMetadata(ROLES_KEY, roles);
