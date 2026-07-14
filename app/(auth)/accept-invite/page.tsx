'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { acceptInviteSchema } from '@/lib/schemas/auth.schema';
import { acceptInvite } from '@/lib/api/auth';
import { useAuth } from '@/lib/hooks/useAuth';
import type { z } from 'zod';

type AcceptForm = z.infer<typeof acceptInviteSchema>;

function AcceptInviteForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const router = useRouter();
  const { setAuth } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AcceptForm>({
    resolver: zodResolver(acceptInviteSchema),
  });

  const onSubmit = async (data: AcceptForm) => {
    if (!token) {
      toast.error('Invalid invite link');
      return;
    }
    try {
      const result = await acceptInvite({
        token,
        password: data.password,
      });
      setAuth(result.user, result.org, result.token);
      toast.success(`Welcome to ${result.org.name}!`);
      router.push('/dashboard');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to accept invite');
    }
  };

  if (!token) {
    return (
      <Card className="w-full max-w-md border-2 border-black bg-white/95 shadow-[0_18px_40px_rgba(2,8,23,0.12)]">
        <CardContent className="pt-6 text-center text-foreground-secondary">
          Invalid or missing invite token.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md border-2 border-black bg-white/95 shadow-[0_18px_40px_rgba(2,8,23,0.12)]">
      <CardHeader className="text-center">
        <CardTitle className="font-display text-4xl tracking-tight">Accept Invite</CardTitle>
        <CardDescription className="text-base font-semibold text-slate-600">
          You&apos;ve been invited to join Novora. Set your password to continue.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...register('password')} />
            {errors.password && (
              <p className="text-sm text-danger">{errors.password.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-danger">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Setting up...' : 'Accept Invite & Set Password'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      }
    >
      <AcceptInviteForm />
    </Suspense>
  );
}
