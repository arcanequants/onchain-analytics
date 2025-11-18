import { formatUnits, isAddress } from 'viem'
import { clients, ChainName as RpcChainName } from './rpc'

// Re-export ChainName for use in API routes
export type ChainName = RpcChainName

// ERC-20 ABI (balanceOf function)
const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
] as const

// Popular ERC-20 tokens on each chain
export const COMMON_TOKENS: Record<RpcChainName, Array<{
  address: `0x${string}`,
  symbol: string,
  name: string,
  decimals: number
}>> = {
  ethereum: [
    { address: '0xdac17f958d2ee523a2206206994597c13d831ec7', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
    { address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    { address: '0x6b175474e89094c44da98b954eedeac495271d0f', symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18 },
    { address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8 },
    { address: '0x514910771af9ca656af840dff83e8264ecf986ca', symbol: 'LINK', name: 'Chainlink', decimals: 18 },
    { address: '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0', symbol: 'MATIC', name: 'Polygon', decimals: 18 },
  ],
  base: [
    { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    { address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18 },
    { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
  ],
  arbitrum: [
    { address: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
    { address: '0xaf88d065e77c8cc2239327c5edb3a432268e5831', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    { address: '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1', symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18 },
    { address: '0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f', symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8 },
    { address: '0xf97f4df75117a78c1a5a0dbb814af92458539fb4', symbol: 'LINK', name: 'Chainlink', decimals: 18 },
  ],
  optimism: [
    { address: '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
    { address: '0x0b2c639c533813f4aa9d7837caf62653d097ff85', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    { address: '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1', symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18 },
    { address: '0x68f180fcce6836688e9084f035309e29bf0a2095', symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8 },
    { address: '0x350a791bfc2c21f9ed5d10980dad2e2638ffa7f6', symbol: 'LINK', name: 'Chainlink', decimals: 18 },
  ],
  polygon: [
    { address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
    { address: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    { address: '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063', symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18 },
    { address: '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6', symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8 },
    { address: '0x53e0bca35ec356bd5dddfebbd1fc0fd03fabad39', symbol: 'LINK', name: 'Chainlink', decimals: 18 },
  ],
}

// Native token symbols for each chain
const NATIVE_SYMBOLS: Record<RpcChainName, string> = {
  ethereum: 'ETH',
  base: 'ETH',
  arbitrum: 'ETH',
  optimism: 'ETH',
  polygon: 'MATIC',
}

export interface TokenBalance {
  chain: RpcChainName
  tokenAddress: string | null // null for native token
  tokenSymbol: string
  tokenName: string
  tokenDecimals: number
  balance: string // Raw balance
  balanceFormatted: string // Human-readable
  balanceUsd?: number
}

export interface WalletBalances {
  walletAddress: string
  chains: RpcChainName[]
  balances: TokenBalance[]
  totalValueUsd: number
  lastUpdated: Date
}

/**
 * Get native token balance (ETH, MATIC, etc.)
 */
export async function getNativeBalance(
  chain: RpcChainName,
  address: `0x${string}`
): Promise<TokenBalance> {
  const client = clients[chain]
  const balance = await client.getBalance({ address })

  return {
    chain,
    tokenAddress: null,
    tokenSymbol: NATIVE_SYMBOLS[chain],
    tokenName: NATIVE_SYMBOLS[chain],
    tokenDecimals: 18,
    balance: balance.toString(),
    balanceFormatted: formatUnits(balance, 18),
  }
}

/**
 * Get ERC-20 token balance
 */
export async function getTokenBalance(
  chain: RpcChainName,
  walletAddress: `0x${string}`,
  tokenAddress: `0x${string}`,
  tokenSymbol?: string,
  tokenName?: string,
  tokenDecimals?: number
): Promise<TokenBalance | null> {
  try {
    const client = clients[chain]

    // Get balance
    const balance = await client.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [walletAddress],
    }) as bigint

    // If balance is 0, skip
    if (balance === 0n) {
      return null
    }

    // Get token metadata if not provided
    let symbol = tokenSymbol
    let name = tokenName
    let decimals = tokenDecimals

    if (!symbol || !decimals) {
      try {
        const [fetchedSymbol, fetchedDecimals, fetchedName] = await Promise.all([
          client.readContract({
            address: tokenAddress,
            abi: ERC20_ABI,
            functionName: 'symbol',
          }) as Promise<string>,
          client.readContract({
            address: tokenAddress,
            abi: ERC20_ABI,
            functionName: 'decimals',
          }) as Promise<number>,
          client.readContract({
            address: tokenAddress,
            abi: ERC20_ABI,
            functionName: 'name',
          }) as Promise<string>,
        ])

        symbol = fetchedSymbol
        decimals = fetchedDecimals
        name = fetchedName
      } catch (error) {
        console.error(`Failed to get token metadata for ${tokenAddress}:`, error)
        return null
      }
    }

    return {
      chain,
      tokenAddress: tokenAddress.toLowerCase(),
      tokenSymbol: symbol || 'UNKNOWN',
      tokenName: name || 'Unknown Token',
      tokenDecimals: decimals || 18,
      balance: balance.toString(),
      balanceFormatted: formatUnits(balance, decimals || 18),
    }
  } catch (error) {
    console.error(`Failed to get token balance for ${tokenAddress} on ${chain}:`, error)
    return null
  }
}

/**
 * Get all balances for a wallet on a specific chain
 */
export async function getChainBalances(
  chain: RpcChainName,
  address: `0x${string}`
): Promise<TokenBalance[]> {
  const balances: TokenBalance[] = []

  try {
    // Get native token balance
    const nativeBalance = await getNativeBalance(chain, address)
    if (parseFloat(nativeBalance.balanceFormatted) > 0) {
      balances.push(nativeBalance)
    }

    // Get common ERC-20 token balances
    const tokens = COMMON_TOKENS[chain]
    const tokenBalancePromises = tokens.map(token =>
      getTokenBalance(
        chain,
        address,
        token.address,
        token.symbol,
        token.name,
        token.decimals
      )
    )

    const tokenBalances = await Promise.all(tokenBalancePromises)
    tokenBalances.forEach(balance => {
      if (balance) {
        balances.push(balance)
      }
    })
  } catch (error) {
    console.error(`Failed to get balances for ${address} on ${chain}:`, error)
  }

  return balances
}

/**
 * Get all balances for a wallet across multiple chains
 */
export async function getWalletBalances(
  address: string,
  chains: RpcChainName[] = ['ethereum', 'base', 'arbitrum', 'optimism', 'polygon']
): Promise<WalletBalances> {
  // Validate address
  if (!isAddress(address)) {
    throw new Error('Invalid Ethereum address')
  }

  const checksummedAddress = address.toLowerCase() as `0x${string}`

  // Fetch balances from all chains in parallel
  const chainBalancePromises = chains.map(chain =>
    getChainBalances(chain, checksummedAddress)
  )

  const chainBalances = await Promise.all(chainBalancePromises)
  const allBalances = chainBalances.flat()

  return {
    walletAddress: checksummedAddress,
    chains,
    balances: allBalances,
    totalValueUsd: 0, // Will be calculated by API after fetching prices
    lastUpdated: new Date(),
  }
}

/**
 * Validate Ethereum address
 */
export function validateAddress(address: string): boolean {
  return isAddress(address)
}
