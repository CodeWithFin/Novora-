'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { loginSchema } from '@/lib/schemas/auth.schema';
import { login } from '@/lib/api/auth';
import { useAuth } from '@/lib/hooks/useAuth';
import type { z } from 'zod';

type LoginForm = z.infer<typeof loginSchema>;

const inputClass =
  'border-neutral-300 bg-white font-semibold text-neutral-900 placeholder:text-neutral-400';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      const result = await login(data);
      setAuth(result.user, result.org, result.token);
      router.push('/dashboard');
    } catch {
      toast.error('Invalid email or password');
    }
  };

  return (
    <Card className="w-full max-w-md border-2 border-black bg-white/95 shadow-[0_18px_40px_rgba(2,8,23,0.12)]">
      <CardHeader className="text-center">
        <CardTitle
          className="text-4xl text-black"
          style={{ fontFamily: "'Chewy', cursive" }}
        >
          Welcome back
        </CardTitle>
        <CardDescription className="text-base font-semibold text-slate-600">
          Log in to your warehouse workspace
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="font-bold text-neutral-800">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              className={inputClass}
              autoComplete="email"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-danger">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="font-bold text-neutral-800">
              Password
            </Label>
            <PasswordInput
              id="password"
              className={inputClass}
              autoComplete="current-password"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-danger">{errors.password.message}</p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full bg-[#13a8ff] text-base font-bold text-white hover:bg-[#068ee5]"
            style={{ fontFamily: "'Patrick Hand', sans-serif", height: 48 }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm font-semibold text-slate-600">
          New to Novora?{' '}
          <Link href="/signup" className="text-[#13a8ff] hover:underline">
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
