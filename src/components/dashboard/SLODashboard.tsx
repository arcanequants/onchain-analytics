'use client';

/**
 * SLO Dashboard
 *
 * Phase 4, Week 8 Extended - Dev Checklist
 *
 * Features:
 * - Service Level Objectives monitoring
 * - SLI (Service Level Indicators) visualization
 * - Error budget tracking
 * - Burn rate alerts
 * - Historical SLO compliance
 * - Multi-service view
 */

import React, { useState, useEffect, useMemo } from 'react';

// ============================================================================
// TYPES
// ============================================================================

type SLOStatus = 'healthy' | 'warning' | 'critical' | 'breached';

interface SLI {
  name: string;
  type: 'availability' | 'latency' | 'throughput' | 'error_rate' | 'quality';
  currentValue: number;
  unit: string;
  target: number;
  operator: 'gte' | 'lte' | 'eq';
}

interface SLO {
  id: string;
  name: string;
  description: string;
  service: string;
  slis: SLI[];
  target: number; // Target percentage (e.g., 99.9)
  window: '7d' | '30d' | '90d';
  currentCompliance: number;
  errorBudget: {
    total: number; // Total allowed error budget in minutes
    consumed: number; // Consumed error budget in minutes
    remaining: number; // Remaining error budget in minutes
    burnRate: number; // Current burn rate (1.0 = normal)
  };
  status: SLOStatus;
  history: Array<{
    date: string;
    compliance: number;
    errorBudgetConsumed: number;
  }>;
}

interface Service {
  id: string;
  name: string;
  description: string;
  sloCount: number;
  healthySlos: number;
  criticalSlos: number;
  overallCompliance: number;
}

interface SLODashboardData {
  services: Service[];
  slos: SLO[];
  lastUpdated: string;
}

interface SLODashboardProps {
  data?: SLODashboardData;
  onSLOSelect?: (sloId: string) => void;
  onServiceFilter?: (serviceId: string | null) => void;
  isLoading?: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getStatusColor(status: SLOStatus): string {
  switch (status) {
    case 'healthy':
      return 'bg-green-100 text-green-800';
    case 'warning':
      return 'bg-yellow-100 text-yellow-800';
    case 'critical':
      return 'bg-orange-100 text-orange-800';
    case 'breached':
      return 'bg-red-100 text-red-800';
  }
}

function getStatusDotColor(status: SLOStatus): string {
  switch (status) {
    case 'healthy':
      return 'bg-green-500';
    case 'warning':
      return 'bg-yellow-500';
    case 'critical':
      return 'bg-orange-500';
    case 'breached':
      return 'bg-red-500';
  }
}

function getComplianceColor(compliance: number, target: number): string {
  const ratio = compliance / target;
  if (ratio >= 1) return 'text-green-600';
  if (ratio >= 0.99) return 'text-yellow-600';
  if (ratio >= 0.95) return 'text-orange-600';
  return 'text-red-600';
}

function getBurnRateColor(burnRate: number): string {
  if (burnRate <= 1) return 'text-green-600';
  if (burnRate <= 2) return 'text-yellow-600';
  if (burnRate <= 5) return 'text-orange-600';
  return 'text-red-600';
}

function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  if (minutes < 1440) return `${(minutes / 60).toFixed(1)}h`;
  return `${(minutes / 1440).toFixed(1)}d`;
}

