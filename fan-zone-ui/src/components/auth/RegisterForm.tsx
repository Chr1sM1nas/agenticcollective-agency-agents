import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { trackEvent } from '../../utils/analytics';

const registerSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterForm: React.FC = () => {
  const { register: registerUser, isLoading, error } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    trackEvent('registration_submitted', { method: 'email' });
    const result = await registerUser(data.displayName, data.email, data.password);
    if (result.meta.requestStatus === 'fulfilled') {
      trackEvent('registration_succeeded', { method: 'email' });
      return;
    }

    trackEvent('registration_failed', { method: 'email' });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-3 text-red-300 text-sm">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-200 mb-1">Display Name</label>
        <input
          {...register('displayName')}
          type="text"
          placeholder="Your fan name"
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition-colors"
        />
        {errors.displayName && <p className="text-red-400 text-xs mt-1">{errors.displayName.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-200 mb-1">Email</label>
        <input
          {...register('email')}
          type="email"
          placeholder="you@example.com"
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition-colors"
        />
        {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-200 mb-1">Password</label>
        <div className="relative">
          <input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            placeholder="Min 8 characters"
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 pr-10 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-200 mb-1">Confirm Password</label>
        <div className="relative">
          <input
            {...register('confirmPassword')}
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Re-enter password"
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 pr-10 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-900 disabled:cursor-not-allowed text-slate-950 font-semibold rounded-lg px-4 py-2.5 transition-colors flex items-center justify-center gap-2"
      >
        {isLoading ? <><LoadingSpinner size="sm" color="text-white" /> Creating account...</> : 'Create Account'}
      </button>
    </form>
  );
};
