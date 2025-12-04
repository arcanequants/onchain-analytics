/**
 * Public Score Badge API
 *
 * Generates embeddable SVG badges showing AI perception scores
 *
 * Phase 2, Week 7, Day 1
 */

import { NextRequest, NextResponse } from 'next/server';

// ================================================================
// TYPES
// ================================================================

interface BadgeParams {
  brandId: string;
}

type BadgeStyle = 'flat' | 'flat-square' | 'plastic' | 'for-the-badge';
type BadgeSize = 'small' | 'medium' | 'large';

// ================================================================
// MOCK DATA (Replace with database lookups)
// ================================================================

const MOCK_SCORES: Record<string, { score: number; trend: 'up' | 'down' | 'stable'; brandName: string }> = {
  'stripe': { score: 87, trend: 'up', brandName: 'Stripe' },
  'openai': { score: 92, trend: 'up', brandName: 'OpenAI' },
  'anthropic': { score: 89, trend: 'stable', brandName: 'Anthropic' },
  'figma': { score: 84, trend: 'up', brandName: 'Figma' },
  'notion': { score: 78, trend: 'down', brandName: 'Notion' },
};

// ================================================================
// COLOR HELPERS
// ================================================================

function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e'; // Green
  if (score >= 60) return '#eab308'; // Yellow
  if (score >= 40) return '#f97316'; // Orange
  return '#ef4444'; // Red
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Needs Work';
}

// ================================================================
// SVG BADGE GENERATORS
// ================================================================

function generateFlatBadge(
  score: number,
  label: string,
  size: BadgeSize
): string {
  const sizes = {
    small: { width: 120, height: 20, fontSize: 11, padding: 6 },
    medium: { width: 150, height: 28, fontSize: 13, padding: 8 },
    large: { width: 180, height: 36, fontSize: 15, padding: 10 },
  };

  const { width, height, fontSize, padding } = sizes[size];
  const labelWidth = Math.floor(width * 0.55);
  const scoreWidth = width - labelWidth;
  const color = getScoreColor(score);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <linearGradient id="smooth" x2="0" y2="100%">
      <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
      <stop offset="1" stop-opacity=".1"/>
    </linearGradient>
    <clipPath id="round">
      <rect width="${width}" height="${height}" rx="3" fill="#fff"/>
    </clipPath>
    <g clip-path="url(#round)">
      <rect width="${labelWidth}" height="${height}" fill="#555"/>
      <rect x="${labelWidth}" width="${scoreWidth}" height="${height}" fill="${color}"/>
      <rect width="${width}" height="${height}" fill="url(#smooth)"/>
    </g>
    <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="${fontSize}">
      <text x="${labelWidth / 2}" y="${height / 2 + fontSize * 0.35}" fill="#010101" fill-opacity=".3">${label}</text>
      <text x="${labelWidth / 2}" y="${height / 2 + fontSize * 0.35 - 1}">${label}</text>
      <text x="${labelWidth + scoreWidth / 2}" y="${height / 2 + fontSize * 0.35}" fill="#010101" fill-opacity=".3">${score}/100</text>
      <text x="${labelWidth + scoreWidth / 2}" y="${height / 2 + fontSize * 0.35 - 1}">${score}/100</text>
    </g>
  </svg>`;
}

function generateFlatSquareBadge(
  score: number,
  label: string,
  size: BadgeSize
): string {
  const sizes = {
    small: { width: 120, height: 20, fontSize: 11 },
    medium: { width: 150, height: 28, fontSize: 13 },
    large: { width: 180, height: 36, fontSize: 15 },
  };

  const { width, height, fontSize } = sizes[size];
  const labelWidth = Math.floor(width * 0.55);
  const scoreWidth = width - labelWidth;
  const color = getScoreColor(score);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <g>
      <rect width="${labelWidth}" height="${height}" fill="#555"/>
      <rect x="${labelWidth}" width="${scoreWidth}" height="${height}" fill="${color}"/>
    </g>
    <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="${fontSize}">
      <text x="${labelWidth / 2}" y="${height / 2 + fontSize * 0.35}">${label}</text>
      <text x="${labelWidth + scoreWidth / 2}" y="${height / 2 + fontSize * 0.35}">${score}/100</text>
    </g>
  </svg>`;
}