function calculateSLOStatus(slo: SLO): SLOStatus {
  const budgetPercentage = (slo.errorBudget.remaining / slo.errorBudget.total) * 100;

  if (slo.currentCompliance >= slo.target && budgetPercentage > 50) {
    return 'healthy';
  }
  if (slo.currentCompliance >= slo.target && budgetPercentage > 20) {
    return 'warning';
  }
  if (budgetPercentage > 0) {
    return 'critical';
  }
  return 'breached';
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface ErrorBudgetBarProps {
  total: number;
  consumed: number;
  burnRate: number;
}

function ErrorBudgetBar({ total, consumed, burnRate }: ErrorBudgetBarProps) {
  const percentage = (consumed / total) * 100;
  const remaining = Math.max(0, 100 - percentage);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Error Budget</span>
        <span className={getBurnRateColor(burnRate)}>
          {burnRate.toFixed(1)}x burn rate
        </span>
      </div>
      <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`absolute h-full left-0 transition-all ${
            percentage > 80 ? 'bg-red-500' : percentage > 50 ? 'bg-yellow-500' : 'bg-green-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Consumed: {formatMinutes(consumed)}</span>
        <span>Remaining: {formatMinutes(total - consumed)}</span>
      </div>
    </div>
  );
}

interface ComplianceChartProps {
  history: SLO['history'];
  target: number;
  height?: number;
}

function ComplianceChart({ history, target, height = 80 }: ComplianceChartProps) {
  if (!history || history.length === 0) {
    return (
      <div className="flex items-center justify-center h-20 bg-gray-50 rounded text-sm text-gray-500">
        No history data
      </div>
    );
  }

  const minCompliance = Math.min(...history.map(h => h.compliance), target - 1);
  const maxCompliance = Math.max(...history.map(h => h.compliance), target + 1);
  const range = maxCompliance - minCompliance;

  const targetY = height - ((target - minCompliance) / range) * height;

  return (
    <div className="relative" style={{ height }}>
      <svg className="w-full h-full" viewBox={`0 0 ${history.length * 10} ${height}`} preserveAspectRatio="none">
        {/* Target line */}
        <line
          x1="0"
          y1={targetY}
          x2={history.length * 10}
          y2={targetY}
          stroke="#ef4444"
          strokeWidth="1"
          strokeDasharray="4,4"
        />

        {/* Compliance area */}
        <polygon
          fill="url(#complianceGradient)"
          points={`0,${height} ${history
            .map((point, i) => {
              const y = height - ((point.compliance - minCompliance) / range) * height;
              return `${i * 10},${y}`;
            })
            .join(' ')} ${(history.length - 1) * 10},${height}`}
        />

        {/* Compliance line */}
        <polyline
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          points={history
            .map((point, i) => {
              const y = height - ((point.compliance - minCompliance) / range) * height;
              return `${i * 10},${y}`;
            })
            .join(' ')}
        />

        <defs>
          <linearGradient id="complianceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* Labels */}
      <div className="absolute top-0 right-0 text-xs text-gray-500">
        {formatPercentage(maxCompliance)}
      </div>
      <div className="absolute bottom-0 right-0 text-xs text-gray-500">
        {formatPercentage(minCompliance)}
      </div>
    </div>
  );
}

interface SLOCardProps {
  slo: SLO;
  onClick: () => void;
  isSelected: boolean;
}

function SLOCard({ slo, onClick, isSelected }: SLOCardProps) {
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-lg border cursor-pointer transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getStatusDotColor(slo.status)}`} />
            <h4 className="font-medium text-gray-900">{slo.name}</h4>
          </div>
          <p className="text-xs text-gray-500 mt-1">{slo.service}</p>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(slo.status)}`}>
          {slo.status}
        </span>
      </div>

      {/* Compliance */}
      <div className="mb-3">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-gray-600">Compliance</span>
          <div>
            <span className={`text-lg font-semibold ${getComplianceColor(slo.currentCompliance, slo.target)}`}>
              {formatPercentage(slo.currentCompliance, 3)}
            </span>
            <span className="text-sm text-gray-500 ml-1">
              / {formatPercentage(slo.target, 1)} target
            </span>
          </div>
        </div>
        <div className="mt-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${
              slo.currentCompliance >= slo.target ? 'bg-green-500' : 'bg-orange-500'
            }`}
            style={{ width: `${Math.min(100, (slo.currentCompliance / slo.target) * 100)}%` }}
          />
        </div>
      </div>

      {/* Error Budget */}
      <ErrorBudgetBar
        total={slo.errorBudget.total}
        consumed={slo.errorBudget.consumed}
        burnRate={slo.errorBudget.burnRate}
      />

      {/* Mini chart */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <ComplianceChart history={slo.history} target={slo.target} height={60} />
      </div>
    </div>
  );
}

interface ServiceOverviewProps {
  services: Service[];
  selectedServiceId: string | null;
  onServiceSelect: (serviceId: string | null) => void;
}

