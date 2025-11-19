'use client'

import { useState } from 'react'
import Image from 'next/image'

interface NFTMedia {
  gateway: string
  thumbnail?: string
  raw: string
  format?: string
}

interface NFT {
  chain: string
  contractAddress: string
  tokenId: string
  tokenType: string
  title: string
  description?: string
  media?: NFTMedia[]
  collectionName?: string
  balance: string
  isSpam: boolean
  floorPriceEth?: number
  floorPriceUsd?: number
}

interface NFTGalleryProps {
  nfts: NFT[]
  loading?: boolean
}

export default function NFTGallery({ nfts, loading = false }: NFTGalleryProps) {
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null)
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())

  const handleImageError = (nftId: string) => {
    setImageErrors(prev => new Set(prev).add(nftId))
  }

  const getImageUrl = (nft: NFT): string | null => {
    if (!nft.media || nft.media.length === 0) return null

    // Prefer thumbnail, fallback to gateway, then raw
    return nft.media[0].thumbnail || nft.media[0].gateway || nft.media[0].raw
  }

  const getNFTId = (nft: NFT) => `${nft.contractAddress}-${nft.tokenId}`

  const formatFloorPrice = (priceEth?: number, priceUsd?: number) => {
    if (!priceEth) return null

    return (
      <div className="nft-floor-price">
        <span className="nft-floor-price-eth">Ξ {priceEth.toFixed(3)}</span>
        {priceUsd && (
          <span className="nft-floor-price-usd">
            ${priceUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </span>
        )}
      </div>
    )
  }

  const getChainIcon = (chain: string) => {
    const icons: Record<string, string> = {
      ethereum: '⟠',
      base: '🔵',
      arbitrum: '🔷',
      optimism: '🔴',
      polygon: '🟣',
    }
    return icons[chain] || '⚪'
  }

  if (loading) {
    return (
      <div className="nft-gallery-loading">
        <div style={{ fontSize: '2rem', marginBottom: '16px' }}>🖼️</div>
        <div>Loading NFTs...</div>
      </div>
    )
  }

  if (nfts.length === 0) {
    return (
      <div className="nft-gallery-empty">
        <div className="nft-gallery-empty-icon">🖼️</div>
        <div className="nft-gallery-empty-text">No NFTs found</div>
        <div className="nft-gallery-empty-subtext">
          This wallet doesn't own any NFTs on the selected chains
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="nft-gallery">
        <div className="nft-gallery-header">
          <h3 className="nft-gallery-title">NFT Collection ({nfts.length})</h3>
          <div className="nft-gallery-stats">
            {nfts.filter(n => n.tokenType === 'ERC721').length > 0 && (
              <span className="nft-stat-badge">
                {nfts.filter(n => n.tokenType === 'ERC721').length} ERC-721
              </span>
            )}
            {nfts.filter(n => n.tokenType === 'ERC1155').length > 0 && (
              <span className="nft-stat-badge">
                {nfts.filter(n => n.tokenType === 'ERC1155').length} ERC-1155
              </span>
            )}
          </div>
        </div>

        <div className="nft-grid">
          {nfts.map((nft) => {
            const nftId = getNFTId(nft)
            const imageUrl = getImageUrl(nft)
            const hasImageError = imageErrors.has(nftId)

            return (
              <div
                key={nftId}
                className="nft-card"
                onClick={() => setSelectedNFT(nft)}
              >
                <div className="nft-card-image-container">
                  {imageUrl && !hasImageError ? (
                    <img
                      src={imageUrl}
                      alt={nft.title}
                      className="nft-card-image"
                      onError={() => handleImageError(nftId)}
                      loading="lazy"
                    />
                  ) : (
                    <div className="nft-card-placeholder">
                      <span className="nft-card-placeholder-icon">🖼️</span>
                    </div>
                  )}

                  <div className="nft-card-chain-badge">
                    {getChainIcon(nft.chain)}
                  </div>

                  {nft.tokenType === 'ERC1155' && parseInt(nft.balance) > 1 && (
                    <div className="nft-card-balance-badge">
                      ×{nft.balance}
                    </div>
                  )}
                </div>

                <div className="nft-card-info">
                  <div className="nft-card-title">{nft.title}</div>
                  {nft.collectionName && (
                    <div className="nft-card-collection">{nft.collectionName}</div>
                  )}
                  {formatFloorPrice(nft.floorPriceEth, nft.floorPriceUsd)}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* NFT Detail Modal */}
      {selectedNFT && (
        <div className="nft-modal-overlay" onClick={() => setSelectedNFT(null)}>
          <div className="nft-modal" onClick={(e) => e.stopPropagation()}>
            <button className="nft-modal-close" onClick={() => setSelectedNFT(null)}>
              ✕
            </button>

            <div className="nft-modal-content">
              <div className="nft-modal-image-container">
                {getImageUrl(selectedNFT) ? (
                  <img
                    src={getImageUrl(selectedNFT)!}
                    alt={selectedNFT.title}
                    className="nft-modal-image"
                  />
                ) : (
                  <div className="nft-modal-placeholder">
                    <span>🖼️</span>
                  </div>
                )}
              </div>

              <div className="nft-modal-details">
                <h2 className="nft-modal-title">{selectedNFT.title}</h2>

                {selectedNFT.collectionName && (
                  <div className="nft-modal-collection">
                    {selectedNFT.collectionName}
                  </div>
                )}

                {selectedNFT.description && (
                  <p className="nft-modal-description">{selectedNFT.description}</p>
                )}

                <div className="nft-modal-metadata">
                  <div className="nft-modal-metadata-item">
                    <span className="nft-modal-metadata-label">Chain</span>
                    <span className="nft-modal-metadata-value">
                      {getChainIcon(selectedNFT.chain)} {selectedNFT.chain}
                    </span>
                  </div>

                  <div className="nft-modal-metadata-item">
                    <span className="nft-modal-metadata-label">Token ID</span>
                    <span className="nft-modal-metadata-value">#{selectedNFT.tokenId}</span>
                  </div>

                  <div className="nft-modal-metadata-item">
                    <span className="nft-modal-metadata-label">Standard</span>
                    <span className="nft-modal-metadata-value">{selectedNFT.tokenType}</span>
                  </div>

                  {selectedNFT.tokenType === 'ERC1155' && parseInt(selectedNFT.balance) > 1 && (
                    <div className="nft-modal-metadata-item">
                      <span className="nft-modal-metadata-label">Balance</span>
                      <span className="nft-modal-metadata-value">×{selectedNFT.balance}</span>
                    </div>
                  )}

                  {selectedNFT.floorPriceEth && (
                    <div className="nft-modal-metadata-item">
                      <span className="nft-modal-metadata-label">Floor Price</span>
                      {formatFloorPrice(selectedNFT.floorPriceEth, selectedNFT.floorPriceUsd)}
                    </div>
                  )}
                </div>

                <div className="nft-modal-contract">
                  <span className="nft-modal-contract-label">Contract</span>
                  <code className="nft-modal-contract-address">
                    {selectedNFT.contractAddress}
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
