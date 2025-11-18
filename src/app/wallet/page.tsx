import type { Metadata } from 'next'
import dynamic from 'next/dynamic'

// Lazy load WalletTrackerMinimal for better performance
// This splits the component into a separate bundle chunk
const WalletTrackerMinimal = dynamic(
  () => import('@/components/WalletTrackerMinimal'),
  {
    loading: () => (
      <div className="wallet-container">
        <div className="wallet-minimal-header">
          <div className="wallet-header-title">Wallet Portfolio</div>
          <div className="wallet-header-subtitle">Loading...</div>
        </div>
      </div>
    ),
  }
)

export const metadata: Metadata = {
  title: 'Wallet Portfolio | OnChain Analytics',
  description: 'Track cryptocurrency wallet balances across Ethereum, Base, Arbitrum, Optimism, and Polygon',
}

export default function WalletPage() {
  return <WalletTrackerMinimal />
}