function ServiceOverview({ services, selectedServiceId, onServiceSelect }: ServiceOverviewProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-medium text-gray-900 mb-4">Services</h3>
      <div className="space-y-2">
        <button
          onClick={() => onServiceSelect(null)}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
            selectedServiceId === null
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          All Services
        </button>
        {services.map((service) => (
          <button
            key={service.id}
            onClick={() => onServiceSelect(service.id)}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
              selectedServiceId === service.id
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{service.name}</span>
              <div className="flex items-center gap-2">
                {service.criticalSlos > 0 && (
                  <span className="px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded">
                    {service.criticalSlos}
                  </span>
                )}
                <span className="text-xs text-gray-500">
                  {service.healthySlos}/{service.sloCount}
                </span>
              </div>
            </div>
            <div className="mt-1 h-1 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  service.overallCompliance >= 99 ? 'bg-green-500' : 'bg-orange-500'
                }`}
                style={{ width: `${Math.min(100, service.overallCompliance)}%` }}
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

interface SLIDetailProps {
  sli: SLI;
}

function SLIDetail({ sli }: SLIDetailProps) {
  const isMetTarget =
    sli.operator === 'gte'
      ? sli.currentValue >= sli.target
      : sli.operator === 'lte'
      ? sli.currentValue <= sli.target
      : sli.currentValue === sli.target;

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-900">{sli.name}</p>
        <p className="text-xs text-gray-500 capitalize">{sli.type.replace('_', ' ')}</p>
      </div>
      <div className="text-right">
        <p className={`text-sm font-medium ${isMetTarget ? 'text-green-600' : 'text-red-600'}`}>
          {sli.currentValue}
          {sli.unit}
        </p>
        <p className="text-xs text-gray-500">
          Target: {sli.operator === 'gte' ? '>=' : sli.operator === 'lte' ? '<=' : '='}{' '}
          {sli.target}
          {sli.unit}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// MOCK DATA GENERATOR
// ============================================================================

function generateMockData(): SLODashboardData {
  const generateHistory = (target: number, daysBack: number = 30): SLO['history'] => {
    const history: SLO['history'] = [];
    const now = new Date();

    for (let i = daysBack; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      // Generate compliance that occasionally dips below target
      const baseCompliance = target + (Math.random() - 0.3) * 0.5;
      const compliance = Math.min(100, Math.max(target - 2, baseCompliance));

      history.push({
        date: date.toISOString().split('T')[0],
        compliance,
        errorBudgetConsumed: (100 - compliance) * 10,
      });
    }

    return history;
  };

  const services: Service[] = [
    {
      id: 'api',
      name: 'API Gateway',
      description: 'Main API service',
      sloCount: 3,
      healthySlos: 2,
      criticalSlos: 1,
      overallCompliance: 99.85,
    },
    {
      id: 'analysis',
      name: 'Analysis Engine',
      description: 'AI analysis service',
      sloCount: 2,
      healthySlos: 2,
      criticalSlos: 0,
      overallCompliance: 99.95,
    },
    {
      id: 'database',
      name: 'Database',
      description: 'PostgreSQL cluster',
      sloCount: 2,
      healthySlos: 2,
      criticalSlos: 0,
      overallCompliance: 99.99,
    },
  ];

  const slos: SLO[] = [
    {
      id: 'api-availability',
      name: 'API Availability',
      description: 'API should be available 99.9% of the time',
      service: 'API Gateway',
      target: 99.9,
      window: '30d',
      currentCompliance: 99.92,
      slis: [
        { name: 'HTTP Success Rate', type: 'availability', currentValue: 99.95, unit: '%', target: 99.9, operator: 'gte' },
        { name: 'Health Check Pass Rate', type: 'availability', currentValue: 100, unit: '%', target: 99.9, operator: 'gte' },
      ],
      errorBudget: {
        total: 43.2, // 30 days * 24 hours * 60 minutes * 0.001 = 43.2 minutes
        consumed: 12.8,
        remaining: 30.4,
        burnRate: 0.8,
      },
      status: 'healthy',
      history: generateHistory(99.9),
    },
    {
      id: 'api-latency',
      name: 'API Latency',
      description: 'P99 latency should be under 500ms',
      service: 'API Gateway',
      target: 99.0,
      window: '30d',
      currentCompliance: 98.5,
      slis: [
        { name: 'P99 Latency', type: 'latency', currentValue: 520, unit: 'ms', target: 500, operator: 'lte' },
        { name: 'P95 Latency', type: 'latency', currentValue: 280, unit: 'ms', target: 300, operator: 'lte' },
      ],
      errorBudget: {
        total: 432, // 30 days * 24 hours * 60 minutes * 0.01 = 432 minutes
        consumed: 380,
        remaining: 52,
        burnRate: 2.5,
      },
      status: 'critical',
      history: generateHistory(99.0),
    },
    {
      id: 'api-errors',
      name: 'API Error Rate',
      description: 'Error rate should be below 0.1%',
      service: 'API Gateway',
      target: 99.9,
      window: '30d',
      currentCompliance: 99.95,
      slis: [
        { name: '5xx Error Rate', type: 'error_rate', currentValue: 0.03, unit: '%', target: 0.1, operator: 'lte' },
        { name: '4xx Error Rate', type: 'error_rate', currentValue: 0.8, unit: '%', target: 2, operator: 'lte' },
      ],
      errorBudget: {
        total: 43.2,
        consumed: 8.6,
        remaining: 34.6,
        burnRate: 0.5,
      },
      status: 'healthy',
      history: generateHistory(99.9),
    },
    {
      id: 'analysis-availability',
      name: 'Analysis Availability',
      description: 'Analysis service should be available 99.5% of the time',
      service: 'Analysis Engine',
      target: 99.5,
      window: '30d',
      currentCompliance: 99.8,
      slis: [
        { name: 'Service Availability', type: 'availability', currentValue: 99.85, unit: '%', target: 99.5, operator: 'gte' },
        { name: 'Queue Processing Rate', type: 'throughput', currentValue: 98.2, unit: '%', target: 95, operator: 'gte' },
      ],
      errorBudget: {
        total: 216,
        consumed: 45,
        remaining: 171,
        burnRate: 0.6,
      },
      status: 'healthy',
      history: generateHistory(99.5),
    },
    {
      id: 'analysis-quality',
      name: 'Analysis Quality',
      description: 'Analysis should meet quality threshold',
      service: 'Analysis Engine',
      target: 95.0,
      window: '30d',
      currentCompliance: 96.2,
      slis: [
        { name: 'Confidence Score', type: 'quality', currentValue: 87, unit: '%', target: 80, operator: 'gte' },
        { name: 'User Acceptance Rate', type: 'quality', currentValue: 94.5, unit: '%', target: 90, operator: 'gte' },
      ],
      errorBudget: {
        total: 2160,
        consumed: 820,
        remaining: 1340,
        burnRate: 0.9,
      },
      status: 'healthy',
      history: generateHistory(95.0),
    },
    {
      id: 'db-availability',
      name: 'Database Availability',
      description: 'Database should be available 99.99% of the time',
      service: 'Database',
      target: 99.99,
      window: '30d',
      currentCompliance: 99.995,
      slis: [
        { name: 'Connection Success Rate', type: 'availability', currentValue: 100, unit: '%', target: 99.99, operator: 'gte' },
        { name: 'Query Success Rate', type: 'availability', currentValue: 99.99, unit: '%', target: 99.99, operator: 'gte' },
      ],
      errorBudget: {
        total: 4.32,
        consumed: 0.65,
        remaining: 3.67,
        burnRate: 0.4,
      },
      status: 'healthy',
      history: generateHistory(99.99),
    },
    {
      id: 'db-latency',
      name: 'Database Latency',
      description: 'Query latency should be under 50ms',
      service: 'Database',
      target: 99.0,
      window: '30d',
      currentCompliance: 99.5,
      slis: [
        { name: 'P99 Query Latency', type: 'latency', currentValue: 42, unit: 'ms', target: 50, operator: 'lte' },
        { name: 'P95 Query Latency', type: 'latency', currentValue: 25, unit: 'ms', target: 30, operator: 'lte' },
      ],
      errorBudget: {
        total: 432,
        consumed: 108,
        remaining: 324,
        burnRate: 0.7,
      },
      status: 'healthy',
      history: generateHistory(99.0),
    },
  ];

  return {
    services,
    slos,
    lastUpdated: new Date().toISOString(),
  };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SLODashboard({
  data: propData,
  onSLOSelect,
  onServiceFilter,
  isLoading = false,
}: SLODashboardProps) {
  const [data, setData] = useState<SLODashboardData | null>(propData || null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedSLOId, setSelectedSLOId] = useState<string | null>(null);

  useEffect(() => {
    if (propData) {
      setData(propData);
    } else {
      setData(generateMockData());
    }
  }, [propData]);

  const filteredSLOs = useMemo(() => {
    if (!data) return [];
    if (!selectedServiceId) return data.slos;
    const service = data.services.find(s => s.id === selectedServiceId);
    if (!service) return data.slos;
    return data.slos.filter(slo => slo.service === service.name);
  }, [data, selectedServiceId]);

  const selectedSLO = useMemo(() => {
    if (!data || !selectedSLOId) return null;
    return data.slos.find(slo => slo.id === selectedSLOId) || null;
  }, [data, selectedSLOId]);

  const handleServiceSelect = (serviceId: string | null) => {
    setSelectedServiceId(serviceId);
    setSelectedSLOId(null);
    onServiceFilter?.(serviceId);
  };

  const handleSLOSelect = (sloId: string) => {
    setSelectedSLOId(sloId === selectedSLOId ? null : sloId);
    onSLOSelect?.(sloId);
  };

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Calculate summary stats
  const totalSLOs = data.slos.length;
  const healthySLOs = data.slos.filter(s => s.status === 'healthy').length;
  const warningSLOs = data.slos.filter(s => s.status === 'warning').length;
  const criticalSLOs = data.slos.filter(s => s.status === 'critical' || s.status === 'breached').length;
  const avgCompliance = data.slos.reduce((sum, s) => sum + s.currentCompliance, 0) / totalSLOs;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">SLO Dashboard</h2>
          <p className="text-sm text-gray-500">
            Service Level Objectives monitoring
          </p>
        </div>
        <p className="text-xs text-gray-500">
          Updated: {new Date(data.lastUpdated).toLocaleString()}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total SLOs</p>
          <p className="text-2xl font-semibold text-gray-900">{totalSLOs}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Healthy</p>
          <p className="text-2xl font-semibold text-green-600">{healthySLOs}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Warning</p>
          <p className="text-2xl font-semibold text-yellow-600">{warningSLOs}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Critical</p>
          <p className="text-2xl font-semibold text-red-600">{criticalSLOs}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Avg Compliance</p>
          <p className={`text-2xl font-semibold ${avgCompliance >= 99 ? 'text-green-600' : 'text-orange-600'}`}>
            {formatPercentage(avgCompliance, 2)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Service Sidebar */}
        <div className="md:col-span-1">
          <ServiceOverview
            services={data.services}
            selectedServiceId={selectedServiceId}
            onServiceSelect={handleServiceSelect}
          />
        </div>

        {/* SLO Grid */}
        <div className="md:col-span-3">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredSLOs.map((slo) => (
              <SLOCard
                key={slo.id}
                slo={slo}
                isSelected={selectedSLOId === slo.id}
                onClick={() => handleSLOSelect(slo.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Selected SLO Details */}
      {selectedSLO && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">{selectedSLO.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{selectedSLO.description}</p>
            </div>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(selectedSLO.status)}`}>
              {selectedSLO.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* SLIs */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Service Level Indicators</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                {selectedSLO.slis.map((sli, index) => (
                  <SLIDetail key={index} sli={sli} />
                ))}
              </div>
            </div>

            {/* Error Budget Details */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Error Budget Details</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Window</span>
                  <span className="text-sm font-medium">{selectedSLO.window}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Target</span>
                  <span className="text-sm font-medium">{formatPercentage(selectedSLO.target)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Current</span>
                  <span className={`text-sm font-medium ${getComplianceColor(selectedSLO.currentCompliance, selectedSLO.target)}`}>
                    {formatPercentage(selectedSLO.currentCompliance, 3)}
                  </span>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <ErrorBudgetBar
                    total={selectedSLO.errorBudget.total}
                    consumed={selectedSLO.errorBudget.consumed}
                    burnRate={selectedSLO.errorBudget.burnRate}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Historical Chart */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Historical Compliance (30 days)</h4>
            <ComplianceChart history={selectedSLO.history} target={selectedSLO.target} height={120} />
          </div>
        </div>
      )}
    </div>
  );
}

export default SLODashboard;
