import { supabaseAdmin } from './supabase'
import { captureException } from '@sentry/nextjs'

// ================================================================
// TYPE DEFINITIONS
// ================================================================

export type EventType = 'unlock' | 'airdrop' | 'listing' | 'mainnet' | 'upgrade' | 'halving' | 'hardfork' | 'conference'
export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
export type EventImportance = 'low' | 'medium' | 'high' | 'critical'

export interface CryptoEvent {
  id?: string
  title: string
  description?: string
  event_type: EventType
  event_date: string // ISO 8601 timestamp
  project_name: string
  project_symbol?: string
  project_logo_url?: string
  source_url?: string
  status: EventStatus
  importance: EventImportance
  created_at?: string
  updated_at?: string
}

// ================================================================
// MOCK DATA GENERATOR (for initial implementation)
// ================================================================
// Note: In production, this would be replaced with real API integrations
// Possible APIs: CoinGecko, CoinMarketCap, TokenUnlocks.app, Airdrops.io

/**
 * Generate mock crypto events for the next 30 days
 * This simulates data from various sources like TokenUnlocks, Airdrops.io, etc.
 */
export async function generateMockEvents(): Promise<CryptoEvent[]> {
  const now = new Date()
  const events: CryptoEvent[] = []

  // Token Unlocks
  events.push({
    title: 'SUI Token Unlock - 64M tokens',
    description: 'Major token unlock event releasing approximately 64 million SUI tokens worth ~$162M. This represents a significant portion of circulating supply.',
    event_type: 'unlock',
    event_date: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days
    project_name: 'Sui',
    project_symbol: 'SUI',
    status: 'upcoming',
    importance: 'critical',
    source_url: 'https://token.unlocks.app/sui'
  })

  events.push({
    title: 'AVAX Staking Rewards Unlock',
    description: 'Avalanche staking rewards unlock worth approximately $38.9M. Monthly scheduled unlock event.',
    event_type: 'unlock',
    event_date: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days
    project_name: 'Avalanche',
    project_symbol: 'AVAX',
    status: 'upcoming',
    importance: 'high',
    source_url: 'https://token.unlocks.app/avalanche'
  })

  events.push({
    title: 'APT Monthly Unlock',
    description: 'Aptos monthly token unlock releasing team and investor tokens. Expected unlock value: $25M.',
    event_type: 'unlock',
    event_date: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000).toISOString(), // 12 days
    project_name: 'Aptos',
    project_symbol: 'APT',
    status: 'upcoming',
    importance: 'high',
    source_url: 'https://token.unlocks.app/aptos'
  })

  // Airdrops
  events.push({
    title: 'LayerZero Airdrop Snapshot',
    description: 'Final snapshot for LayerZero (ZRO) airdrop eligibility. Users must have interacted with LayerZero protocol before this date.',
    event_type: 'airdrop',
    event_date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
    project_name: 'LayerZero',
    project_symbol: 'ZRO',
    status: 'upcoming',
    importance: 'critical',
    source_url: 'https://layerzero.network'
  })

  events.push({
    title: 'Blast Airdrop Distribution',
    description: 'Blast network token airdrop distribution to early users and liquidity providers. Claim period opens.',
    event_type: 'airdrop',
    event_date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    project_name: 'Blast',
    project_symbol: 'BLAST',
    status: 'upcoming',
    importance: 'high',
    source_url: 'https://blast.io'
  })

  // Listings
  events.push({
    title: 'WorldCoin (WLD) Binance Listing',
    description: 'WorldCoin to be listed on Binance spot trading. Expected high volume and volatility.',
    event_type: 'listing',
    event_date: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days
    project_name: 'WorldCoin',
    project_symbol: 'WLD',
    status: 'upcoming',
    importance: 'high',
    source_url: 'https://binance.com'
  })

  events.push({
    title: 'Friend.tech Token (FRIEND) CEX Listing',
    description: 'Friend.tech native token listing on major centralized exchanges including Coinbase and Kraken.',
    event_type: 'listing',
    event_date: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days
    project_name: 'Friend.tech',
    project_symbol: 'FRIEND',
    status: 'upcoming',
    importance: 'medium',
    source_url: 'https://friend.tech'
  })

  // Mainnet Launches
  events.push({
    title: 'Eclipse Mainnet Launch',
    description: 'Eclipse, the first SVM Layer 2 on Ethereum, is launching its mainnet. Major milestone for Solana VM expansion.',
    event_type: 'mainnet',
    event_date: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days
    project_name: 'Eclipse',
    project_symbol: 'ECLP',
    status: 'upcoming',
    importance: 'critical',
    source_url: 'https://eclipse.xyz'
  })

  // Network Upgrades
  events.push({
    title: 'Ethereum Dencun Upgrade',
    description: 'Major Ethereum upgrade introducing EIP-4844 (Proto-Danksharding) to reduce Layer 2 transaction costs.',
    event_type: 'upgrade',
    event_date: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days
    project_name: 'Ethereum',
    project_symbol: 'ETH',
    status: 'upcoming',
    importance: 'critical',
    source_url: 'https://ethereum.org'
  })

  events.push({
    title: 'Polygon zkEVM Upgrade v2.0',
    description: 'Polygon zkEVM network upgrade improving throughput and reducing costs by 50%.',
    event_type: 'upgrade',
    event_date: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days
    project_name: 'Polygon',
    project_symbol: 'MATIC',
    status: 'upcoming',
    importance: 'high',
    source_url: 'https://polygon.technology'
  })

  // Conferences
  events.push({
    title: 'ETHDenver 2025',
    description: 'World\'s largest Ethereum community event. Expect major announcements, launches, and networking.',
    event_type: 'conference',
    event_date: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 days
    project_name: 'Ethereum',
    project_symbol: 'ETH',
    status: 'upcoming',
    importance: 'high',
    source_url: 'https://ethdenver.com'
  })

  // Halving (for historical context)
  events.push({
    title: 'Bitcoin Halving Countdown',
    description: 'Bitcoin block reward halving event reducing miner rewards from 6.25 BTC to 3.125 BTC. Historically bullish event.',
    event_type: 'halving',
    event_date: new Date('2028-04-15T00:00:00Z').toISOString(),
    project_name: 'Bitcoin',
    project_symbol: 'BTC',
    status: 'upcoming',
    importance: 'critical',
    source_url: 'https://bitcoin.org'
  })

  return events
}