function generatePlasticBadge(
  score: number,
  label: string,
  size: BadgeSize
): string {
  const sizes = {
    small: { width: 130, height: 20, fontSize: 11 },
    medium: { width: 160, height: 28, fontSize: 13 },
    large: { width: 190, height: 36, fontSize: 15 },
  };

  const { width, height, fontSize } = sizes[size];
  const labelWidth = Math.floor(width * 0.55);
  const scoreWidth = width - labelWidth;
  const color = getScoreColor(score);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <linearGradient id="b" x2="0" y2="100%">
      <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
      <stop offset="1" stop-opacity=".1"/>
    </linearGradient>
    <clipPath id="a">
      <rect width="${width}" height="${height}" rx="${height / 2}" fill="#fff"/>
    </clipPath>
    <g clip-path="url(#a)">
      <rect width="${labelWidth}" height="${height}" fill="#555"/>
      <rect x="${labelWidth}" width="${scoreWidth}" height="${height}" fill="${color}"/>
      <rect width="${width}" height="${height}" fill="url(#b)"/>
    </g>
    <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="${fontSize}">
      <text x="${labelWidth / 2}" y="${height / 2 + fontSize * 0.35}" fill="#010101" fill-opacity=".3">${label}</text>
      <text x="${labelWidth / 2}" y="${height / 2 + fontSize * 0.35 - 1}">${label}</text>
      <text x="${labelWidth + scoreWidth / 2}" y="${height / 2 + fontSize * 0.35}" fill="#010101" fill-opacity=".3">${score}/100</text>
      <text x="${labelWidth + scoreWidth / 2}" y="${height / 2 + fontSize * 0.35 - 1}">${score}/100</text>
    </g>
  </svg>`;
}

function generateForTheBadge(
  score: number,
  label: string,
  size: BadgeSize
): string {
  const sizes = {
    small: { width: 160, height: 28, fontSize: 10 },
    medium: { width: 200, height: 36, fontSize: 12 },
    large: { width: 240, height: 44, fontSize: 14 },
  };

  const { width, height, fontSize } = sizes[size];
  const labelWidth = Math.floor(width * 0.55);
  const scoreWidth = width - labelWidth;
  const color = getScoreColor(score);
  const scoreLabel = getScoreLabel(score);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <g>
      <rect width="${labelWidth}" height="${height}" fill="#555"/>
      <rect x="${labelWidth}" width="${scoreWidth}" height="${height}" fill="${color}"/>
    </g>
    <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="${fontSize}" font-weight="bold" text-transform="uppercase">
      <text x="${labelWidth / 2}" y="${height / 2 + fontSize * 0.35}">${label.toUpperCase()}</text>
      <text x="${labelWidth + scoreWidth / 2}" y="${height / 2 + fontSize * 0.35}">${score} - ${scoreLabel.toUpperCase()}</text>
    </g>
  </svg>`;
}

// ================================================================
// ROUTE HANDLER
// ================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<BadgeParams> }
): Promise<NextResponse> {
  const { brandId } = await params;
  const searchParams = request.nextUrl.searchParams;

  // Parse query parameters
  const style = (searchParams.get('style') || 'flat') as BadgeStyle;
  const size = (searchParams.get('size') || 'medium') as BadgeSize;
  const label = searchParams.get('label') || 'AI Score';
  const format = searchParams.get('format') || 'svg';

  // Validate parameters
  const validStyles: BadgeStyle[] = ['flat', 'flat-square', 'plastic', 'for-the-badge'];
  const validSizes: BadgeSize[] = ['small', 'medium', 'large'];

  if (!validStyles.includes(style)) {
    return NextResponse.json(
      { error: 'Invalid style. Use: flat, flat-square, plastic, or for-the-badge' },
      { status: 400 }
    );
  }

  if (!validSizes.includes(size)) {
    return NextResponse.json(
      { error: 'Invalid size. Use: small, medium, or large' },
      { status: 400 }
    );
  }

  // Get score data (mock for now)
  const scoreData = MOCK_SCORES[brandId.toLowerCase()];

  if (!scoreData) {
    // Return a "not found" badge
    const notFoundSvg = generateFlatBadge(0, 'AI Score', size)
      .replace(/#22c55e|#eab308|#f97316|#ef4444/g, '#999');

    return new NextResponse(notFoundSvg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  }

  // Generate SVG based on style
  let svg: string;
  switch (style) {
    case 'flat':
      svg = generateFlatBadge(scoreData.score, label, size);
      break;
    case 'flat-square':
      svg = generateFlatSquareBadge(scoreData.score, label, size);
      break;
    case 'plastic':
      svg = generatePlasticBadge(scoreData.score, label, size);
      break;
    case 'for-the-badge':
      svg = generateForTheBadge(scoreData.score, label, size);
      break;
    default:
      svg = generateFlatBadge(scoreData.score, label, size);
  }

  // Handle different formats
  if (format === 'json') {
    return NextResponse.json({
      brandId,
      brandName: scoreData.brandName,
      score: scoreData.score,
      trend: scoreData.trend,
      label: getScoreLabel(scoreData.score),
      badgeUrl: `${request.nextUrl.origin}/api/badge/${brandId}?style=${style}&size=${size}`,
      embedCode: `<img src="${request.nextUrl.origin}/api/badge/${brandId}?style=${style}&size=${size}" alt="AI Perception Score: ${scoreData.score}/100" />`,
    });
  }

  // SECURITY NOTE: This endpoint intentionally uses wildcard CORS
  // because badges are meant to be embedded on any website.
  // This is a read-only, public endpoint with no sensitive data.
  return new NextResponse(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      'Access-Control-Allow-Origin': '*', // Allow embedding on any website (intentional)
    },
  });
}
