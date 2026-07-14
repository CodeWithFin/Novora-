'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { UserRoleBadge } from '@/components/users/UserRoleBadge';
import {
  changePasswordSchema,
} from '@/lib/schemas/auth.schema';
import { changePassword } from '@/lib/api/auth';
import { updateOrg } from '@/lib/api/orgs';
import { useAuth } from '@/lib/hooks/useAuth';
import { useOrg } from '@/lib/hooks/useOrg';
import type { z } from 'zod';

type PasswordForm = z.infer<typeof changePasswordSchema>;

export default function SettingsPage() {
  const { user, isAdmin } = useAuth();
  const { data: org, refetch } = useOrg();

  const {
    register: registerOrg,
    handleSubmit: handleOrgSubmit,
    formState: { isSubmitting: orgSubmitting },
  } = useForm({
    defaultValues: {
      name: org?.name ?? '',
      email: org?.email ?? '',
    },
    values: org
      ? { name: org.name, email: org.email }
      : undefined,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordForm>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onOrgSubmit = async (data: { name: string; email: string }) => {
    try {
      await updateOrg(data);
      toast.success('Organization updated');
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const onPasswordSubmit = async (data: PasswordForm) => {
    try {
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Password updated');
      reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Password change failed');
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Settings" />

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">
              Organization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleOrgSubmit(onOrgSubmit)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization Name</Label>
                <Input id="org-name" {...registerOrg('name')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-email">Contact Email</Label>
                <Input
                  id="org-email"
                  type="email"
                  {...registerOrg('email')}
                />
              </div>
              <Button type="submit" disabled={orgSubmitting}>
                Save Organization
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-foreground-muted">Email</Label>
            <p className="text-foreground-secondary">{user?.email}</p>
          </div>
          <div>
            <Label className="text-foreground-muted">Role</Label>
            <div className="mt-1">
              {user?.role && <UserRoleBadge role={user.role} />}
            </div>
          </div>

          <Separator />

          <form
            onSubmit={handleSubmit(onPasswordSubmit)}
            className="space-y-4"
          >
            <h4 className="font-medium">Change Password</h4>
            <div className="space-y-2">
              <Label htmlFor="current">Current Password</Label>
              <Input
                id="current"
                type="password"
                {...register('currentPassword')}
              />
              {errors.currentPassword && (
                <p className="text-sm text-danger">
                  {errors.currentPassword.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="new">New Password</Label>
              <Input id="new" type="password" {...register('newPassword')} />
              {errors.newPassword && (
                <p className="text-sm text-danger">
                  {errors.newPassword.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm New Password</Label>
              <Input
                id="confirm"
                type="password"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-danger">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
            <Button type="submit" disabled={isSubmitting}>
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
