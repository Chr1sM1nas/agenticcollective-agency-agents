import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../common/LoadingSpinner';

const CURRENT_YEAR = new Date().getFullYear();

const ageSchema = z.object({
  day: z.string().min(1, 'Day required'),
  month: z.string().min(1, 'Month required'),
  year: z.string().min(1, 'Year required'),
}).superRefine((data, ctx) => {
  const dob = new Date(parseInt(data.year), parseInt(data.month) - 1, parseInt(data.day));
  const age = (Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  if (age < 18) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'You must be 18 or older to access this content',
      path: ['year'],
    });
  }
});

type AgeFormData = z.infer<typeof ageSchema>;

export const AgeVerificationForm: React.FC = () => {
  const { setAgeVerified, isLoading } = useAuth();

  const { register, handleSubmit, formState: { errors } } = useForm<AgeFormData>({
    resolver: zodResolver(ageSchema),
  });

  const onSubmit = (_data: AgeFormData) => {
    setAgeVerified();
  };

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const years = Array.from({ length: 100 }, (_, i) => CURRENT_YEAR - 18 - i);

  const selectClass = "w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500 transition-colors";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Date of Birth</label>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <select {...register('day')} className={selectClass}>
              <option value="">Day</option>
              {days.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <select {...register('month')} className={selectClass}>
              <option value="">Month</option>
              {months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div>
            <select {...register('year')} className={selectClass}>
              <option value="">Year</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
        {errors.day && <p className="text-red-400 text-xs mt-1">{errors.day.message}</p>}
        {errors.month && <p className="text-red-400 text-xs mt-1">{errors.month.message}</p>}
        {errors.year && <p className="text-red-400 text-xs mt-1">{errors.year.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-800 text-white font-semibold rounded-lg px-4 py-2.5 transition-colors flex items-center justify-center gap-2"
      >
        {isLoading ? <><LoadingSpinner size="sm" color="text-white" /> Verifying...</> : 'Verify Age'}
      </button>
    </form>
  );
};
