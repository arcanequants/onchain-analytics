import { createPublicClient, http } from 'viem'
import { mainnet, base, arbitrum, optimism, polygon } from 'viem/chains'

// RPC Clients for each supported chain
export const clients = {
  ethereum: createPublicClient({
    chain: mainnet,
    transport: http(process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com', {
      timeout: 10_000,
      retryCount: 2
    })
  }),
  base: createPublicClient({
    chain: base,
    transport: http(process.env.BASE_RPC_URL || 'https://mainnet.base.org', {
      timeout: 10_000,
      retryCount: 2
    })
  }),
  arbitrum: createPublicClient({
    chain: arbitrum,
    transport: http(process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc', {
      timeout: 10_000,
      retryCount: 2
    })
  }),
  optimism: createPublicClient({
    chain: optimism,
    transport: http(process.env.OPTIMISM_RPC_URL || 'https://mainnet.optimism.io', {
      timeout: 10_000,
      retryCount: 2
    })
  }),
  polygon: createPublicClient({
    chain: polygon,
    transport: http(process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com', {
      timeout: 10_000,
      retryCount: 2
    })
  })
}

export type ChainName = keyof typeof clients
