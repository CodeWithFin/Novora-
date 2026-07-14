'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { UsersTable } from '@/components/users/UsersTable';
import { InviteUserDialog } from '@/components/users/InviteUserDialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/hooks/useAuth';

export default function UsersPage() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const [inviteOpen, setInviteOpen] = useState(false);

  useEffect(() => {
    if (!isAdmin) router.replace('/dashboard');
  }, [isAdmin, router]);

  if (!isAdmin) return null;

  return (
    <div>
      <PageHeader title="Team">
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite User
        </Button>
      </PageHeader>
      <UsersTable />
      <InviteUserDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  );
}
