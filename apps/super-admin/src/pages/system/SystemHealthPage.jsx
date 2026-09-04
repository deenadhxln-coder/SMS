import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { io } from 'socket.io-client';
import useAuthStore from '@sms/auth';
import { Button } from '@sms/ui-kit';
import PageContainer from '../../components/layout/PageContainer';
import StatMetricCard from '../../components/common/StatMetricCard';
import { 
  Activity, 
  Database, 
  Server, 
  Zap, 
  Radio, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Clock,
  ShieldCheck
} from 'lucide-react';

const SystemHealthPage = () => {
  const { token } = useAuthStore();
  const [wsStatus, setWsStatus] = useState('CONNECTING'); // 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING'
  const [apiLatency, setApiLatency] = useState(null);

  // Normalize base URL to ensure health endpoints on root path (/health/*) are hit reliably
  const getRootUrl = () => {
    const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return rawUrl.replace(/\/api\/?$/, '');
  };

  // Measure health and latency via readiness probe
  const { 
    data: readiness = {}, 
    isLoading: loadingReadiness, 
    refetch: refetchHealth,
    isFetching 
  } = useQuery({
    queryKey: ['system', 'health'],
    queryFn: async () => {
      const root = getRootUrl();
      const start = performance.now();
      try {
        const response = await axios.get(`${root}/health/readiness`, { timeout: 8000 });
        const latency = Math.round(performance.now() - start);
        setApiLatency(latency);
        return response.data || {};
      } catch (err) {
        setApiLatency(null);
        return {
          status: 'UNAVAILABLE',
          db: 'DOWN',
          redis: 'DOWN',
          error: err.message
        };
      }
    },
    refetchInterval: 15000
  });

  const { data: liveness = {} } = useQuery({
    queryKey: ['system', 'liveness'],
    queryFn: async () => {
      const root = getRootUrl();
      try {
        const response = await axios.get(`${root}/health/liveness`, { timeout: 8000 });
        return response.data || {};
      } catch (err) {
        return { status: 'DOWN', uptime: 0 };
      }
    },
    refetchInterval: 15000
  });

  // Test real WebSocket connectivity
  useEffect(() => {
    if (!token) return;
    const root = getRootUrl();
    const socket = io(import.meta.env.VITE_WS_URL || root, {
      auth: { token },
      timeout: 5000,
      reconnectionAttempts: 3
    });

    socket.on('connect', () => {
      setWsStatus('CONNECTED');
    });

    socket.on('connect_error', () => {
      setWsStatus('DISCONNECTED');
    });

    socket.on('disconnect', () => {
      setWsStatus('DISCONNECTED');
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  const formatUptime = (seconds) => {
    if (!seconds || seconds <= 0) return '—';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hrs}h ${mins}m ${secs}s`;
  };

  const services = [
    {
      id: 'api',
      name: 'HTTP / REST API Gateway',
      status: readiness.status === 'READY' ? 'HEALTHY' : 'UNAVAILABLE',
      icon: Server,
      latency: apiLatency ? `${apiLatency} ms` : (readiness.status === 'READY' ? 'Active' : 'Offline'),
      description: 'Accepting incoming tenant requests and auth tokens'
    },
    {
      id: 'db',
      name: 'Relational Database (MySQL)',
      status: readiness.db === 'UP' ? 'HEALTHY' : 'UNAVAILABLE',
      icon: Database,
      latency: readiness.db === 'UP' ? 'Connected' : 'Connection failed',
      description: 'Multi-tenant database engine with tenant-scoped isolation'
    },
    {
      id: 'redis',
      name: 'Redis In-Memory Cache',
      status: readiness.redis === 'UP' ? 'HEALTHY' : readiness.redis === 'DEGRADED' ? 'DEGRADED' : 'UNAVAILABLE',
      icon: Zap,
      latency: readiness.redis === 'UP' ? 'Ready' : 'Degraded',
      description: 'Sub-millisecond query cache and rate limiter storage'
    },
    {
      id: 'ws',
      name: 'Socket.IO Real-Time Engine',
      status: wsStatus === 'CONNECTED' ? 'HEALTHY' : wsStatus === 'CONNECTING' ? 'DEGRADED' : 'UNAVAILABLE',
      icon: Radio,
      latency: wsStatus === 'CONNECTED' ? 'Live Stream' : (wsStatus === 'CONNECTING' ? 'Connecting' : 'Disconnected'),
      description: 'Real-time notifications, audit events and announcement broadcasts'
    }
  ];

  const getStatusBadge = (status) => {
    if (status === 'HEALTHY') {
      return (
        <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Operational
        </span>
      );
    }
    if (status === 'DEGRADED') {
      return (
        <span className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          Degraded
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
        Unavailable
      </span>
    );
  };

  return (
    <PageContainer
      title="System Health & Infrastructure Observability"
      description="Live platform infrastructure status, core subsystem health, and network connectivity"
      action={
        <Button
          variant="outline"
          onClick={() => refetchHealth()}
          icon={<RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />}
        >
          Probe System
        </Button>
      }
    >
      {/* Infrastructure Top Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatMetricCard
          title="Overall Platform Status"
          value={readiness.status === 'READY' ? 'All Systems Healthy' : 'Degraded Performance'}
          subtext="Verified by readiness probes"
          icon={ShieldCheck}
          variant={readiness.status === 'READY' ? 'success' : 'danger'}
        />
        <StatMetricCard
          title="Core Process Uptime"
          value={formatUptime(liveness.uptime)}
          subtext="Continuous uninterrupted operation"
          icon={Clock}
          variant="default"
        />
        <StatMetricCard
          title="Gateway Ping Latency"
          value={apiLatency ? `${apiLatency} ms` : '—'}
          subtext="API response roundtrip latency"
          icon={Activity}
          variant={apiLatency && apiLatency > 500 ? 'warning' : 'primary'}
        />
      </div>

      {/* Subsystem Health Cards */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div>
          <h3 className="text-base font-bold text-slate-900">Platform Subsystems Status</h3>
          <p className="text-xs text-slate-400 mt-0.5">Authoritative probe responses for critical services</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <div 
                key={service.id} 
                className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-2xs flex-shrink-0">
                      <Icon size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{service.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{service.description}</p>
                    </div>
                  </div>
                  {getStatusBadge(service.status)}
                </div>

                <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs font-mono text-slate-500">
                  <span>Subsystem State:</span>
                  <span className="font-semibold text-slate-800">{service.latency}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Compliance & Security Box */}
      <div className="p-4 bg-slate-900 text-slate-300 rounded-xl border border-slate-800 text-xs flex items-start gap-3">
        <ShieldCheck size={18} className="text-indigo-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h5 className="font-bold text-white text-xs">Security & Platform Integrity Safeguard</h5>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Direct infrastructure passwords, connection strings, and secret keys are never returned or rendered in the Super Admin interface. All health monitoring uses sanitized, authenticated internal diagnostic probes.
          </p>
        </div>
      </div>
    </PageContainer>
  );
};

export default SystemHealthPage;
