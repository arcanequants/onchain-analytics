'use client';

import React, { useState, useCallback, useEffect } from 'react';

// ============================================================================
// Inline Icons (avoiding heroicons dependency)
// ============================================================================

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function DocumentDuplicateIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function BookOpenIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function XCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function ArrowPathIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function CodeBracketIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  );
}

function BeakerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  );
}

// ============================================================================
// Types
// ============================================================================

interface ApiEndpoint {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  category: string;
  parameters?: Parameter[];
  requestBody?: RequestBodySchema;
  responseExample?: string;
  requiresAuth?: boolean;
}

interface Parameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  in: 'path' | 'query' | 'header';
  required?: boolean;
  description?: string;
  default?: string;
  enum?: string[];
}

interface RequestBodySchema {
  type: string;
  properties: Record<string, {
    type: string;
    description?: string;
    required?: boolean;
    default?: unknown;
  }>;
  example?: string;
}

interface RequestHistory {
  id: string;
  timestamp: Date;
  endpoint: ApiEndpoint;
  request: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: string;
  };
  response: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: string;
    duration: number;
  };
}

interface HeaderPair {
  key: string;
  value: string;
  enabled: boolean;
}

// ============================================================================
// Mock Data - API Endpoints Registry
// ============================================================================

const API_ENDPOINTS: ApiEndpoint[] = [
  // Token Prices
  {
    id: 'get-token-prices',
    name: 'Get Token Prices',
    method: 'GET',
    path: '/api/prices',
    description: 'Retrieve current prices for all tracked tokens',
    category: 'Prices',
    parameters: [
      { name: 'symbols', type: 'string', in: 'query', description: 'Comma-separated token symbols (e.g., BTC,ETH,SOL)' },
      { name: 'currency', type: 'string', in: 'query', default: 'USD', enum: ['USD', 'EUR', 'GBP'] },
    ],
    responseExample: JSON.stringify({
      data: [
        { symbol: 'BTC', price: 97500, change_24h: 2.5 },
        { symbol: 'ETH', price: 3650, change_24h: 1.8 },
      ],
      timestamp: '2025-01-15T10:30:00Z'
    }, null, 2),
  },
  {
    id: 'get-token-history',
    name: 'Get Token Price History',
    method: 'GET',
    path: '/api/prices/{symbol}/history',
    description: 'Get historical price data for a specific token',
    category: 'Prices',
    parameters: [
      { name: 'symbol', type: 'string', in: 'path', required: true, description: 'Token symbol (e.g., BTC)' },
      { name: 'days', type: 'number', in: 'query', default: '30', description: 'Number of days of history' },
      { name: 'interval', type: 'string', in: 'query', default: 'daily', enum: ['hourly', 'daily', 'weekly'] },
    ],
    responseExample: JSON.stringify({
      symbol: 'BTC',
      history: [
        { date: '2025-01-14', open: 95000, high: 98000, low: 94500, close: 97500 },
      ]
    }, null, 2),
  },
  // TVL
  {
    id: 'get-protocol-tvl',
    name: 'Get Protocol TVL',
    method: 'GET',
    path: '/api/tvl',
    description: 'Get Total Value Locked for DeFi protocols',
    category: 'TVL',
    parameters: [
      { name: 'chain', type: 'string', in: 'query', description: 'Filter by chain (e.g., ethereum, base)' },
      { name: 'category', type: 'string', in: 'query', enum: ['DEX', 'Lending', 'Bridge', 'Yield'] },
      { name: 'limit', type: 'number', in: 'query', default: '50' },
    ],
    responseExample: JSON.stringify({
      data: [
        { protocol: 'Lido', tvl: 25000000000, category: 'Liquid Staking', chain: 'ethereum' },
      ]
    }, null, 2),
  },
  // Wallets
  {
    id: 'get-wallet-portfolio',
    name: 'Get Wallet Portfolio',
    method: 'GET',
    path: '/api/wallets/{address}/portfolio',
    description: 'Get complete portfolio for a wallet address',
    category: 'Wallets',
    parameters: [
      { name: 'address', type: 'string', in: 'path', required: true, description: 'Wallet address (0x...)' },
      { name: 'include_nfts', type: 'boolean', in: 'query', default: 'false' },
      { name: 'include_defi', type: 'boolean', in: 'query', default: 'true' },
    ],
    requiresAuth: true,
    responseExample: JSON.stringify({
      address: '0x1234...5678',
      total_value_usd: 125000,
      tokens: [{ symbol: 'ETH', balance: 50, value_usd: 182500 }],
    }, null, 2),
  },
  {
    id: 'track-wallet',
    name: 'Track Wallet',
    method: 'POST',
    path: '/api/wallets/track',
    description: 'Add a wallet to tracking list',
    category: 'Wallets',
    requiresAuth: true,
    requestBody: {
      type: 'object',
      properties: {
        address: { type: 'string', description: 'Wallet address to track', required: true },
        label: { type: 'string', description: 'Optional label for the wallet' },
        chains: { type: 'array', description: 'Chains to track (default: all)' },
        notifications: { type: 'boolean', description: 'Enable notifications', default: true },
      },
      example: JSON.stringify({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        label: 'My Main Wallet',
        chains: ['ethereum', 'base', 'arbitrum'],
        notifications: true
      }, null, 2),
    },
  },
  // Gas
  {
    id: 'get-gas-prices',
    name: 'Get Gas Prices',
    method: 'GET',
    path: '/api/gas',
    description: 'Get current gas prices across chains',
    category: 'Gas',
    parameters: [
      { name: 'chains', type: 'string', in: 'query', description: 'Comma-separated chain names' },
    ],
    responseExample: JSON.stringify({
      ethereum: { slow: 15, standard: 20, fast: 25, instant: 35 },
      base: { slow: 0.001, standard: 0.002, fast: 0.003, instant: 0.005 },
    }, null, 2),
  },
  // RLHF
  {
    id: 'submit-feedback',
    name: 'Submit Feedback',
    method: 'POST',
    path: '/api/feedback',
    description: 'Submit user feedback for RLHF training',
    category: 'Feedback',
    requiresAuth: true,
    requestBody: {
      type: 'object',
      properties: {
        prediction_id: { type: 'string', description: 'ID of the prediction', required: true },
        rating: { type: 'number', description: 'Rating from 1-5', required: true },
        comment: { type: 'string', description: 'Optional feedback comment' },
        correction: { type: 'object', description: 'Corrected values if applicable' },
      },
      example: JSON.stringify({
        prediction_id: 'pred_abc123',
        rating: 4,
        comment: 'Good prediction but slightly overestimated',
        correction: { predicted_value: 1.25 }
      }, null, 2),
    },
  },
  // Admin
  {
    id: 'run-cron',
    name: 'Trigger Cron Job',
    method: 'POST',
    path: '/api/cron/{job}',
    description: 'Manually trigger a cron job',
    category: 'Admin',
    requiresAuth: true,
    parameters: [
      { name: 'job', type: 'string', in: 'path', required: true, enum: ['collect-prices', 'collect-tvl', 'collect-gas', 'cleanup'] },
    ],
    requestBody: {
      type: 'object',
      properties: {
        dry_run: { type: 'boolean', description: 'Run without making changes', default: false },
      },
      example: JSON.stringify({ dry_run: true }, null, 2),
    },
  },
];

