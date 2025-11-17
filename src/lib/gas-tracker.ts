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

    // Fetch latest block first to get baseFee
    const block = await client.getBlock({ blockTag: 'latest' })

    // Get base fee from block (EIP-1559)
    const baseFeeWei = block.baseFeePerGas || 0n
    const baseFeeGwei = Number(baseFeeWei) / 1e9

    // Get max priority fee per gas (EIP-1559)
    let priorityFeeGwei = 0
    try {
      const maxPriorityFeePerGas = await client.estimateMaxPriorityFeePerGas()
      priorityFeeGwei = Number(maxPriorityFeePerGas) / 1e9
    } catch (error) {
      // For chains without EIP-1559 or if the call fails, use legacy gas price
      console.log(`No EIP-1559 support for ${chainName}, using legacy gas price`)
    }

    // Total gas price = baseFee + priorityFee (for EIP-1559 chains)
    // For legacy chains, use getGasPrice()
    let gasPriceGwei: number
    if (baseFeeGwei > 0 && priorityFeeGwei > 0) {
      // EIP-1559 chain
      gasPriceGwei = baseFeeGwei + priorityFeeGwei
    } else {
      // Legacy chain or fallback
      const gasPrice = await client.getGasPrice()
      gasPriceGwei = Number(gasPrice) / 1e9
    }

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
      status,
      baseFee: baseFeeGwei > 0 ? baseFeeGwei : undefined,
      priorityFee: priorityFeeGwei > 0 ? priorityFeeGwei : undefined
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
