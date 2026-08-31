import { Input, Button } from '@sms/ui-kit';
import React, { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '@sms/auth';
import api from '@sms/api-client';



// Validation Schema
const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  roleName: z.enum(['Student', 'Teacher', 'Parent'], {
    errorMap: () => ({ message: 'Please select a valid role' })
  }),
  department: z.string().optional()
});

const Register = () => {
  const navigate = useNavigate();
  const loginUser = useAuthStore(state => state.login);
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, control, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      roleName: 'Student'
    }
  });

  // Watch roleName to show conditional fields (e.g. department for Teachers)
  const roleName = useWatch({ control, name: 'roleName' });

  const onSubmit = async (data) => {
    setServerError('');
    setLoading(true);
    try {
      const response = await api.post('/auth/register', data);
      const { user, token } = response.data;
      loginUser(user, token);
      navigate('/dashboard');
    } catch (error) {
      console.error('Registration failed:', error);
      const msg = error.response?.data?.message || 'Registration failed. Please check inputs.';
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full filter blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-800 border border-slate-700/50 rounded-3xl p-8 shadow-2xl relative z-10 animate-fade-in text-left">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-2">
            Create Account
          </h1>
          <p className="text-sm font-semibold text-slate-400">
            Sign up to register a new profile
          </p>
        </div>

        {serverError && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-semibold text-red-400 animate-fade-in">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Full Name"
            type="text"
            placeholder="John Doe"
            error={errors.name}
            required
            className="text-slate-300"
            {...register('name')}
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="name@school.com"
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

          {/* Role Dropdown Selector */}
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-xs font-semibold text-slate-300">
              Register As <span className="text-red-500">*</span>
            </label>
            <select
              {...register('roleName')}
              className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-750 text-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            >
              <option value="Student">Student</option>
              <option value="Teacher">Teacher</option>
              <option value="Parent">Parent</option>
            </select>
            {errors.roleName && (
              <span className="text-xs font-semibold text-red-500">
                {errors.roleName.message}
              </span>
            )}
          </div>

          {/* Conditional Department field for Teachers */}
          {roleName === 'Teacher' && (
            <Input
              label="Department"
              type="text"
              placeholder="e.g. Mathematics, Science"
              error={errors.department}
              required
              className="text-slate-300 animate-fade-in"
              {...register('department')}
            />
          )}

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className="w-full mt-2"
          >
            Sign Up
          </Button>
        </form>

        <div className="mt-8 text-center border-t border-slate-700/50 pt-6">
          <p className="text-xs font-semibold text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
