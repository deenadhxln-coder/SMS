import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '@sms/auth';
import api from '@sms/api-client';
import { Input, Button } from '@sms/ui-kit';

// Validation Schema
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
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data) => {
    setServerError('');
    setLoading(true);
    try {
      const response = await api.post('/auth/login', data);
      const { user, token } = response.data;
      
      if (user.role !== 'Super Admin') {
        throw new Error('Access denied. Super Admin role required.');
      }

      loginUser(user, token);
      navigate('/');
    } catch (error) {
      console.error('Login failed:', error);
      const msg = error.response?.data?.message || error.message || 'Connection failed. Please check credentials.';
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* Decorative gradient blur backdrop */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full filter blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-500/10 rounded-full filter blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800/80 rounded-3xl p-8 shadow-2xl relative z-10 animate-fade-in text-left">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-purple-500/10 rounded-2xl mb-4 border border-purple-500/20 text-purple-400 font-extrabold text-sm uppercase tracking-wider">
            SaaS Console
          </div>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-purple-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent mb-2">
            Control Center
          </h1>
          <p className="text-sm font-semibold text-slate-400">
            Sign in to manage plans, tenants, and system audits.
          </p>
        </div>

        {serverError && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-semibold text-red-400 animate-fade-in">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Super Admin Email"
            type="email"
            placeholder="admin@platform.com"
            error={errors.email}
            required
            className="text-slate-300"
            {...register('email')}
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            error={errors.password}
            required
            className="text-slate-300"
            {...register('password')}
          />

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className="w-full mt-2 !bg-gradient-to-r !from-purple-600 !to-fuchsia-600 !hover:from-purple-500 !hover:to-fuchsia-500 border-none"
          >
            Authenticate
          </Button>
        </form>

        <div className="mt-8 text-center border-t border-slate-800/80 pt-6">
          <p className="text-xs font-semibold text-slate-500">
            Unauthorized access is strictly prohibited and subject to monitoring.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
