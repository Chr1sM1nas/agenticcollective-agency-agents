import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../common/LoadingSpinner';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginForm: React.FC = () => {
  const { login, isLoading, error } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormData) => {
    void login(data.email, data.password);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-3 text-red-300 text-sm">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
        <input
          {...register('email')}
          type="email"
          placeholder="you@example.com"
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-green-500 transition-colors"
        />
        {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
        <div className="relative">
          <input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            placeholder="Min 8 characters"
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 pr-10 text-white placeholder-slate-400 focus:outline-none focus:border-green-500 transition-colors"
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

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
          <input {...register('rememberMe')} type="checkbox" className="rounded border-slate-600 bg-slate-700 text-green-500" />
          Remember me
        </label>
        <button type="button" className="text-sm text-green-400 hover:text-green-300 transition-colors">
          Forgot password?
        </button>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-4 py-2.5 transition-colors flex items-center justify-center gap-2"
      >
        {isLoading ? <><LoadingSpinner size="sm" color="text-white" /> Signing in...</> : 'Sign In'}
      </button>
    </form>
  );
};
