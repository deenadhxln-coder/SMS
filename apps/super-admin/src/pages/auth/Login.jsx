import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { Input, Button } from '@sms/ui-kit';
import useAuthStore from '@sms/auth';
import api from '@sms/api-client';
import { Server, Lock, Mail, AlertTriangle, ShieldCheck } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

const Login = () => {
  const navigate = useNavigate();
  const loginUser = useAuthStore(state => state.login);
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = async (data) => {
    setServerError('');
    setLoading(true);
    try {
      const response = await api.post('/auth/login', data);
      const { user, token } = response.data;

      if (user.role !== 'Super Admin') {
        throw new Error('Access denied. Super Administrator credentials required.');
      }

      loginUser(user, token);
      navigate('/');
    } catch (error) {
      console.error('Login failed:', error);
      const msg = error.response?.data?.message || error.message || 'Authentication failed. Please verify credentials.';
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between p-6 sm:p-10 relative selection:bg-indigo-500/30 selection:text-white">
      
      {/* Top Header Brand */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-600/30">
          <Server size={18} />
        </div>
        <div className="text-left">
          <span className="text-xs font-black tracking-wider text-white uppercase block">
            SMS Platform
          </span>
          <span className="text-[10px] font-semibold text-indigo-400 block tracking-wide uppercase">
            Control Center
          </span>
        </div>
      </div>

      {/* Center Auth Card */}
      <div className="w-full max-w-md mx-auto my-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl text-left relative z-10 animate-fade-in space-y-6">
        
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Platform Sign In
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Access global multi-tenant operations and subscription governance
          </p>
        </div>

        {serverError && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs font-semibold text-rose-400 flex items-start gap-2.5 animate-fade-in">
            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Super Admin Email Address
            </label>
            <input
              type="email"
              placeholder="admin@school.com"
              {...register('email')}
              className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 text-white placeholder:text-slate-500 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
            />
            {errors.email && (
              <p className="text-[11px] text-rose-400 font-medium mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              {...register('password')}
              className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 text-white placeholder:text-slate-500 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
            />
            {errors.password && (
              <p className="text-[11px] text-rose-400 font-medium mt-1">{errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className="w-full !py-2.5 !text-xs !font-bold mt-2"
          >
            Authenticate & Access Console
          </Button>
        </form>

        <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-indigo-400" /> Authorized personnel only
          </span>
          <span>SaaS v2.0</span>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[11px] text-slate-600">
        Multi-Tenant School Management Platform • Operational Control Center
      </div>

    </div>
  );
};

export default Login;
