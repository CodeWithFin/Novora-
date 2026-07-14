import type { Role } from './api';

export interface User {
  id: string;
  orgId: string;
  email: string;
  displayName: string | null;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export interface Org {
  id: string;
  name: string;
  slug: string;
  email: string;
  isActive: boolean;
  createdAt: string;
}

export interface AuthPayload {
  token: string;
  user: User;
  org: Org;
}
