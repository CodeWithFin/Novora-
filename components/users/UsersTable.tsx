'use client';

import { useState } from 'react';
import { Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { UserRoleBadge } from '@/components/users/UserRoleBadge';
import {
  useUsers,
  useInvites,
  useUpdateUser,
  useDeleteUser,
  useDeleteInvite,
} from '@/lib/hooks/useUsers';
import { useAuth } from '@/lib/hooks/useAuth';
import { formatDate } from '@/shared/utils/format';
import type { Role } from '@/shared/types/api';

export function UsersTable() {
  const { user: currentUser } = useAuth();
  const { data: users, isLoading: usersLoading, isError, refetch } = useUsers();
  const { data: invites, isLoading: invitesLoading } = useInvites();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const deleteInvite = useDeleteInvite();

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleRoleChange = async (id: string, role: Role) => {
    try {
      await updateUser.mutateAsync({ id, data: { role } });
      toast.success('Role updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update role');
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await updateUser.mutateAsync({ id, data: { isActive: !isActive } });
      toast.success(isActive ? 'User deactivated' : 'User activated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update user');
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    try {
      await deleteUser.mutateAsync(deleteTarget);
      toast.success('User removed');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  const handleCancelInvite = async (id: string) => {
    try {
      await deleteInvite.mutateAsync(id);
      toast.success('Invite cancelled');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel invite');
    }
  };

  if (usersLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="py-8 text-center text-sm text-danger">
        Failed to load users.{' '}
        <button type="button" onClick={() => refetch()} className="underline">
          Retry
        </button>
      </p>
    );
  }

  const members = users ?? [];
  const pendingInvites = invites ?? [];

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-4 font-display text-lg font-semibold">
          Active Members
        </h2>
        {members.length === 0 ? (
          <EmptyState icon={Users} title="No team members" />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border-subtle">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => {
                  const isSelf = member.id === currentUser?.id;
                  return (
                    <TableRow key={member.id}>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>
                        {member.displayName ?? '—'}
                      </TableCell>
                      <TableCell>
                        {isSelf ? (
                          <UserRoleBadge role={member.role} />
                        ) : (
                          <Select
                            value={member.role}
                            onValueChange={(v) =>
                              handleRoleChange(member.id, v as Role)
                            }
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="staff">Staff</SelectItem>
                              <SelectItem value="viewer">Viewer</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {formatDate(member.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={member.isActive ? 'success' : 'default'}
                        >
                          {member.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {!isSelf && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleToggleActive(
                                  member.id,
                                  member.isActive
                                )
                              }
                            >
                              {member.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteTarget(member.id)}
                            >
                              <Trash2 className="h-4 w-4 text-danger" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 font-display text-lg font-semibold">
          Pending Invites
        </h2>
        {invitesLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : pendingInvites.length === 0 ? (
          <p className="text-sm text-foreground-muted">No pending invites.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border-subtle">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingInvites.map((invite) => {
                  const expired =
                    new Date(invite.expiresAt).getTime() < Date.now();
                  return (
                    <TableRow
                      key={invite.id}
                      className={expired ? 'opacity-50' : undefined}
                    >
                      <TableCell>{invite.email}</TableCell>
                      <TableCell>
                        <UserRoleBadge role={invite.role} />
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {formatDate(invite.createdAt)}
                      </TableCell>
                      <TableCell>
                        {expired ? (
                          <Badge variant="danger">Expired</Badge>
                        ) : (
                          <span className="font-mono text-xs">
                            {formatDate(invite.expiresAt)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {!expired && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancelInvite(invite.id)}
                          >
                            Cancel
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Remove user"
        description="This will permanently remove the user from your organization."
        confirmLabel="Remove"
        variant="destructive"
        loading={deleteUser.isPending}
        onConfirm={handleDeleteUser}
      />
    </div>
  );
}
