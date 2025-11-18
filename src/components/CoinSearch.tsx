'use client'

import { useState, useEffect, useRef } from 'react'

interface SearchResult {
  coingecko_id: string
  symbol: string
  name: string
  current_price: number
  market_cap_rank: number
  image: string
  price_change_percentage_24h: number
}

export default function CoinSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [allCoins, setAllCoins] = useState<SearchResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchAllCoins()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchAllCoins = async () => {
    try {
      const response = await fetch('/api/prices?limit=100')
      const data = await response.json()
      setAllCoins(data.prices || [])
    } catch (error) {
      console.error('[CoinSearch] Error fetching coins:', error)
    }
  }

  const handleSearch = (value: string) => {
    setQuery(value)
    
    if (value.trim().length < 2) {
      setResults([])
      setShowResults(false)
      return
    }

    const searchTerm = value.toLowerCase()
    const filtered = allCoins.filter(coin => 
      coin.name.toLowerCase().includes(searchTerm) ||
      coin.symbol.toLowerCase().includes(searchTerm) ||
      coin.coingecko_id.toLowerCase().includes(searchTerm)
    ).slice(0, 10)

    setResults(filtered)
    setShowResults(true)
  }

  const formatPrice = (price: number) => {
    if (price >= 1) return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    return `$${price.toFixed(6)}`
  }

  return (
    <div ref={searchRef} style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          placeholder="Search coins... (BTC, ETH, SOL)"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => query.length >= 2 && setShowResults(true)}
          style={{
            width: '100%',
            padding: '8px 12px',
            background: 'rgba(0, 240, 255, 0.05)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            color: 'var(--text-primary)',
            fontSize: '12px',
            outline: 'none'
          }}
          className="search-input"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setResults([])
              setShowResults(false)
            }}
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            ×
          </button>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '4px',
          background: 'rgba(10, 10, 15, 0.98)',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          maxHeight: '400px',
          overflowY: 'auto',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0, 240, 255, 0.15)'
        }}>
          {results.map((coin) => (
            <div
              key={coin.coingecko_id}
              style={{
                padding: '10px 12px',
                borderBottom: '1px solid var(--border)',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              className="search-result-item"
              onClick={() => {
                window.open(`https://www.coingecko.com/en/coins/${coin.coingecko_id}`, '_blank')
                setShowResults(false)
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img
                    src={coin.image}
                    alt={coin.name}
                    style={{ width: '24px', height: '24px', borderRadius: '50%' }}
                    onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                  />
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {coin.symbol.toUpperCase()}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                      {coin.name}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary)' }}>
                    {formatPrice(coin.current_price)}
                  </div>
                  <div style={{
                    fontSize: '10px',
                    color: coin.price_change_percentage_24h >= 0 ? 'var(--success)' : 'var(--danger)'
                  }}>
                    {coin.price_change_percentage_24h >= 0 ? '+' : ''}
                    {coin.price_change_percentage_24h?.toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showResults && query.length >= 2 && results.length === 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '4px',
          padding: '20px',
          background: 'rgba(10, 10, 15, 0.98)',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          textAlign: 'center',
          color: 'var(--text-tertiary)',
          fontSize: '12px',
          zIndex: 1000
        }}>
          No coins found for "{query}"
        </div>
      )}

      <style jsx>{`
        .search-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 8px rgba(0, 240, 255, 0.2);
        }
        .search-result-item:hover {
          background: rgba(0, 240, 255, 0.05);
        }
      `}</style>
    </div>
  )
}