// ============================================================================
// Utility Functions
// ============================================================================

function generateCurlCommand(
  method: string,
  url: string,
  headers: HeaderPair[],
  body?: string
): string {
  const parts = ['curl'];

  if (method !== 'GET') {
    parts.push(`-X ${method}`);
  }

  parts.push(`'${url}'`);

  headers.filter(h => h.enabled && h.key).forEach(h => {
    parts.push(`-H '${h.key}: ${h.value}'`);
  });

  if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
    parts.push(`-d '${body}'`);
  }

  return parts.join(' \\\n  ');
}

function formatJson(str: string): string {
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch {
    return str;
  }
}

function getMethodColor(method: string): string {
  switch (method) {
    case 'GET': return 'bg-green-100 text-green-700';
    case 'POST': return 'bg-blue-100 text-blue-700';
    case 'PUT': return 'bg-yellow-100 text-yellow-700';
    case 'PATCH': return 'bg-orange-100 text-orange-700';
    case 'DELETE': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function getStatusColor(status: number): string {
  if (status >= 200 && status < 300) return 'text-green-600';
  if (status >= 400 && status < 500) return 'text-yellow-600';
  if (status >= 500) return 'text-red-600';
  return 'text-gray-600';
}

// ============================================================================
// Components
// ============================================================================

interface EndpointSelectorProps {
  endpoints: ApiEndpoint[];
  selectedEndpoint: ApiEndpoint | null;
  onSelect: (endpoint: ApiEndpoint) => void;
}

function EndpointSelector({ endpoints, selectedEndpoint, onSelect }: EndpointSelectorProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Prices']));

  const categories = Array.from(new Set(endpoints.map(e => e.category)));

  const toggleCategory = (category: string) => {
    const next = new Set(expandedCategories);
    if (next.has(category)) {
      next.delete(category);
    } else {
      next.add(category);
    }
    setExpandedCategories(next);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-900">API Endpoints</h3>
      </div>
      <div className="divide-y divide-gray-100">
        {categories.map((category) => {
          const categoryEndpoints = endpoints.filter(e => e.category === category);
          const isExpanded = expandedCategories.has(category);

          return (
            <div key={category}>
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-50"
              >
                <span className="text-sm font-medium text-gray-700">{category}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{categoryEndpoints.length}</span>
                  {isExpanded ? (
                    <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="bg-gray-50 py-1">
                  {categoryEndpoints.map((endpoint) => (
                    <button
                      key={endpoint.id}
                      onClick={() => onSelect(endpoint)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-100
                        ${selectedEndpoint?.id === endpoint.id ? 'bg-blue-50 border-l-2 border-blue-500' : ''}
                      `}
                    >
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${getMethodColor(endpoint.method)}`}>
                        {endpoint.method}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 truncate">{endpoint.name}</p>
                        <p className="text-xs text-gray-500 truncate">{endpoint.path}</p>
                      </div>
                      {endpoint.requiresAuth && (
                        <span className="text-xs text-orange-500">🔐</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface RequestBuilderProps {
  endpoint: ApiEndpoint;
  onSend: (request: { url: string; method: string; headers: Record<string, string>; body?: string }) => void;
  loading: boolean;
}

function RequestBuilder({ endpoint, onSend, loading }: RequestBuilderProps) {
  const [baseUrl, setBaseUrl] = useState('http://localhost:3000');
  const [pathParams, setPathParams] = useState<Record<string, string>>({});
  const [queryParams, setQueryParams] = useState<Record<string, string>>({});
  const [headers, setHeaders] = useState<HeaderPair[]>([
    { key: 'Content-Type', value: 'application/json', enabled: true },
    { key: 'Authorization', value: 'Bearer YOUR_TOKEN', enabled: endpoint.requiresAuth || false },
  ]);
  const [body, setBody] = useState(endpoint.requestBody?.example || '');
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body'>('params');

  // Update body when endpoint changes
  useEffect(() => {
    setBody(endpoint.requestBody?.example || '');
    setPathParams({});
    setQueryParams({});
    setHeaders(prev => prev.map(h =>
      h.key === 'Authorization' ? { ...h, enabled: endpoint.requiresAuth || false } : h
    ));
  }, [endpoint]);

  // Build final URL
  const buildUrl = useCallback(() => {
    let path = endpoint.path;

    // Replace path parameters
    endpoint.parameters?.filter(p => p.in === 'path').forEach((param) => {
      const value = pathParams[param.name] || `{${param.name}}`;
      path = path.replace(`{${param.name}}`, value);
    });

    // Add query parameters
    const queryEntries = Object.entries(queryParams).filter(([, v]) => v);
    if (queryEntries.length > 0) {
      const queryString = queryEntries
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&');
      path += `?${queryString}`;
    }

    return `${baseUrl}${path}`;
  }, [baseUrl, endpoint, pathParams, queryParams]);

  const handleSend = () => {
    const url = buildUrl();
    const headerObj: Record<string, string> = {};
    headers.filter(h => h.enabled && h.key).forEach(h => {
      headerObj[h.key] = h.value;
    });

    onSend({
      url,
      method: endpoint.method,
      headers: headerObj,
      body: ['POST', 'PUT', 'PATCH'].includes(endpoint.method) ? body : undefined,
    });
  };

  const addHeader = () => {
    setHeaders([...headers, { key: '', value: '', enabled: true }]);
  };

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const updateHeader = (index: number, field: 'key' | 'value' | 'enabled', value: string | boolean) => {
    const updated = [...headers];
    updated[index] = { ...updated[index], [field]: value };
    setHeaders(updated);
  };

  const pathParameters = endpoint.parameters?.filter(p => p.in === 'path') || [];
  const queryParameters = endpoint.parameters?.filter(p => p.in === 'query') || [];

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <span className={`px-2 py-1 text-xs font-bold rounded ${getMethodColor(endpoint.method)}`}>
            {endpoint.method}
          </span>
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            className="w-40 px-2 py-1 text-sm border border-gray-300 rounded"
          />
          <span className="flex-1 font-mono text-sm text-gray-700 truncate">
            {endpoint.path}
          </span>
          <button
            onClick={handleSend}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
            ) : (
              <PlayIcon className="h-4 w-4" />
            )}
            Send
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-600">{endpoint.description}</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {['params', 'headers', 'body'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as typeof activeTab)}
            className={`
              px-4 py-2 text-sm font-medium capitalize
              ${activeTab === tab
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'}
            `}
          >
            {tab}
            {tab === 'params' && (pathParameters.length + queryParameters.length) > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-gray-200 rounded">
                {pathParameters.length + queryParameters.length}
              </span>
            )}
            {tab === 'headers' && headers.filter(h => h.enabled).length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-gray-200 rounded">
                {headers.filter(h => h.enabled).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-4 max-h-80 overflow-y-auto">
        {activeTab === 'params' && (
          <div className="space-y-4">
            {pathParameters.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Path Parameters</h4>
                <div className="space-y-2">
                  {pathParameters.map((param) => (
                    <div key={param.name} className="flex items-center gap-3">
                      <label className="w-32 text-sm text-gray-700">
                        {param.name}
                        {param.required && <span className="text-red-500">*</span>}
                      </label>
                      {param.enum ? (
                        <select
                          value={pathParams[param.name] || ''}
                          onChange={(e) => setPathParams({ ...pathParams, [param.name]: e.target.value })}
                          className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm"
                        >
                          <option value="">Select...</option>
                          {param.enum.map(v => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={pathParams[param.name] || ''}
                          onChange={(e) => setPathParams({ ...pathParams, [param.name]: e.target.value })}
                          placeholder={param.description}
                          className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {queryParameters.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Query Parameters</h4>
                <div className="space-y-2">
                  {queryParameters.map((param) => (
                    <div key={param.name} className="flex items-center gap-3">
                      <label className="w-32 text-sm text-gray-700">
                        {param.name}
                        {param.required && <span className="text-red-500">*</span>}
                      </label>
                      {param.enum ? (
                        <select
                          value={queryParams[param.name] || param.default || ''}
                          onChange={(e) => setQueryParams({ ...queryParams, [param.name]: e.target.value })}
                          className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm"
                        >
                          <option value="">All</option>
                          {param.enum.map(v => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={param.type === 'number' ? 'number' : 'text'}
                          value={queryParams[param.name] || ''}
                          onChange={(e) => setQueryParams({ ...queryParams, [param.name]: e.target.value })}
                          placeholder={param.default ? `Default: ${param.default}` : param.description}
                          className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pathParameters.length === 0 && queryParameters.length === 0 && (
              <p className="text-sm text-gray-500 italic">No parameters for this endpoint</p>
            )}
          </div>
        )}

        {activeTab === 'headers' && (
          <div className="space-y-2">
            {headers.map((header, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={header.enabled}
                  onChange={(e) => updateHeader(index, 'enabled', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <input
                  type="text"
                  value={header.key}
                  onChange={(e) => updateHeader(index, 'key', e.target.value)}
                  placeholder="Header name"
                  className="w-40 px-2 py-1 border border-gray-300 rounded text-sm"
                />
                <input
                  type="text"
                  value={header.value}
                  onChange={(e) => updateHeader(index, 'value', e.target.value)}
                  placeholder="Value"
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm font-mono"
                />
                <button
                  onClick={() => removeHeader(index)}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              onClick={addHeader}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <PlusIcon className="h-4 w-4" />
              Add header
            </button>
          </div>
        )}

        {activeTab === 'body' && (
          <div>
            {['POST', 'PUT', 'PATCH'].includes(endpoint.method) ? (
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Request body (JSON)"
                className="w-full h-48 px-3 py-2 border border-gray-300 rounded font-mono text-sm resize-none"
              />
            ) : (
              <p className="text-sm text-gray-500 italic">
                Request body is not applicable for {endpoint.method} requests
              </p>
            )}
          </div>
        )}
      </div>

      {/* cURL Command */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500">cURL</span>
          <button
            onClick={() => navigator.clipboard.writeText(generateCurlCommand(endpoint.method, buildUrl(), headers, body))}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
          >
            <DocumentDuplicateIcon className="h-3 w-3" />
            Copy
          </button>
        </div>
        <pre className="text-xs font-mono text-gray-700 bg-white p-2 rounded border border-gray-200 overflow-x-auto">
          {generateCurlCommand(endpoint.method, buildUrl(), headers, body)}
        </pre>
      </div>
    </div>
  );
}

interface ResponseViewerProps {
  response: RequestHistory['response'] | null;
  loading: boolean;
}

function ResponseViewer({ response, loading }: ResponseViewerProps) {
  const [viewMode, setViewMode] = useState<'pretty' | 'raw' | 'headers'>('pretty');

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="flex flex-col items-center justify-center">
          <ArrowPathIcon className="h-8 w-8 text-blue-500 animate-spin" />
          <p className="mt-2 text-sm text-gray-500">Sending request...</p>
        </div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="flex flex-col items-center justify-center text-gray-400">
          <BeakerIcon className="h-12 w-12" />
          <p className="mt-2 text-sm">Send a request to see the response</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {response.status >= 200 && response.status < 300 ? (
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
            ) : (
              <XCircleIcon className="h-5 w-5 text-red-500" />
            )}
            <span className={`text-lg font-semibold ${getStatusColor(response.status)}`}>
              {response.status} {response.statusText}
            </span>
          </div>
          <span className="text-sm text-gray-500">
            <ClockIcon className="inline h-4 w-4 mr-1" />
            {response.duration}ms
          </span>
        </div>

        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          {(['pretty', 'raw', 'headers'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`
                px-3 py-1 text-sm rounded capitalize
                ${viewMode === mode ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'}
              `}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 max-h-96 overflow-auto">
        {viewMode === 'pretty' && (
          <pre className="text-sm font-mono text-gray-700 whitespace-pre-wrap">
            {formatJson(response.body)}
          </pre>
        )}
        {viewMode === 'raw' && (
          <pre className="text-sm font-mono text-gray-700 whitespace-pre-wrap">
            {response.body}
          </pre>
        )}
        {viewMode === 'headers' && (
          <div className="space-y-1">
            {Object.entries(response.headers).map(([key, value]) => (
              <div key={key} className="flex gap-2 text-sm">
                <span className="font-medium text-gray-700">{key}:</span>
                <span className="text-gray-600 font-mono">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex justify-end">
        <button
          onClick={() => navigator.clipboard.writeText(response.body)}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <DocumentDuplicateIcon className="h-4 w-4" />
          Copy response
        </button>
      </div>
    </div>
  );
}

interface HistorySidebarProps {
  history: RequestHistory[];
  onSelect: (item: RequestHistory) => void;
  onClear: () => void;
}

function HistorySidebar({ history, onSelect, onClear }: HistorySidebarProps) {
  if (history.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">History</h3>
        <button
          onClick={onClear}
          className="text-xs text-gray-500 hover:text-red-500"
        >
          Clear
        </button>
      </div>
      <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
        {history.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item)}
            className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50"
          >
            <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${getMethodColor(item.endpoint.method)}`}>
              {item.endpoint.method}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 truncate">{item.endpoint.path}</p>
              <p className="text-xs text-gray-500">
                {item.response.status} · {item.response.duration}ms
              </p>
            </div>
            <span className={`text-sm font-medium ${getStatusColor(item.response.status)}`}>
              {item.response.status}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function ApiPlaygroundPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(API_ENDPOINTS[0]);
  const [response, setResponse] = useState<RequestHistory['response'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<RequestHistory[]>([]);

  const handleSendRequest = useCallback(async (request: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: string;
  }) => {
    if (!selectedEndpoint) return;

    setLoading(true);
    setResponse(null);

    const startTime = Date.now();

    try {
      // Simulate API call (in production, this would be a real fetch)
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

      // Mock response based on endpoint
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-Id': `req_${Math.random().toString(36).substr(2, 9)}`,
          'X-Response-Time': `${Date.now() - startTime}ms`,
        },
        body: selectedEndpoint.responseExample || JSON.stringify({ success: true, message: 'Request completed' }),
        duration: Date.now() - startTime,
      };

      setResponse(mockResponse);

      // Add to history
      const historyItem: RequestHistory = {
        id: `hist_${Date.now()}`,
        timestamp: new Date(),
        endpoint: selectedEndpoint,
        request,
        response: mockResponse,
      };

      setHistory(prev => [historyItem, ...prev.slice(0, 19)]); // Keep last 20
    } catch (error) {
      setResponse({
        status: 500,
        statusText: 'Internal Server Error',
        headers: {},
        body: JSON.stringify({ error: 'Request failed', message: String(error) }),
        duration: Date.now() - startTime,
      });
    } finally {
      setLoading(false);
    }
  }, [selectedEndpoint]);

  const handleHistorySelect = useCallback((item: RequestHistory) => {
    setSelectedEndpoint(item.endpoint);
    setResponse(item.response);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CodeBracketIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">API Playground</h1>
              <p className="text-sm text-gray-500">
                Test and explore API endpoints interactively
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <a
              href="/api/docs"
              target="_blank"
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
            >
              <BookOpenIcon className="h-4 w-4" />
              API Documentation
            </a>
            <span className="text-gray-300">|</span>
            <span className="text-sm text-gray-500">
              {API_ENDPOINTS.length} endpoints available
            </span>
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar - Endpoint Selector */}
          <div className="col-span-3 space-y-4">
            <EndpointSelector
              endpoints={API_ENDPOINTS}
              selectedEndpoint={selectedEndpoint}
              onSelect={setSelectedEndpoint}
            />

            <HistorySidebar
              history={history}
              onSelect={handleHistorySelect}
              onClear={() => setHistory([])}
            />
          </div>

          {/* Main Content */}
          <div className="col-span-9 space-y-6">
            {selectedEndpoint ? (
              <>
                <RequestBuilder
                  endpoint={selectedEndpoint}
                  onSend={handleSendRequest}
                  loading={loading}
                />

                <ResponseViewer
                  response={response}
                  loading={loading}
                />
              </>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <BeakerIcon className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  Select an endpoint to get started
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Choose an API endpoint from the sidebar to start testing
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
