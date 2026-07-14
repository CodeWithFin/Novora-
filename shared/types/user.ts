import type { Role } from './api';

export interface TeamMember {
  id: string;
  orgId: string;
  email: string;
  displayName: string | null;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export interface Invite {
  id: string;
  orgId: string;
  email: string;
  role: Role;
  token: string;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
}
