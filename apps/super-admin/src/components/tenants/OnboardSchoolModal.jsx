import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal, Input, Button } from '@sms/ui-kit';
import { Building, ShieldCheck, AlertTriangle, Sparkles } from 'lucide-react';

const onboardingSchema = z.object({
  schoolName: z.string().trim().min(3, 'School name must be at least 3 characters'),
  slug: z.string().trim().min(3, 'Slug must be at least 3 characters').regex(/^[a-z0-9-]+$/, 'Slug must be alphanumeric & lowercase with hyphens only (e.g. st-jude-academy)'),
  contactEmail: z.string().trim().email('Valid institutional email is required'),
  planType: z.enum(['FREE', 'STANDARD', 'PREMIUM']),
  adminName: z.string().trim().min(2, 'Administrator full name is required'),
  adminEmail: z.string().trim().email('Valid administrator email is required'),
  adminPassword: z.string().min(6, 'Temporary password must be at least 6 characters')
});

const OnboardSchoolModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isPending = false,
  errorMessage = null 
}) => {
  const { 
    register, 
    handleSubmit, 
    reset, 
    watch, 
    setValue, 
    formState: { errors } 
  } = useForm({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      schoolName: '',
      slug: '',
      contactEmail: '',
      planType: 'FREE',
      adminName: '',
      adminEmail: '',
      adminPassword: ''
    }
  });

  const watchSlug = watch('slug');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      reset({
        schoolName: '',
        slug: '',
        contactEmail: '',
        planType: 'FREE',
        adminName: '',
        adminEmail: '',
        adminPassword: ''
      });
    }
  }, [isOpen, reset]);

  // Clean, reactive slug suggestion based on school name
  const handleSchoolNameChange = (e) => {
    const name = e.target.value;
    setValue('schoolName', name, { shouldValidate: true });
    // If slug is empty or previously generated from name, update it automatically
    const cleanSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    setValue('slug', cleanSlug, { shouldValidate: Boolean(cleanSlug) });
  };

  const handleFormSubmit = (data) => {
    onSubmit({
      schoolName: data.schoolName.trim(),
      slug: data.slug.toLowerCase().trim(),
      contactEmail: data.contactEmail.trim(),
      planType: data.planType,
      adminName: data.adminName.trim(),
      adminEmail: data.adminEmail.toLowerCase().trim(),
      adminPassword: data.adminPassword
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Deploy New School Tenant"
      size="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5 text-left py-1">
        
        {/* Error Banner */}
        {errorMessage && (
          <div role="alert" className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 flex items-start gap-2.5 animate-fade-in">
            <AlertTriangle size={16} className="text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-rose-900">Onboarding Request Failed</p>
              <p className="text-[11px] font-normal text-rose-700 mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Step 1: School Identity */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Building size={16} className="text-indigo-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              1. Institutional Identity & Workspace
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="School Institution Name"
              placeholder="e.g. St. Jude High School"
              error={errors.schoolName}
              required
              {...register('schoolName', { onChange: handleSchoolNameChange })}
            />

            <div>
              <Input
                label="Tenant Subdomain Slug"
                placeholder="e.g. st-jude"
                error={errors.slug}
                required
                {...register('slug')}
              />
              <div className="mt-1 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Portal domain:</span>
                <span className="text-indigo-600 font-mono font-medium truncate max-w-[200px]">
                  {watchSlug ? `https://${watchSlug}.sms.edu` : 'https://[slug].sms.edu'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Official Institutional Contact Email"
              type="email"
              placeholder="contact@stjude.edu"
              error={errors.contactEmail}
              required
              {...register('contactEmail')}
            />

            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Subscription Plan Tier <span className="text-rose-500">*</span>
              </label>
              <select
                {...register('planType')}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
              >
                <option value="FREE">FREE — Starter Evaluation Tier (100 Students)</option>
                <option value="STANDARD">STANDARD — Growth School Tier (500 Students)</option>
                <option value="PREMIUM">PREMIUM — Enterprise Scale Tier (Unlimited)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Step 2: Primary School Administrator */}
        <div className="space-y-4 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <ShieldCheck size={16} className="text-indigo-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              2. Initial School Administrator
            </h4>
          </div>

          <Input
            label="Administrator Full Name"
            placeholder="e.g. Dr. Eleanor Vance"
            error={errors.adminName}
            required
            {...register('adminName')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Admin Login Email"
              type="email"
              placeholder="principal@stjude.edu"
              error={errors.adminEmail}
              required
              {...register('adminEmail')}
            />

            <Input
              label="Temporary Password"
              type="password"
              placeholder="••••••••"
              error={errors.adminPassword}
              required
              {...register('adminPassword')}
            />
          </div>

          <p className="text-[11px] text-slate-400 leading-normal bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <strong>Security Notice:</strong> The School Admin will receive platform credentials to manage their school's users, academic calendars, and daily school operations.
          </p>
        </div>

        {/* Modal Actions */}
        <div className="sticky bottom-0 -mx-5 sm:-mx-6 -mb-5 sm:-mb-6 px-5 sm:px-6 py-3.5 bg-white/95 backdrop-blur-xs border-t border-slate-100 flex justify-end items-center gap-3 z-10 mt-6 shadow-[0_-4px_12px_-2px_rgba(0,0,0,0.03)]">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isPending}
            disabled={isPending}
            icon={<Sparkles size={16} />}
          >
            {isPending ? 'Deploying Tenant...' : 'Deploy School Tenant'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default OnboardSchoolModal;
