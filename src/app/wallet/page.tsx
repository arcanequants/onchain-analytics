import type { Metadata } from 'next'
import WalletTrackerMinimal from '@/components/WalletTrackerMinimal'

export const metadata: Metadata = {
  title: 'Wallet Portfolio | OnChain Analytics',
  description: 'Track cryptocurrency wallet balances across Ethereum, Base, Arbitrum, Optimism, and Polygon',
}

export default function WalletPage() {
  return <WalletTrackerMinimal />
}
