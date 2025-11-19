import { ChainName as RpcChainName } from './rpc'

// Re-export ChainName for use in API routes
export type ChainName = RpcChainName

// Alchemy NFT API base URLs for each chain
const ALCHEMY_NFT_URLS: Record<ChainName, string> = {
  ethereum: 'https://eth-mainnet.g.alchemy.com/nft/v3',
  base: 'https://base-mainnet.g.alchemy.com/nft/v3',
  arbitrum: 'https://arb-mainnet.g.alchemy.com/nft/v3',
  optimism: 'https://opt-mainnet.g.alchemy.com/nft/v3',
  polygon: 'https://polygon-mainnet.g.alchemy.com/nft/v3',
}

export interface NFTMedia {
  gateway: string // Public gateway URL
  thumbnail?: string // Alchemy thumbnail (256x256)
  raw: string // Original IPFS/HTTP URL
  format?: string // Format (png, jpg, gif, mp4, etc.)
}

export interface NFTMetadata {
  name?: string
  description?: string
  image?: string
  external_url?: string
  attributes?: Array<{
    trait_type: string
    value: string | number
  }>
  [key: string]: any // Allow additional metadata fields
}

export interface NFT {
  chain: ChainName
  contractAddress: string
  tokenId: string
  tokenType: 'ERC721' | 'ERC1155' | 'UNKNOWN'

  // Basic info
  title: string
  description?: string
  tokenUri?: string

  // Media
  media?: NFTMedia[]

  // Metadata
  rawMetadata?: NFTMetadata

  // Collection info
  collectionName?: string
  collectionSlug?: string

  // Balance (for ERC1155)
  balance: string

  // Spam detection
  isSpam: boolean
  spamClassification?: string

  // Floor price (only for Ethereum)
  floorPriceEth?: number
  floorPriceUsd?: number

  // Timestamps
  timeLastUpdated?: string
}

export interface WalletNFTs {
  walletAddress: string
  chains: ChainName[]
  nfts: NFT[]
  totalCount: number
  lastUpdated: Date
}

/**
 * Fetch NFTs for a wallet on a specific chain using Alchemy API
 */
export async function getNFTsForChain(
  chain: ChainName,
  address: string,
  apiKey: string
): Promise<NFT[]> {
  const nfts: NFT[] = []

  try {
    const baseUrl = ALCHEMY_NFT_URLS[chain]
    let pageKey: string | undefined = undefined
    let hasMore = true

    // Fetch all pages (max 5 pages to avoid timeout)
    let pageCount = 0
    const maxPages = 5

    while (hasMore && pageCount < maxPages) {
      const url = new URL(`${baseUrl}/${apiKey}/getNFTsForOwner`)
      url.searchParams.set('owner', address)
      url.searchParams.set('pageSize', '100')
      url.searchParams.set('withMetadata', 'true')
      // Note: excludeFilters[] 'SPAM' requires Growth plan or higher
      // We'll filter spam client-side using the isSpam field

      if (pageKey) {
        url.searchParams.set('pageKey', pageKey)
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        console.error(`[NFT] Failed to fetch NFTs for ${chain}:`, response.statusText)
        break
      }

      const data = await response.json()

      // Process NFTs from this page
      if (data.ownedNfts && Array.isArray(data.ownedNfts)) {
        for (const nft of data.ownedNfts) {
          nfts.push({
            chain,
            contractAddress: nft.contract?.address?.toLowerCase() || '',
            tokenId: nft.tokenId || '',
            tokenType: nft.tokenType || 'UNKNOWN',
            title: nft.name || nft.title || `${nft.contract?.name || 'Unknown'} #${nft.tokenId}`,
            description: nft.description || nft.rawMetadata?.description,
            tokenUri: nft.tokenUri,
            media: nft.media?.map((m: any) => ({
              gateway: m.gateway || m.raw,
              thumbnail: m.thumbnail,
              raw: m.raw,
              format: m.format,
            })),
            rawMetadata: nft.rawMetadata,
            collectionName: nft.contract?.name,
            collectionSlug: nft.contract?.openSeaMetadata?.collectionSlug,
            balance: nft.balance || '1',
            isSpam: nft.spamInfo?.isSpam || false,
            spamClassification: nft.spamInfo?.classification,
            timeLastUpdated: nft.timeLastUpdated,
          })
        }
      }

      // Check if there are more pages
      pageKey = data.pageKey
      hasMore = !!pageKey
      pageCount++
    }

    console.log(`[NFT] Fetched ${nfts.length} NFTs for ${address} on ${chain}`)
  } catch (error) {
    console.error(`[NFT] Error fetching NFTs for ${chain}:`, error)
  }

  return nfts
}

