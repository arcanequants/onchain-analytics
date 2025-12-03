/**
 * RLHF Corrections Review Page
 *
 * Phase 4, Week 8, Day 5 Extended
 * Admin UI for reviewing and approving brand corrections
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Correction Review | RLHF Admin',
  robots: 'noindex, nofollow',
};

// ================================================================
// TYPES
// ================================================================

type CorrectionType =
  | 'score_too_high'
  | 'score_too_low'
  | 'wrong_sentiment'
  | 'wrong_category'
  | 'factual_error'
  | 'hallucination'
  | 'outdated_info'
  | 'missing_info'
  | 'competitor_confusion'
  | 'other';

type CorrectionStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'applied' | 'disputed';

type Priority = 'low' | 'medium' | 'high' | 'critical';

interface Correction {
  id: string;
  brandName: string;
  brandDomain: string;
  originalScore: number;
  correctedScore?: number;
  correctionType: CorrectionType;
  correctionReason: string;
  status: CorrectionStatus;
  priority: Priority;
  submittedBy: string;
  submittedAt: string;
  evidenceUrls?: string[];
  notes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

interface QueueStats {
  pending: number;
  underReview: number;
  approved: number;
  rejected: number;
  avgReviewTime: number;
  todayReviewed: number;
}

// ================================================================
// MOCK DATA
// ================================================================

async function getQueueStats(): Promise<QueueStats> {
  return {
    pending: 23,
    underReview: 5,
    approved: 156,
    rejected: 42,
    avgReviewTime: 12,
    todayReviewed: 8,
  };
}

async function getPendingCorrections(): Promise<Correction[]> {
  return [
    {
      id: 'corr_001',
      brandName: 'Acme Corp',
      brandDomain: 'acme.com',
      originalScore: 72,
      correctedScore: 58,
      correctionType: 'score_too_high',
      correctionReason:
        'AI mentions Acme as a "leading provider" but they are a small player in the CRM market. Only 2% market share.',
      status: 'pending',
      priority: 'high',
      submittedBy: 'user_12345',
      submittedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      evidenceUrls: ['https://example.com/market-report'],
    },
    {
      id: 'corr_002',
      brandName: 'TechStart Inc',
      brandDomain: 'techstart.io',
      originalScore: 45,
      correctedScore: 68,
      correctionType: 'score_too_low',
      correctionReason:
        "TechStart was recently featured in TechCrunch and raised Series B. AI doesn't know about recent coverage.",
      status: 'pending',
      priority: 'medium',
      submittedBy: 'user_67890',
      submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      evidenceUrls: ['https://techcrunch.com/techstart-funding'],
    },
    {
      id: 'corr_003',
      brandName: 'SafeBank',
      brandDomain: 'safebank.com',
      originalScore: 81,
      correctionType: 'hallucination',
      correctionReason:
        'AI claimed SafeBank offers cryptocurrency trading, which is completely false. They are a traditional bank.',
      status: 'pending',
      priority: 'critical',
      submittedBy: 'user_11111',
      submittedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
    {
      id: 'corr_004',
      brandName: 'GreenEnergy Co',
      brandDomain: 'greenenergy.co',
      originalScore: 55,
      correctedScore: 52,
      correctionType: 'wrong_sentiment',
      correctionReason:
        "AI rated sentiment as 'positive' but the mentions are actually neutral. They just list the company without opinion.",
      status: 'pending',
      priority: 'low',
      submittedBy: 'user_22222',
      submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    },
    {
      id: 'corr_005',
      brandName: 'FastShip Logistics',
      brandDomain: 'fastship.com',
      originalScore: 68,
      correctionType: 'competitor_confusion',
      correctionReason:
        'AI confused FastShip with FastFreight (competitor). Mentioned FastFreight achievements as FastShip.',
      status: 'under_review',
      priority: 'high',
      submittedBy: 'user_33333',
      submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
      reviewedBy: 'admin_001',
    },
  ];
}

// ================================================================
// UTILITY FUNCTIONS
// ================================================================

function formatTimeAgo(isoDate: string): string {
  const seconds = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function getCorrectionTypeLabel(type: CorrectionType): string {
  const labels: Record<CorrectionType, string> = {
    score_too_high: 'Score Too High',
    score_too_low: 'Score Too Low',
    wrong_sentiment: 'Wrong Sentiment',
    wrong_category: 'Wrong Category',
    factual_error: 'Factual Error',
    hallucination: 'Hallucination',
    outdated_info: 'Outdated Info',
    missing_info: 'Missing Info',
    competitor_confusion: 'Competitor Confusion',
    other: 'Other',
  };
  return labels[type];
}

function getCorrectionTypeColor(type: CorrectionType): string {
  const colors: Record<CorrectionType, string> = {
    score_too_high: 'bg-orange-500/20 text-orange-400',
    score_too_low: 'bg-blue-500/20 text-blue-400',
    wrong_sentiment: 'bg-purple-500/20 text-purple-400',
    wrong_category: 'bg-cyan-500/20 text-cyan-400',
    factual_error: 'bg-red-500/20 text-red-400',
    hallucination: 'bg-red-600/20 text-red-300',
    outdated_info: 'bg-yellow-500/20 text-yellow-400',
    missing_info: 'bg-gray-500/20 text-gray-400',
    competitor_confusion: 'bg-pink-500/20 text-pink-400',
    other: 'bg-gray-500/20 text-gray-400',
  };
  return colors[type];
}

function getPriorityColor(priority: Priority): string {
  const colors: Record<Priority, string> = {
    critical: 'bg-red-500 text-white',
    high: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    low: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
  };
  return colors[priority];
}

function getStatusColor(status: CorrectionStatus): string {
  const colors: Record<CorrectionStatus, string> = {
    pending: 'bg-blue-500/20 text-blue-400',
    under_review: 'bg-yellow-500/20 text-yellow-400',
    approved: 'bg-green-500/20 text-green-400',
    rejected: 'bg-red-500/20 text-red-400',
    applied: 'bg-purple-500/20 text-purple-400',
    disputed: 'bg-orange-500/20 text-orange-400',
  };
  return colors[status];
}

// ================================================================
// COMPONENTS
// ================================================================

function StatCard({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
      <div className="text-sm text-gray-400">{label}</div>
      <div className={`text-2xl font-bold ${color || 'text-white'}`}>{value}</div>
    </div>
  );
}

function CorrectionCard({ correction }: { correction: Correction }) {
  const scoreDiff = correction.correctedScore
    ? correction.correctedScore - correction.originalScore
    : null;

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`px-2 py-0.5 text-xs font-medium rounded ${getPriorityColor(correction.priority)}`}>
            {correction.priority.toUpperCase()}
          </span>
          <span className={`px-2 py-0.5 text-xs rounded ${getStatusColor(correction.status)}`}>
            {correction.status.replace('_', ' ')}
          </span>
          <span className={`px-2 py-0.5 text-xs rounded ${getCorrectionTypeColor(correction.correctionType)}`}>
            {getCorrectionTypeLabel(correction.correctionType)}
          </span>
        </div>
        <div className="text-sm text-gray-500">{formatTimeAgo(correction.submittedAt)}</div>
      </div>

      {/* Brand Info */}
      <div className="p-4 border-b border-gray-700/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">{correction.brandName}</h3>
            <div className="text-sm text-gray-400">{correction.brandDomain}</div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-xs text-gray-500">Original</div>
              <div className="text-2xl font-bold text-gray-400">{correction.originalScore}</div>
            </div>
            {correction.correctedScore && (
              <>
                <div className="text-gray-600">→</div>
                <div className="text-center">
                  <div className="text-xs text-gray-500">Suggested</div>
                  <div
                    className={`text-2xl font-bold ${
                      scoreDiff && scoreDiff > 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {correction.correctedScore}
                  </div>
                </div>
                <div
                  className={`px-2 py-1 rounded text-sm font-medium ${
                    scoreDiff && scoreDiff > 0
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {scoreDiff && scoreDiff > 0 ? '+' : ''}
                  {scoreDiff}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Reason */}
      <div className="p-4 border-b border-gray-700/50">
        <div className="text-sm text-gray-400 mb-2">Correction Reason:</div>
        <p className="text-white">{correction.correctionReason}</p>
      </div>

      {/* Evidence */}
      {correction.evidenceUrls && correction.evidenceUrls.length > 0 && (
        <div className="p-4 border-b border-gray-700/50">
          <div className="text-sm text-gray-400 mb-2">Evidence:</div>
          <div className="flex flex-wrap gap-2">
            {correction.evidenceUrls.map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-400 hover:text-blue-300 underline"
              >
                Source {i + 1}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="p-4 flex items-center justify-between bg-gray-800/50">
        <div className="text-sm text-gray-500">
          Submitted by: <span className="text-gray-400">{correction.submittedBy}</span>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors">
            View Details
          </button>
          <button className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm transition-colors border border-red-600/30">
            Reject
          </button>
          <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors">
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}

function FilterBar() {
  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-400">Status:</label>
        <select className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm">
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="under_review">Under Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-400">Priority:</label>
        <select className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm">
          <option value="all">All</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-400">Type:</label>
        <select className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm">
          <option value="all">All Types</option>
          <option value="hallucination">Hallucination</option>
          <option value="factual_error">Factual Error</option>
          <option value="score_too_high">Score Too High</option>
          <option value="score_too_low">Score Too Low</option>
          <option value="competitor_confusion">Competitor Confusion</option>
        </select>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Search brands..."
          className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-500 w-48"
        />
        <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors">
          Search
        </button>
      </div>
    </div>
  );
}

// ================================================================
// PAGE
// ================================================================

export default async function CorrectionReviewPage() {
  const [stats, corrections] = await Promise.all([getQueueStats(), getPendingCorrections()]);

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Correction Review Queue</h1>
            <p className="text-gray-400 text-sm mt-1">Review and approve brand corrections from users</p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm border border-gray-700 transition-colors">
              Export Log
            </button>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors">
              Bulk Actions
            </button>
          </div>
        </div>

        {/* Stats */}
        <section className="mb-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard label="Pending" value={stats.pending} color="text-blue-400" />
            <StatCard label="Under Review" value={stats.underReview} color="text-yellow-400" />
            <StatCard label="Approved" value={stats.approved} color="text-green-400" />
            <StatCard label="Rejected" value={stats.rejected} color="text-red-400" />
            <StatCard label="Avg Review Time" value={`${stats.avgReviewTime}m`} />
            <StatCard label="Reviewed Today" value={stats.todayReviewed} />
          </div>
        </section>

        {/* Filters */}
        <section className="mb-6">
          <FilterBar />
        </section>

        {/* Priority Notice */}
        {corrections.some((c) => c.priority === 'critical') && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
            <span className="text-2xl">!</span>
            <div>
              <div className="text-red-400 font-medium">Critical Corrections Pending</div>
              <div className="text-red-300/70 text-sm">
                {corrections.filter((c) => c.priority === 'critical').length} hallucination or
                factual error reports require immediate review
              </div>
            </div>
          </div>
        )}

        {/* Corrections List */}
        <section className="space-y-4">
          {corrections.map((correction) => (
            <CorrectionCard key={correction.id} correction={correction} />
          ))}
        </section>

        {/* Pagination */}
        <div className="mt-8 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing 1-{corrections.length} of {stats.pending + stats.underReview} corrections
          </div>
          <div className="flex gap-2">
            <button
              className="px-3 py-1.5 bg-gray-800 text-gray-400 rounded border border-gray-700"
              disabled
            >
              Previous
            </button>
            <button className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded border border-gray-700">
              Next
            </button>
          </div>
        </div>

        {/* Guidelines */}
        <section className="mt-8 p-6 bg-gray-800/50 rounded-xl border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Review Guidelines</h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium text-gray-300 mb-2">When to Approve</h4>
              <ul className="space-y-1 text-gray-400">
                <li>Clear evidence supports the correction</li>
                <li>Score difference is justified by facts</li>
                <li>Hallucination is verifiable as false</li>
                <li>User provides reliable sources</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-300 mb-2">When to Reject</h4>
              <ul className="space-y-1 text-gray-400">
                <li>No evidence or weak justification</li>
                <li>Opinion-based rather than factual</li>
                <li>Attempting to game the system</li>
                <li>Duplicate of existing correction</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
