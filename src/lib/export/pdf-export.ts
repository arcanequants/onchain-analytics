/**
 * PDF Export Service
 *
 * Phase 4, Week 8 Extended - Data Visualization Checklist
 *
 * Features:
 * - 3-page report generation
 * - Brand analysis summary
 * - Score visualizations
 * - Recommendations section
 * - Professional formatting
 * - Logo and branding support
 */

// ============================================================================
// TYPES
// ============================================================================

export interface BrandAnalysisData {
  brandName: string;
  brandUrl: string;
  analysisDate: string;
  overallScore: number;
  providerScores: ProviderScore[];
  metrics: MetricData[];
  recommendations: Recommendation[];
  trends?: TrendData[];
  competitors?: CompetitorData[];
}

export interface ProviderScore {
  provider: string;
  score: number;
  visibility: number;
  sentiment: number;
  accuracy: number;
}

export interface MetricData {
  name: string;
  value: number;
  previousValue?: number;
  change?: number;
  unit?: string;
}

export interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  impact: string;
}

export interface TrendData {
  date: string;
  score: number;
}

export interface CompetitorData {
  name: string;
  score: number;
  difference: number;
}

export interface PDFExportOptions {
  includeCompetitors?: boolean;
  includeTrends?: boolean;
  includeDetailedMetrics?: boolean;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface PDFGenerationResult {
  success: boolean;
  blob?: Blob;
  error?: string;
  pages: number;
  generatedAt: string;
}

// ============================================================================
// HTML TEMPLATE GENERATION
// ============================================================================

function generateScoreCircleSVG(score: number, size: number = 80): string {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle
        cx="${size / 2}"
        cy="${size / 2}"
        r="${radius}"
        fill="none"
        stroke="#e5e7eb"
        stroke-width="${strokeWidth}"
      />
      <circle
        cx="${size / 2}"
        cy="${size / 2}"
        r="${radius}"
        fill="none"
        stroke="${color}"
        stroke-width="${strokeWidth}"
        stroke-dasharray="${circumference}"
        stroke-dashoffset="${circumference - progress}"
        transform="rotate(-90 ${size / 2} ${size / 2})"
        stroke-linecap="round"
      />
      <text
        x="${size / 2}"
        y="${size / 2}"
        text-anchor="middle"
        dominant-baseline="central"
        font-size="${size * 0.25}"
        font-weight="bold"
        fill="#1f2937"
      >
        ${score}
      </text>
    </svg>
  `;
}

function generatePage1(data: BrandAnalysisData, options: PDFExportOptions): string {
  const { brandName, brandUrl, analysisDate, overallScore, providerScores } = data;
  const primaryColor = options.primaryColor || '#3b82f6';

  return `
    <div class="page page-1">
      <!-- Header -->
      <header class="header">
        <div class="logo">
          ${options.logoUrl ? `<img src="${options.logoUrl}" alt="Logo" height="40" />` : '<span class="logo-text">AI Perception</span>'}
        </div>
        <div class="report-title">
          <h1>Brand Perception Report</h1>
          <p class="subtitle">AI Visibility Analysis</p>
        </div>
        <div class="date">${new Date(analysisDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </header>

      <!-- Brand Info -->
      <section class="brand-info">
        <h2 class="brand-name" style="color: ${primaryColor}">${brandName}</h2>
        <p class="brand-url">${brandUrl}</p>
      </section>

      <!-- Overall Score -->
      <section class="overall-score">
        <h3>Overall AI Perception Score</h3>
        <div class="score-container">
          ${generateScoreCircleSVG(overallScore, 120)}
          <div class="score-description">
            <p class="score-label">
              ${overallScore >= 80 ? 'Excellent' : overallScore >= 60 ? 'Good' : overallScore >= 40 ? 'Needs Improvement' : 'Critical'}
            </p>
            <p class="score-summary">
              Your brand's visibility across major AI platforms is
              ${overallScore >= 80 ? 'strong and well-optimized' :
                overallScore >= 60 ? 'good but has room for improvement' :
                overallScore >= 40 ? 'moderate and needs attention' :
                'low and requires immediate action'}.
            </p>
          </div>
        </div>
      </section>

      <!-- Provider Breakdown -->
      <section class="provider-breakdown">
        <h3>AI Provider Breakdown</h3>
        <div class="providers-grid">
          ${providerScores.map(p => `
            <div class="provider-card">
              <div class="provider-header">
                <span class="provider-name">${p.provider}</span>
                <span class="provider-score">${p.score}</span>
              </div>
              <div class="provider-metrics">
                <div class="metric">
                  <span class="metric-label">Visibility</span>
                  <div class="metric-bar">
                    <div class="metric-fill" style="width: ${p.visibility}%"></div>
                  </div>
                  <span class="metric-value">${p.visibility}%</span>
                </div>
                <div class="metric">
                  <span class="metric-label">Sentiment</span>
                  <div class="metric-bar">
                    <div class="metric-fill" style="width: ${p.sentiment}%"></div>
                  </div>
                  <span class="metric-value">${p.sentiment}%</span>
                </div>
                <div class="metric">
                  <span class="metric-label">Accuracy</span>
                  <div class="metric-bar">
                    <div class="metric-fill" style="width: ${p.accuracy}%"></div>
                  </div>
                  <span class="metric-value">${p.accuracy}%</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </section>

      <footer class="page-footer">
        <span>Page 1 of 3</span>
        <span>Generated by AI Perception</span>
      </footer>
    </div>
  `;
}

function generatePage2(data: BrandAnalysisData, options: PDFExportOptions): string {
  const { metrics, trends, competitors } = data;
  const primaryColor = options.primaryColor || '#3b82f6';

  return `
    <div class="page page-2">
      <header class="header-mini">
        <span class="brand-name-mini">${data.brandName}</span>
        <span class="report-type">Detailed Metrics</span>
      </header>

      <!-- Key Metrics -->
      <section class="key-metrics">
        <h3>Key Performance Metrics</h3>
        <div class="metrics-grid">
          ${metrics.map(m => `
            <div class="metric-card">
              <div class="metric-name">${m.name}</div>
              <div class="metric-value-large">${m.value}${m.unit || ''}</div>
              ${m.change !== undefined ? `
                <div class="metric-change ${m.change >= 0 ? 'positive' : 'negative'}">
                  ${m.change >= 0 ? '↑' : '↓'} ${Math.abs(m.change)}%
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </section>

      ${options.includeTrends && trends && trends.length > 0 ? `
        <!-- Trend Analysis -->
        <section class="trend-analysis">
          <h3>Score Trend (Last 30 Days)</h3>
          <div class="trend-chart">
            <svg width="100%" height="150" viewBox="0 0 600 150" preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke="${primaryColor}"
                stroke-width="2"
                points="${trends.map((t, i) =>
                  `${(i / (trends.length - 1)) * 580 + 10},${150 - (t.score / 100) * 130 - 10}`
                ).join(' ')}"
              />
              <polygon
                fill="${primaryColor}"
                opacity="0.1"
                points="10,140 ${trends.map((t, i) =>
                  `${(i / (trends.length - 1)) * 580 + 10},${150 - (t.score / 100) * 130 - 10}`
                ).join(' ')} 590,140"
              />
            </svg>
            <div class="trend-labels">
              <span>${trends[0]?.date || ''}</span>
              <span>${trends[trends.length - 1]?.date || ''}</span>
            </div>
          </div>
        </section>
      ` : ''}

      ${options.includeCompetitors && competitors && competitors.length > 0 ? `
        <!-- Competitor Comparison -->
        <section class="competitor-comparison">
          <h3>Competitor Comparison</h3>
          <div class="competitor-table">
            <div class="competitor-row header">
              <span class="col-name">Competitor</span>
              <span class="col-score">Score</span>
              <span class="col-diff">vs You</span>
            </div>
            ${competitors.map(c => `
              <div class="competitor-row">
                <span class="col-name">${c.name}</span>
                <span class="col-score">${c.score}</span>
                <span class="col-diff ${c.difference >= 0 ? 'negative' : 'positive'}">
                  ${c.difference >= 0 ? '+' : ''}${c.difference}
                </span>
              </div>
            `).join('')}
          </div>
        </section>
      ` : ''}

      <footer class="page-footer">
        <span>Page 2 of 3</span>
        <span>Generated by AI Perception</span>
      </footer>
    </div>
  `;
}

function generatePage3(data: BrandAnalysisData, _options: PDFExportOptions): string {
  const { recommendations } = data;

  const priorityColors = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#10b981',
  };

  return `
    <div class="page page-3">
      <header class="header-mini">
        <span class="brand-name-mini">${data.brandName}</span>
        <span class="report-type">Recommendations</span>
      </header>

      <!-- Recommendations -->
      <section class="recommendations">
        <h3>Action Items to Improve Your AI Perception</h3>

        ${recommendations.map((rec, index) => `
          <div class="recommendation-card">
            <div class="rec-header">
              <span class="rec-number">${index + 1}</span>
              <span class="rec-priority" style="background: ${priorityColors[rec.priority]}">
                ${rec.priority.toUpperCase()}
              </span>
              <span class="rec-category">${rec.category}</span>
            </div>
            <h4 class="rec-title">${rec.title}</h4>
            <p class="rec-description">${rec.description}</p>
            <div class="rec-impact">
              <strong>Expected Impact:</strong> ${rec.impact}
            </div>
          </div>
        `).join('')}
      </section>

      <!-- Next Steps -->
      <section class="next-steps">
        <h3>Next Steps</h3>
        <ol class="steps-list">
          <li>Review the high-priority recommendations above</li>
          <li>Implement changes to your brand's digital presence</li>
          <li>Monitor your score changes over the next 30 days</li>
          <li>Schedule a follow-up analysis to track improvement</li>
        </ol>
      </section>

      <!-- CTA -->
      <section class="cta">
        <p>Need help implementing these recommendations?</p>
        <p class="cta-link">Visit <strong>aiperception.com</strong> for more insights</p>
      </section>

      <footer class="page-footer">
        <span>Page 3 of 3</span>
        <span>Generated by AI Perception</span>
      </footer>
    </div>
  `;
}

function generateStyles(options: PDFExportOptions): string {
  const primaryColor = options.primaryColor || '#3b82f6';
  const secondaryColor = options.secondaryColor || '#1f2937';

  return `
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color: #1f2937; }

      .page {
        width: 210mm;
        min-height: 297mm;
        padding: 20mm;
        background: white;
        page-break-after: always;
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 2px solid ${primaryColor};
      }

      .logo-text { font-size: 24px; font-weight: 700; color: ${primaryColor}; }
      .report-title h1 { font-size: 20px; color: ${secondaryColor}; }
      .subtitle { font-size: 14px; color: #6b7280; }
      .date { font-size: 12px; color: #6b7280; }

      .header-mini {
        display: flex;
        justify-content: space-between;
        margin-bottom: 24px;
        padding-bottom: 12px;
        border-bottom: 1px solid #e5e7eb;
      }
      .brand-name-mini { font-weight: 600; color: ${primaryColor}; }
      .report-type { color: #6b7280; font-size: 14px; }

      .brand-info { text-align: center; margin: 32px 0; }
      .brand-name { font-size: 32px; font-weight: 700; margin-bottom: 8px; }
      .brand-url { color: #6b7280; font-size: 14px; }

      .overall-score { margin: 32px 0; }
      .overall-score h3 { font-size: 18px; margin-bottom: 16px; color: ${secondaryColor}; }
      .score-container { display: flex; align-items: center; gap: 24px; }
      .score-description { flex: 1; }
      .score-label { font-size: 24px; font-weight: 600; margin-bottom: 8px; }
      .score-summary { color: #6b7280; line-height: 1.6; }

      .provider-breakdown h3 { font-size: 18px; margin-bottom: 16px; color: ${secondaryColor}; }
      .providers-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
      .provider-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }
      .provider-header { display: flex; justify-content: space-between; margin-bottom: 12px; }
      .provider-name { font-weight: 600; }
      .provider-score { font-size: 24px; font-weight: 700; color: ${primaryColor}; }
      .provider-metrics { space-y: 8px; }
      .metric { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
      .metric-label { width: 80px; font-size: 12px; color: #6b7280; }
      .metric-bar { flex: 1; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; }
      .metric-fill { height: 100%; background: ${primaryColor}; border-radius: 4px; }
      .metric-value { width: 40px; text-align: right; font-size: 12px; }

      .key-metrics h3 { font-size: 18px; margin-bottom: 16px; color: ${secondaryColor}; }
      .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
      .metric-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; text-align: center; }
      .metric-name { font-size: 12px; color: #6b7280; margin-bottom: 8px; }
      .metric-value-large { font-size: 28px; font-weight: 700; color: ${secondaryColor}; }
      .metric-change { font-size: 12px; margin-top: 4px; }
      .metric-change.positive { color: #10b981; }
      .metric-change.negative { color: #ef4444; }

      .trend-analysis h3, .competitor-comparison h3 { font-size: 18px; margin-bottom: 16px; color: ${secondaryColor}; }
      .trend-chart { background: #f9fafb; border-radius: 8px; padding: 16px; }
      .trend-labels { display: flex; justify-content: space-between; font-size: 12px; color: #6b7280; margin-top: 8px; }

      .competitor-table { border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
      .competitor-row { display: grid; grid-template-columns: 2fr 1fr 1fr; padding: 12px 16px; }
      .competitor-row.header { background: #f3f4f6; font-weight: 600; font-size: 12px; color: #6b7280; }
      .competitor-row:not(.header) { border-top: 1px solid #e5e7eb; }
      .col-diff.positive { color: #10b981; }
      .col-diff.negative { color: #ef4444; }

      .recommendations h3 { font-size: 18px; margin-bottom: 16px; color: ${secondaryColor}; }
      .recommendation-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
      .rec-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
      .rec-number { width: 24px; height: 24px; background: ${primaryColor}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; }
      .rec-priority { padding: 2px 8px; border-radius: 4px; color: white; font-size: 10px; font-weight: 600; }
      .rec-category { color: #6b7280; font-size: 12px; }
      .rec-title { font-size: 16px; margin-bottom: 8px; }
      .rec-description { color: #6b7280; font-size: 14px; line-height: 1.6; margin-bottom: 12px; }
      .rec-impact { font-size: 12px; color: #6b7280; padding-top: 12px; border-top: 1px solid #e5e7eb; }

      .next-steps h3 { font-size: 18px; margin-bottom: 16px; color: ${secondaryColor}; }
      .steps-list { padding-left: 24px; color: #6b7280; line-height: 2; }

      .cta { text-align: center; margin-top: 32px; padding: 24px; background: #f3f4f6; border-radius: 8px; }
      .cta-link { color: ${primaryColor}; margin-top: 8px; }

      .page-footer {
        position: absolute;
        bottom: 20mm;
        left: 20mm;
        right: 20mm;
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: #9ca3af;
        padding-top: 12px;
        border-top: 1px solid #e5e7eb;
      }

      @media print {
        .page { margin: 0; box-shadow: none; }
        .page-footer { position: fixed; bottom: 10mm; }
      }
    </style>
  `;
}

// ============================================================================
// MAIN EXPORT FUNCTION
// ============================================================================

export function generatePDFHTML(
  data: BrandAnalysisData,
  options: PDFExportOptions = {}
): string {
  const fullOptions: PDFExportOptions = {
    includeCompetitors: true,
    includeTrends: true,
    includeDetailedMetrics: true,
    ...options,
  };

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Brand Perception Report - ${data.brandName}</title>
      ${generateStyles(fullOptions)}
    </head>
    <body>
      ${generatePage1(data, fullOptions)}
      ${generatePage2(data, fullOptions)}
      ${generatePage3(data, fullOptions)}
    </body>
    </html>
  `;
}

/**
 * Generate PDF blob from HTML (requires browser environment)
 */
export async function generatePDFBlob(
  data: BrandAnalysisData,
  options: PDFExportOptions = {}
): Promise<PDFGenerationResult> {
  try {
    const html = generatePDFHTML(data, options);

    // Use print-to-PDF via iframe
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position: absolute; left: -9999px; width: 210mm; height: 297mm;';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      throw new Error('Failed to create iframe document');
    }

    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();

    // Wait for images to load
    await new Promise(resolve => setTimeout(resolve, 500));

    // Trigger print dialog (user can save as PDF)
    iframe.contentWindow?.print();

    // Clean up
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);

    return {
      success: true,
      pages: 3,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      pages: 0,
      generatedAt: new Date().toISOString(),
    };
  }
}

/**
 * Download PDF directly (opens print dialog)
 */
export function downloadPDF(
  data: BrandAnalysisData,
  options: PDFExportOptions = {}
): void {
  const html = generatePDFHTML(data, options);

  // Open in new window and trigger print
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  generatePDFHTML,
  generatePDFBlob,
  downloadPDF,
};
