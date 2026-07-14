import api, { getData } from './client';
import type { AuthPayload } from '@/shared/types/auth';

export async function signup(data: {
  orgName: string;
  email: string;
  password: string;
}) {
  return getData<AuthPayload>(await api.post('/auth/signup', data));
}

export async function login(data: { email: string; password: string }) {
  return getData<AuthPayload>(await api.post('/auth/login', data));
}

export async function acceptInvite(data: {
  token: string;
  password: string;
}) {
  return getData<AuthPayload>(
    await api.post('/auth/accept-invite', data)
  );
}

export async function getMe() {
  return getData<{ user: AuthPayload['user']; org: AuthPayload['org'] }>(
    await api.get('/auth/me')
  );
}

export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}) {
  return getData<{ updated: boolean }>(
    await api.patch('/users/me/password', data)
  );
}

export async function requestAccess(data: {
  name: string;
  company: string;
  email: string;
  phone?: string;
  message?: string;
}) {
  return getData<{ sent: boolean }>(
    await api.post('/notifications/request-access', data)
  );
}
