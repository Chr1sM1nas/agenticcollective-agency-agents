import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { trackEvent } from '../../utils/analytics';

const CURRENT_YEAR = new Date().getFullYear();

const ageSchema = z.object({
  day: z.string().min(1, 'Day required'),
  month: z.string().min(1, 'Month required'),
  year: z.string().min(1, 'Year required'),
}).superRefine((data, ctx) => {
  const day = parseInt(data.day, 10);
  const month = parseInt(data.month, 10);
  const year = parseInt(data.year, 10);

  const dob = new Date(year, month - 1, day);
  const isRealDate =
    dob.getFullYear() === year &&
    dob.getMonth() === month - 1 &&
    dob.getDate() === day;

  if (!isRealDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Enter a valid date of birth',
      path: ['day'],
    });
    return;
  }

  if (dob.getTime() > Date.now()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Date of birth cannot be in the future',
      path: ['day'],
    });
  }
});

type AgeFormData = z.infer<typeof ageSchema>;

export const AgeVerificationForm: React.FC = () => {
  const { verifyAge, isLoading, error } = useAuth();

  const { register, handleSubmit, formState: { errors } } = useForm<AgeFormData>({
    resolver: zodResolver(ageSchema),
  });

  const onSubmit = async (data: AgeFormData) => {
    trackEvent('age_verification_submitted');
    const result = await verifyAge(
      parseInt(data.day, 10),
      parseInt(data.month, 10),
      parseInt(data.year, 10)
    );

    if (result.meta.requestStatus === 'fulfilled') {
      trackEvent('age_verification_succeeded');
      return;
    }

    trackEvent('age_verification_failed');
  };

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const years = Array.from({ length: 100 }, (_, i) => CURRENT_YEAR - 18 - i);

  const selectClass = "w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-400 transition-colors";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <p className="text-red-400 text-xs">{error}</p>}

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Date of Birth</label>
        <p className="text-xs text-slate-400 mb-3">We use this only to confirm you are 18+.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <select aria-label="Day" {...register('day')} className={selectClass}>
              <option value="">Day</option>
              {days.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <select aria-label="Month" {...register('month')} className={selectClass}>
              <option value="">Month</option>
              {months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div>
            <select aria-label="Year" {...register('year')} className={selectClass}>
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
        className="w-full fz-btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 rounded-lg px-4 py-2.5 flex items-center justify-center gap-2"
      >
        {isLoading ? <><LoadingSpinner size="sm" color="text-white" /> Verifying...</> : 'Verify Age'}
      </button>

      <p className="text-center text-xs text-slate-500">By continuing, you confirm this information is accurate.</p>
    </form>
  );
};