// ================================================================
// DATABASE OPERATIONS
// ================================================================

/**
 * Save event to database
 */
export async function saveEventToDatabase(event: CryptoEvent): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('events')
      .insert({
        title: event.title,
        description: event.description,
        event_type: event.event_type,
        event_date: event.event_date,
        project_name: event.project_name,
        project_symbol: event.project_symbol,
        project_logo_url: event.project_logo_url,
        source_url: event.source_url,
        status: event.status,
        importance: event.importance
      })

    if (error) {
      console.error('Error saving event to database:', error)
      captureException(error)
      throw error
    }

    console.log(`✅ Saved event: ${event.title}`)
  } catch (error) {
    console.error('Failed to save event:', error)
    captureException(error)
    throw error
  }
}

/**
 * Save multiple events to database (batch insert)
 */
export async function saveEventsToDatabase(events: CryptoEvent[]): Promise<void> {
  try {
    // First, clear existing events to avoid duplicates
    const { error: deleteError } = await supabaseAdmin
      .from('events')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (deleteError) {
      console.error('Error clearing events:', deleteError)
    }

    // Then insert new events
    const { error } = await supabaseAdmin
      .from('events')
      .insert(events.map(event => ({
        title: event.title,
        description: event.description,
        event_type: event.event_type,
        event_date: event.event_date,
        project_name: event.project_name,
        project_symbol: event.project_symbol,
        project_logo_url: event.project_logo_url,
        source_url: event.source_url,
        status: event.status,
        importance: event.importance
      })))

    if (error) {
      console.error('Error saving events to database:', error)
      captureException(error)
      throw error
    }

    console.log(`✅ Saved ${events.length} events to database`)
  } catch (error) {
    console.error('Failed to save events:', error)
    captureException(error)
    throw error
  }
}

/**
 * Get upcoming events from database
 */
export async function getUpcomingEvents(limit: number = 10): Promise<CryptoEvent[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .gte('event_date', new Date().toISOString())
      .eq('status', 'upcoming')
      .order('event_date', { ascending: true })
      .limit(limit)

    if (error) {
      console.error('Error fetching upcoming events:', error)
      captureException(error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Failed to fetch upcoming events:', error)
    captureException(error)
    throw error
  }
}

/**
 * Get events by type
 */
export async function getEventsByType(
  eventType: EventType,
  limit: number = 10
): Promise<CryptoEvent[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('event_type', eventType)
      .gte('event_date', new Date().toISOString())
      .order('event_date', { ascending: true })
      .limit(limit)

    if (error) {
      console.error(`Error fetching ${eventType} events:`, error)
      captureException(error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error(`Failed to fetch ${eventType} events:`, error)
    captureException(error)
    throw error
  }
}

/**
 * Get events by date range
 */
export async function getEventsByDateRange(
  startDate: Date,
  endDate: Date
): Promise<CryptoEvent[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .gte('event_date', startDate.toISOString())
      .lte('event_date', endDate.toISOString())
      .order('event_date', { ascending: true })

    if (error) {
      console.error('Error fetching events by date range:', error)
      captureException(error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Failed to fetch events by date range:', error)
    captureException(error)
    throw error
  }
}

/**
 * Update event status (e.g., mark as completed)
 */
export async function updateEventStatus(
  eventId: string,
  status: EventStatus
): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('events')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', eventId)

    if (error) {
      console.error('Error updating event status:', error)
      captureException(error)
      throw error
    }

    console.log(`✅ Updated event ${eventId} status to ${status}`)
  } catch (error) {
    console.error('Failed to update event status:', error)
    captureException(error)
    throw error
  }
}

// ================================================================
// FUTURE: REAL API INTEGRATIONS
// ================================================================
// TODO: Integrate with real crypto event APIs
// - TokenUnlocks.app API for token unlock schedules
// - CoinGecko API for listings and mainnet launches
// - Airdrops.io API for airdrop events
// - Defillama API for protocol upgrades
// - CoinMarketCap Calendar API
// - CryptoPanic News API for conferences
