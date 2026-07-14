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
import { signupSchema } from '@/lib/schemas/auth.schema';
import { signup } from '@/lib/api/auth';
import { useAuth } from '@/lib/hooks/useAuth';
import type { z } from 'zod';

type SignupForm = z.infer<typeof signupSchema>;

const inputClass =
  'border-neutral-300 bg-white font-semibold text-neutral-900 placeholder:text-neutral-400';

export default function SignupPage() {
  const router = useRouter();
  const { setAuth } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupForm) => {
    try {
      const result = await signup({
        orgName: data.orgName,
        email: data.email,
        password: data.password,
      });
      setAuth(result.user, result.org, result.token);
      toast.success(`Welcome to Novora, ${data.orgName}!`);
      router.push('/dashboard');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Signup failed');
    }
  };

  return (
    <Card className="w-full max-w-md border-2 border-black bg-white/95 shadow-[0_18px_40px_rgba(2,8,23,0.12)]">
      <CardHeader className="text-center">
        <CardTitle
          className="text-4xl text-black"
          style={{ fontFamily: "'Chewy', cursive" }}
        >
          Create workspace
        </CardTitle>
        <CardDescription className="text-base font-semibold text-slate-600">
          Set up your organization in minutes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="orgName" className="font-bold text-neutral-800">
              Organization Name
            </Label>
            <Input
              id="orgName"
              className={inputClass}
              autoComplete="organization"
              {...register('orgName')}
            />
            {errors.orgName && (
              <p className="text-sm text-danger">{errors.orgName.message}</p>
            )}
          </div>
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
              autoComplete="new-password"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-danger">{errors.password.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="font-bold text-neutral-800">
              Confirm Password
            </Label>
            <PasswordInput
              id="confirmPassword"
              className={inputClass}
              autoComplete="new-password"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-danger">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full bg-[#13a8ff] text-base font-bold text-white hover:bg-[#068ee5]"
            style={{ fontFamily: "'Patrick Hand', sans-serif", height: 48 }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create account'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm font-semibold text-slate-600">
          Already have an account?{' '}
          <Link href="/login" className="text-[#13a8ff] hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
