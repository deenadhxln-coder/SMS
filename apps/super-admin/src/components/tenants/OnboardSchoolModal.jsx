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
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="!py-2 !px-4 text-xs font-semibold"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="onboard-school-form"
            onClick={handleSubmit(handleFormSubmit)}
            variant="primary"
            loading={isPending}
            disabled={isPending}
            icon={<Sparkles size={14} />}
            className="!py-2 !px-5 text-xs font-semibold"
          >
            {isPending ? 'Deploying Tenant...' : 'Deploy School Tenant'}
          </Button>
        </div>
      }
    >
      <form id="onboard-school-form" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 text-left">
        
        {/* Error Banner */}
        {errorMessage && (
          <div role="alert" className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 flex items-start gap-2.5 animate-fade-in">
            <AlertTriangle size={15} className="text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-rose-900">Onboarding Request Failed</p>
              <p className="text-[11px] font-normal text-rose-700 mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Step 1: School Identity */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
            <div className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Building size={13} />
            </div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
              1. Institutional Identity & Workspace
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
              <div className="mt-1 flex flex-wrap items-center justify-between text-[11px] gap-1">
                <span className="text-slate-400 text-[10px]">Portal URL:</span>
                <span className="text-indigo-600 font-mono font-medium text-[11px] truncate max-w-[200px]">
                  {watchSlug ? `https://${watchSlug}.sms.edu` : 'https://[slug].sms.edu'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Official Institutional Contact Email"
              type="email"
              placeholder="contact@stjude.edu"
              error={errors.contactEmail}
              required
              {...register('contactEmail')}
            />

            <div className="flex flex-col gap-1.5">
              <label htmlFor="planType" className="text-xs font-semibold text-slate-700 select-none">
                Subscription Plan Tier <span className="text-rose-500">*</span>
              </label>
              <select
                id="planType"
                {...register('planType')}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
              >
                <option value="FREE">FREE — Starter Tier (100 Students)</option>
                <option value="STANDARD">STANDARD — Growth Tier (500 Students)</option>
                <option value="PREMIUM">PREMIUM — Enterprise Tier (Unlimited)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Step 2: Primary School Administrator */}
        <div className="space-y-3 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
            <div className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck size={13} />
            </div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
              2. Initial Administrator Credentials
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Administrator Full Name"
              placeholder="e.g. Dr. Eleanor Vance"
              error={errors.adminName}
              required
              {...register('adminName')}
            />

            <Input
              label="Admin Login Email"
              type="email"
              placeholder="principal@stjude.edu"
              error={errors.adminEmail}
              required
              {...register('adminEmail')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-start">
            <Input
              label="Temporary Password"
              type="password"
              placeholder="••••••••"
              error={errors.adminPassword}
              required
              {...register('adminPassword')}
            />

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 leading-relaxed mt-0 sm:mt-5">
              <strong className="text-slate-700 font-semibold">Security Note:</strong> Temporary credentials will grant the initial administrator full management rights over this school's portal.
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default OnboardSchoolModal;
