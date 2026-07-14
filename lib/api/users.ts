import api, { getData } from './client';
import type { TeamMember, Invite } from '@/shared/types/user';

export async function getUsers() {
  return getData<TeamMember[]>(await api.get('/users'));
}

export async function updateUser(
  id: string,
  data: Partial<{ role: string; isActive: boolean }>
) {
  return getData<TeamMember>(await api.patch(`/users/${id}`, data));
}

export async function deleteUser(id: string) {
  return getData<{ deleted: boolean }>(
    await api.delete(`/users/${id}`)
  );
}

export async function getInvites() {
  return getData<Invite[]>(await api.get('/invites'));
}

export async function createInvite(data: {
  email: string;
  role: string;
}) {
  return getData<Invite>(await api.post('/invites', data));
}

export async function deleteInvite(id: string) {
  return getData<{ deleted: boolean }>(
    await api.delete(`/invites/${id}`)
  );
}
