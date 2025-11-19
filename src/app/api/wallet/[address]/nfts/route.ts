import { NextRequest, NextResponse } from 'next/server'
import { getWalletNFTs, validateAddress, ChainName } from '@/lib/nft'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface RouteContext {
  params: Promise<{
    address: string
  }>
}

/**
 * GET /api/wallet/[address]/nfts
 *
 * Fetch NFTs owned by a wallet across multiple chains
 *
 * Query params:
 * - chains: comma-separated list of chains (default: all)
 * - refresh: force refresh from Alchemy API (default: false, uses cached data)
 * - save: save to database (default: false)
 *
 * Examples:
 * - /api/wallet/0x123.../nfts?chains=ethereum,base
 * - /api/wallet/0x123.../nfts?refresh=true
 * - /api/wallet/0x123.../nfts?refresh=true&save=true
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { address } = await context.params
    const { searchParams } = new URL(request.url)

    // Validate address
    if (!validateAddress(address)) {
      return NextResponse.json(
        { error: 'Invalid Ethereum address' },
        { status: 400 }
      )
    }

    const normalizedAddress = address.toLowerCase()

    // Get Alchemy API key
    const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
    if (!alchemyApiKey || alchemyApiKey === 'demo') {
      return NextResponse.json(
        {
          error: 'Alchemy API key not configured',
          message: 'Please set NEXT_PUBLIC_ALCHEMY_API_KEY in environment variables',
        },
        { status: 500 }
      )
    }

    // Parse query parameters
    const chainsParam = searchParams.get('chains')
    const refresh = searchParams.get('refresh') === 'true'
    const save = searchParams.get('save') === 'true'

    const validChains: ChainName[] = ['ethereum', 'base', 'arbitrum', 'optimism', 'polygon']
    const chains: ChainName[] = chainsParam
      ? (chainsParam.split(',').filter(c => validChains.includes(c as ChainName)) as ChainName[])
      : validChains

    // If not forcing refresh, try to get cached data from database
    if (!refresh) {
      const { data: cachedNFTs } = await supabase
        .from('wallet_nfts')
        .select('*')
        .eq('wallet_address', normalizedAddress)
        .in('chain', chains)
        .gte('last_updated', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // 1 hour cache

      if (cachedNFTs && cachedNFTs.length > 0) {
        return NextResponse.json({
          walletAddress: normalizedAddress,
          chains,
          nfts: cachedNFTs.map(nft => ({
            chain: nft.chain,
            contractAddress: nft.contract_address,
            tokenId: nft.token_id,
            tokenType: nft.token_type,
            title: nft.title,
            description: nft.description,
            tokenUri: nft.token_uri,
            media: nft.image_url ? [{
              gateway: nft.image_url,
              thumbnail: nft.thumbnail_url,
              raw: nft.image_url,
            }] : undefined,
            rawMetadata: nft.raw_metadata,
            collectionName: nft.collection_name,
            collectionSlug: nft.collection_slug,
            balance: nft.balance,
            isSpam: nft.is_spam,
            spamClassification: nft.spam_classification,
            floorPriceEth: nft.floor_price_eth ? parseFloat(nft.floor_price_eth) : undefined,
            floorPriceUsd: nft.floor_price_usd ? parseFloat(nft.floor_price_usd) : undefined,
          })),
          totalCount: cachedNFTs.length,
          lastUpdated: cachedNFTs[0]?.last_updated || new Date().toISOString(),
          cached: true,
        })
      }
    }

    // Fetch fresh data from Alchemy API
    const walletNFTs = await getWalletNFTs(normalizedAddress, chains, alchemyApiKey)

    // Save to database if requested
    if (save) {
      const nftRecords = walletNFTs.nfts.map(nft => ({
        wallet_address: normalizedAddress,
        chain: nft.chain,
        contract_address: nft.contractAddress,
        token_id: nft.tokenId,
        token_type: nft.tokenType,
        title: nft.title,
        description: nft.description,
        token_uri: nft.tokenUri,
        image_url: nft.media?.[0]?.gateway,
        thumbnail_url: nft.media?.[0]?.thumbnail,
        media_type: nft.media?.[0]?.format,
        raw_metadata: nft.rawMetadata,
        collection_name: nft.collectionName,
        collection_slug: nft.collectionSlug,
        balance: nft.balance,
        is_spam: nft.isSpam,
        spam_classification: nft.spamClassification,
        floor_price_eth: nft.floorPriceEth,
        floor_price_usd: nft.floorPriceUsd,
        floor_price_updated_at: nft.floorPriceEth ? new Date().toISOString() : null,
        last_updated: new Date().toISOString(),
      }))

      if (nftRecords.length > 0) {
        await supabase
          .from('wallet_nfts')
          .upsert(nftRecords, {
            onConflict: 'wallet_address,chain,contract_address,token_id',
          })
      }
    }

    return NextResponse.json({
      walletAddress: normalizedAddress,
      chains,
      nfts: walletNFTs.nfts,
      totalCount: walletNFTs.totalCount,
      lastUpdated: walletNFTs.lastUpdated.toISOString(),
      cached: false,
    })
  } catch (error: any) {
    console.error('[API] /api/wallet/[address]/nfts error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch wallet NFTs',
        message: error.message
      },
      { status: 500 }
    )
  }
}