/**
 * Fetch floor price for an NFT collection (Ethereum only)
 */
export async function getFloorPrice(
  contractAddress: string,
  apiKey: string
): Promise<{ eth: number; usd: number } | null> {
  try {
    const url = `${ALCHEMY_NFT_URLS.ethereum}/${apiKey}/getFloorPrice?contractAddress=${contractAddress}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()

    // Alchemy returns floor prices from different marketplaces
    // We'll use OpenSea if available, otherwise the first available
    const openSeaFloor = data.openSea?.floorPrice
    const looksRareFloor = data.looksRare?.floorPrice

    const floorPriceEth = openSeaFloor || looksRareFloor || 0

    if (floorPriceEth === 0) {
      return null
    }

    // Get ETH price to convert to USD
    // We'll fetch this from our existing prices API
    const ethPriceResponse = await fetch('/api/prices?symbols=ETH', {
      cache: 'no-store',
    })

    let ethPriceUsd = 0
    if (ethPriceResponse.ok) {
      const pricesData = await ethPriceResponse.json()
      const ethPrice = pricesData.prices?.find((p: any) => p.symbol === 'ETH')
      ethPriceUsd = ethPrice?.current_price || 0
    }

    return {
      eth: floorPriceEth,
      usd: floorPriceEth * ethPriceUsd,
    }
  } catch (error) {
    console.error('[NFT] Error fetching floor price:', error)
    return null
  }
}

/**
 * Get all NFTs for a wallet across multiple chains
 */
export async function getWalletNFTs(
  address: string,
  chains: ChainName[] = ['ethereum', 'base', 'arbitrum', 'optimism', 'polygon'],
  apiKey: string
): Promise<WalletNFTs> {
  const normalizedAddress = address.toLowerCase()

  // Fetch NFTs from all chains in parallel
  const chainNFTPromises = chains.map(chain =>
    getNFTsForChain(chain, normalizedAddress, apiKey)
  )

  const chainNFTs = await Promise.all(chainNFTPromises)
  const allNFTs = chainNFTs.flat()

  // For Ethereum NFTs, fetch floor prices for unique collections
  // (We'll do this in batches to avoid rate limits)
  if (chains.includes('ethereum')) {
    const ethereumNFTs = allNFTs.filter(nft => nft.chain === 'ethereum')
    const uniqueContracts = [...new Set(ethereumNFTs.map(nft => nft.contractAddress))]

    // Fetch floor prices for up to 10 collections to avoid timeout
    const contractsToCheck = uniqueContracts.slice(0, 10)

    const floorPricePromises = contractsToCheck.map(async (contractAddress) => {
      const floorPrice = await getFloorPrice(contractAddress, apiKey)
      return { contractAddress, floorPrice }
    })

    const floorPrices = await Promise.all(floorPricePromises)

    // Update NFTs with floor prices
    for (const { contractAddress, floorPrice } of floorPrices) {
      if (floorPrice) {
        allNFTs.forEach(nft => {
          if (nft.contractAddress === contractAddress && nft.chain === 'ethereum') {
            nft.floorPriceEth = floorPrice.eth
            nft.floorPriceUsd = floorPrice.usd
          }
        })
      }
    }
  }

  return {
    walletAddress: normalizedAddress,
    chains,
    nfts: allNFTs,
    totalCount: allNFTs.length,
    lastUpdated: new Date(),
  }
}

/**
 * Validate Ethereum address
 */
export function validateAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}
