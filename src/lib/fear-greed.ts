import { supabaseAdmin } from './supabase'

export interface FearGreedData {
  value: number
  classification: 'extreme_fear' | 'fear' | 'neutral' | 'greed' | 'extreme_greed'
  timestamp: string
  // Optional components (Alternative.me doesn't provide these, but we have fields for future)
  volatility?: number
  market_momentum?: number
  social_media?: number
  surveys?: number
  bitcoin_dominance?: number
  google_trends?: number
}

interface AlternativeMeResponse {
  name: string
  data: Array<{
    value: string
    value_classification: string
    timestamp: string
    time_until_update?: string
  }>
  metadata: {
    error: string | null
  }
}

/**
 * Map Alternative.me classification to our database enum
 */
function mapClassification(classification: string): FearGreedData['classification'] {
  const normalized = classification.toLowerCase().replace(/\s+/g, '_')

  switch (normalized) {
    case 'extreme_fear':
      return 'extreme_fear'
    case 'fear':
      return 'fear'
    case 'neutral':
      return 'neutral'
    case 'greed':
      return 'greed'
    case 'extreme_greed':
      return 'extreme_greed'
    default:
      // Default to neutral if unknown
      return 'neutral'
  }
}

/**
 * Fetch current Fear & Greed Index from Alternative.me API
 */
export async function fetchFearGreedIndex(): Promise<FearGreedData> {
  try {
    const response = await fetch('https://api.alternative.me/fng/?limit=1')

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }

    const data: AlternativeMeResponse = await response.json()

    if (data.metadata.error) {
      throw new Error(`API error: ${data.metadata.error}`)
    }

    if (!data.data || data.data.length === 0) {
      throw new Error('No data returned from API')
    }

    const latest = data.data[0]

    return {
      value: parseInt(latest.value),
      classification: mapClassification(latest.value_classification),
      timestamp: new Date(parseInt(latest.timestamp) * 1000).toISOString()
    }
  } catch (error) {
    console.error('Error fetching Fear & Greed Index:', error)
    throw error
  }
}

/**
 * Fetch historical Fear & Greed Index data
 */
export async function fetchFearGreedHistory(days: number = 30): Promise<FearGreedData[]> {
  try {
    const response = await fetch(`https://api.alternative.me/fng/?limit=${days}`)

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }

    const data: AlternativeMeResponse = await response.json()

    if (data.metadata.error) {
      throw new Error(`API error: ${data.metadata.error}`)
    }

    return data.data.map(item => ({
      value: parseInt(item.value),
      classification: mapClassification(item.value_classification),
      timestamp: new Date(parseInt(item.timestamp) * 1000).toISOString()
    }))
  } catch (error) {
    console.error('Error fetching Fear & Greed history:', error)
    throw error
  }
}

/**
 * Save Fear & Greed data to Supabase database
 */
export async function saveFearGreedToDatabase(data: FearGreedData): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('fear_greed_index')
      .insert({
        value: data.value,
        classification: data.classification,
        timestamp: data.timestamp,
        volatility: data.volatility || null,
        market_momentum: data.market_momentum || null,
        social_media: data.social_media || null,
        surveys: data.surveys || null,
        bitcoin_dominance: data.bitcoin_dominance || null,
        google_trends: data.google_trends || null
      })

    if (error) {
      console.error('Error saving Fear & Greed data:', error)
      throw error
    }
  } catch (error) {
    console.error('Failed to save Fear & Greed data:', error)
    throw error
  }
}

/**
 * Get latest Fear & Greed data from database
 */
export async function getLatestFearGreed(): Promise<FearGreedData | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('fear_greed_index')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.error('Error fetching latest Fear & Greed:', error)
      return null
    }

    if (!data) {
      return null
    }

    return {
      value: data.value,
      classification: data.classification,
      timestamp: data.timestamp,
      volatility: data.volatility,
      market_momentum: data.market_momentum,
      social_media: data.social_media,
      surveys: data.surveys,
      bitcoin_dominance: data.bitcoin_dominance,
      google_trends: data.google_trends
    }
  } catch (error) {
    console.error('Failed to get latest Fear & Greed:', error)
    return null
  }
}
