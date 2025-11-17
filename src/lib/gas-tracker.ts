import { clients, ChainName } from './rpc'

export interface GasData {
  chain: string
  gasPrice: number // in Gwei
  blockNumber: number
  timestamp: string
  status: 'low' | 'medium' | 'high'
  baseFee?: number // EIP-1559 base fee in Gwei
  priorityFee?: number // EIP-1559 priority fee in Gwei
}

/**
 * Get current gas price for a specific chain
 */
export async function getGasPrice(chainName: ChainName): Promise<GasData> {
  try {
    const client = clients[chainName]

    // Fetch gas price and latest block in parallel
    const [gasPrice, block] = await Promise.all([
      client.getGasPrice(),
      client.getBlock({ blockTag: 'latest' })
    ])

    // Convert from wei to Gwei (1 Gwei = 1e9 wei)
    const gasPriceGwei = Number(gasPrice) / 1e9

    // Determine status based on gas price
    let status: 'low' | 'medium' | 'high'
    if (gasPriceGwei < 10) {
      status = 'low'
    } else if (gasPriceGwei < 50) {
      status = 'medium'
    } else {
      status = 'high'
    }

    return {
      chain: chainName,
      gasPrice: gasPriceGwei,
      blockNumber: Number(block.number),
      timestamp: new Date().toISOString(),
      status
    }
  } catch (error) {
    console.error(`Error fetching gas price for ${chainName}:`, error)
    throw new Error(`Failed to fetch gas price for ${chainName}`)
  }
}

/**
 * Get gas prices for all supported chains
 * Returns only successful results, skips chains that fail
 */
export async function getAllGasPrices(): Promise<GasData[]> {
  const chains: ChainName[] = ['ethereum', 'base', 'arbitrum', 'optimism', 'polygon']

  const results = await Promise.allSettled(
    chains.map(chain => getGasPrice(chain))
  )

  // Filter only successful results
  const gasData = results
    .filter((result): result is PromiseFulfilledResult<GasData> => result.status === 'fulfilled')
    .map(result => result.value)

  // Log any failures
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(`Failed to fetch gas for ${chains[index]}:`, result.reason)
    }
  })

  return gasData
}
