/**
 * Dynamic OpenGraph Image for Results Pages
 *
 * Phase 1, Week 2, Day 5
 *
 * Generates dynamic OG images for social sharing
 * using Vercel's @vercel/og library.
 */

import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';
export const alt = 'AI Perception Score Results';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

// ================================================================
// TYPES
// ================================================================

interface ScoreData {
  brandName: string;
  score: number;
  grade: string;
  categoryScores?: {
    name: string;
    score: number;
  }[];
}

// ================================================================
// HELPER FUNCTIONS
// ================================================================

function getScoreColor(score: number): string {
  if (score >= 90) return '#22c55e'; // green-500
  if (score >= 80) return '#84cc16'; // lime-500
  if (score >= 70) return '#eab308'; // yellow-500
  if (score >= 60) return '#f97316'; // orange-500
  if (score >= 50) return '#ef4444'; // red-500
  return '#dc2626'; // red-600
}

function getGradeFromScore(score: number): string {
  if (score >= 90) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 80) return 'A-';
  if (score >= 77) return 'B+';
  if (score >= 73) return 'B';
  if (score >= 70) return 'B-';
  if (score >= 67) return 'C+';
  if (score >= 63) return 'C';
  if (score >= 60) return 'C-';
  if (score >= 55) return 'D+';
  if (score >= 50) return 'D';
  return 'F';
}

// Mock data fetcher - in production would fetch from database
async function getScoreData(id: string): Promise<ScoreData> {
  // In production, fetch from Supabase:
  // const { data } = await supabase.from('analyses').select('*').eq('id', id).single();

  // For now, generate mock data based on ID hash
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const score = 50 + (hash % 50); // Score between 50-99

  return {
    brandName: 'Brand Analysis',
    score,
    grade: getGradeFromScore(score),
    categoryScores: [
      { name: 'Brand Recognition', score: 45 + (hash % 45) },
      { name: 'Content Quality', score: 40 + (hash % 50) },
      { name: 'AI Visibility', score: 35 + (hash % 55) },
      { name: 'Recommendations', score: 50 + (hash % 40) },
    ],
  };
}

// ================================================================
// IMAGE GENERATION
// ================================================================

export default async function OGImage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<ImageResponse> {
  const { id } = await params;
  const data = await getScoreData(id);
  const scoreColor = getScoreColor(data.score);

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0a0a0a',
          padding: '48px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            {/* Logo placeholder */}
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '24px',
                fontWeight: 'bold',
              }}
            >
              AI
            </div>
            <span
              style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: '#ffffff',
              }}
            >
              AI Perception
            </span>
          </div>
          <span
            style={{
              fontSize: '18px',
              color: '#9ca3af',
            }}
          >
            vectorialdata.com
          </span>
        </div>

        {/* Main Content */}
        <div
          style={{
            display: 'flex',
            flex: 1,
            gap: '48px',
          }}
        >
          {/* Score Circle */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '320px',
            }}
          >
            {/* Circular Score */}
            <div
              style={{
                width: '240px',
                height: '240px',
                borderRadius: '50%',
                background: `conic-gradient(${scoreColor} ${data.score * 3.6}deg, #27272a ${data.score * 3.6}deg)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: '200px',
                  height: '200px',
                  borderRadius: '50%',
                  backgroundColor: '#0a0a0a',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span
                  style={{
                    fontSize: '64px',
                    fontWeight: 'bold',
                    color: scoreColor,
                    lineHeight: 1,
                  }}
                >
                  {data.score}
                </span>
                <span
                  style={{
                    fontSize: '20px',
                    color: '#9ca3af',
                  }}
                >
                  / 100
                </span>
              </div>
            </div>

            {/* Grade Badge */}
            <div
              style={{
                marginTop: '24px',
                padding: '8px 24px',
                borderRadius: '9999px',
                backgroundColor: scoreColor,
                color: '#000000',
                fontSize: '24px',
                fontWeight: 'bold',
              }}
            >
              Grade {data.grade}
            </div>
          </div>

          {/* Details */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              justifyContent: 'center',
            }}
          >
            <h1
              style={{
                fontSize: '42px',
                fontWeight: 'bold',
                color: '#ffffff',
                marginBottom: '8px',
                lineHeight: 1.2,
              }}
            >
              AI Perception Score
            </h1>
            <p
              style={{
                fontSize: '24px',
                color: '#9ca3af',
                marginBottom: '32px',
              }}
            >
              {data.brandName}
            </p>

            {/* Category Scores */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              {data.categoryScores?.slice(0, 4).map((category, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '18px',
                      color: '#d1d5db',
                      width: '180px',
                    }}
                  >
                    {category.name}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: '12px',
                      backgroundColor: '#27272a',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      display: 'flex',
                    }}
                  >
                    <div
                      style={{
                        width: `${category.score}%`,
                        height: '100%',
                        backgroundColor: getScoreColor(category.score),
                        borderRadius: '6px',
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: '18px',
                      color: getScoreColor(category.score),
                      width: '50px',
                      textAlign: 'right',
                    }}
                  >
                    {category.score}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '24px',
            borderTop: '1px solid #27272a',
            marginTop: '24px',
          }}
        >
          <span
            style={{
              fontSize: '16px',
              color: '#6b7280',
            }}
          >
            Discover how AI perceives your brand
          </span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            {['ChatGPT', 'Claude', 'Gemini', 'Perplexity'].map((provider, i) => (
              <span
                key={i}
                style={{
                  fontSize: '14px',
                  color: '#9ca3af',
                  padding: '4px 12px',
                  backgroundColor: '#1f2937',
                  borderRadius: '9999px',
                }}
              >
                {provider}
              </span>
            ))}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
