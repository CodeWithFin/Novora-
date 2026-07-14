import api, { getData } from './client';

export async function getOrg() {
  return getData<{
    id: string;
    name: string;
    slug: string;
    email: string;
    userCount: number;
  }>(await api.get('/orgs/me'));
}

export async function updateOrg(data: {
  name?: string;
  email?: string;
}) {
  return getData<{ id: string; name: string; email: string }>(
    await api.patch('/orgs/me', data)
  );
}
