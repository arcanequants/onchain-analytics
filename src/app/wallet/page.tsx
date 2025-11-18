import type { Metadata } from 'next'
import WalletTracker from '@/components/WalletTracker'

export const metadata: Metadata = {
  title: 'Wallet Tracker | OnChain Analytics',
  description: 'Track cryptocurrency wallet balances across Ethereum, Base, Arbitrum, Optimism, and Polygon',
}

export default function WalletPage() {
  return (
    <div className="container">
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <h1>💼 Multi-Chain Wallet Tracker</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginTop: '8px' }}>
          Track cryptocurrency balances across multiple blockchains in real-time
        </p>
      </div>

      <div style={{ display: 'grid', gap: '24px' }}>
        <WalletTracker />

        {/* Info Panel */}
        <div className="panel">
          <div className="panel-header">
            <h2>ℹ️ About Wallet Tracking</h2>
          </div>
          <div className="panel-content">
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1rem', marginBottom: '8px' }}>Supported Chains</h3>
                <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)' }}>
                  <li>⟠ Ethereum Mainnet</li>
                  <li>🔵 Base</li>
                  <li>🔷 Arbitrum One</li>
                  <li>🔴 Optimism</li>
                  <li>🟣 Polygon</li>
                </ul>
              </div>

              <div>
                <h3 style={{ fontSize: '1rem', marginBottom: '8px' }}>Tracked Assets</h3>
                <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)' }}>
                  <li>Native tokens (ETH, MATIC)</li>
                  <li>Popular ERC-20 tokens (USDC, USDT, DAI, WBTC, LINK, etc.)</li>
                  <li>Real-time USD valuations</li>
                </ul>
              </div>

              <div>
                <h3 style={{ fontSize: '1rem', marginBottom: '8px' }}>Features</h3>
                <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)' }}>
                  <li>📦 15-minute cache for faster loading</li>
                  <li>🔄 Manual refresh from blockchain</li>
                  <li>💰 Automatic USD price calculation</li>
                  <li>📊 Portfolio breakdown by chain</li>
                  <li>🎯 Multi-chain support in one view</li>
                </ul>
              </div>

              <div
                style={{
                  padding: '12px',
                  background: 'var(--accent-bg)',
                  border: '1px solid var(--accent-primary)',
                  borderRadius: '4px',
                  fontSize: '0.9rem',
                }}
              >
                <strong>💡 Tip:</strong> Use the refresh button (🔄) to get the latest balances directly from the blockchain.
                Cached data is updated every 15 minutes.
              </div>
            </div>
          </div>
        </div>

        {/* Example Wallets */}
        <div className="panel">
          <div className="panel-header">
            <h2>🔍 Example Wallets</h2>
          </div>
          <div className="panel-content">
            <p style={{ marginBottom: '12px', color: 'var(--text-secondary)' }}>
              Try tracking these well-known wallets:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div
                style={{
                  padding: '8px 12px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '4px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.9rem',
                }}
              >
                <strong>Vitalik.eth:</strong> 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
              </div>
              <div
                style={{
                  padding: '8px 12px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '4px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.9rem',
                }}
              >
                <strong>Example Wallet:</strong> 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
