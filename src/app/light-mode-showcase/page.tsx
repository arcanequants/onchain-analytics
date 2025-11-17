'use client'

import { useState } from 'react'

export default function LightModeShowcase() {
  const [selectedTheme, setSelectedTheme] = useState<'pearl' | 'arctic' | 'mint' | 'sunset'>('pearl')

  // Sample data for visualization
  const gasData = [
    { chain: 'ETHEREUM', price: '28.5', status: 'MEDIUM', change: '+5.2%' },
    { chain: 'BASE', price: '0.12', status: 'LOW', change: '-2.1%' },
    { chain: 'ARBITRUM', price: '0.08', status: 'LOW', change: '+1.5%' },
    { chain: 'OPTIMISM', price: '0.15', status: 'LOW', change: '+3.2%' },
    { chain: 'POLYGON', price: '35.2', status: 'MEDIUM', change: '-4.8%' },
  ]

  const fearGreedValue = 42
  const fearGreedLabel = 'FEAR'

  // Theme definitions
  const themes = {
    pearl: {
      name: '💎 Pearl Elegance',
      description: 'Sophistication meets clarity. Inspired by luxury financial terminals.',
      bg: '#F8F7F4',           // Warm pearl white
      cardBg: '#FFFFFF',       // Pure white cards
      text: '#1A1A1A',         // Almost black
      textSecondary: '#666666', // Medium gray
      textTertiary: '#999999',  // Light gray
      border: '#E8E6E1',       // Subtle pearl border
      accent: '#D4AF37',       // Gold accent
      accentLight: '#F4E4BC',  // Light gold
      success: '#047857',      // Forest green
      danger: '#DC2626',       // Deep red
      neutral: '#6B7280',      // Neutral gray
      shadow: 'rgba(0, 0, 0, 0.08)',
      glowSuccess: 'rgba(4, 120, 87, 0.15)',
      glowDanger: 'rgba(220, 38, 38, 0.15)',
    },
    arctic: {
      name: '❄️ Arctic Clarity',
      description: 'Clean, clinical precision. Bloomberg Terminal meets Scandinavian design.',
      bg: '#F7F9FC',           // Ice blue background
      cardBg: '#FFFFFF',       // Pure white
      text: '#0F172A',         // Slate black
      textSecondary: '#475569', // Slate gray
      textTertiary: '#94A3B8',  // Light slate
      border: '#E2E8F0',       // Slate border
      accent: '#0EA5E9',       // Sky blue
      accentLight: '#BAE6FD',  // Light sky
      success: '#10B981',      // Emerald
      danger: '#EF4444',       // Red
      neutral: '#64748B',      // Slate
      shadow: 'rgba(15, 23, 42, 0.08)',
      glowSuccess: 'rgba(16, 185, 129, 0.15)',
      glowDanger: 'rgba(239, 68, 68, 0.15)',
    },
    mint: {
      name: '🌿 Mint Fresh',
      description: 'Modern fintech meets nature. Calm, trustworthy, energizing.',
      bg: '#F0FDF4',           // Mint background
      cardBg: '#FFFFFF',       // White cards
      text: '#052E16',         // Forest black
      textSecondary: '#166534', // Forest green
      textTertiary: '#4ADE80',  // Light green
      border: '#D1FAE5',       // Mint border
      accent: '#10B981',       // Emerald
      accentLight: '#A7F3D0',  // Light emerald
      success: '#059669',      // Green
      danger: '#DC2626',       // Red (contrast)
      neutral: '#6B7280',      // Gray
      shadow: 'rgba(5, 150, 105, 0.08)',
      glowSuccess: 'rgba(5, 150, 105, 0.2)',
      glowDanger: 'rgba(220, 38, 38, 0.15)',
    },
    sunset: {
      name: '🌅 Sunset Premium',
      description: 'Warm, inviting, premium. Stripe meets Coinbase.',
      bg: '#FEF3F2',           // Warm background
      cardBg: '#FFFFFF',       // White cards
      text: '#1A1A1A',         // Black
      textSecondary: '#78716C', // Stone gray
      textTertiary: '#A8A29E',  // Light stone
      border: '#FDE4E3',       // Warm border
      accent: '#F97316',       // Orange
      accentLight: '#FFEDD5',  // Light orange
      success: '#059669',      // Green
      danger: '#DC2626',       // Red
      neutral: '#78716C',      // Stone
      shadow: 'rgba(249, 115, 22, 0.08)',
      glowSuccess: 'rgba(5, 150, 105, 0.15)',
      glowDanger: 'rgba(220, 38, 38, 0.15)',
    },
  }

  const currentTheme = themes[selectedTheme]

  return (
    <div style={{
      backgroundColor: currentTheme.bg,
      minHeight: '100vh',
      padding: '2rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* Header */}
      <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
        <div style={{
          marginBottom: '2rem',
          padding: '2rem',
          backgroundColor: currentTheme.cardBg,
          borderRadius: '16px',
          boxShadow: `0 4px 12px ${currentTheme.shadow}`,
          border: `1px solid ${currentTheme.border}`,
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: currentTheme.text,
            marginBottom: '0.5rem',
          }}>
            🎨 Light Mode Design Proposals
          </h1>
          <p style={{
            fontSize: '16px',
            color: currentTheme.textSecondary,
            marginBottom: '2rem',
          }}>
            4 premium themes crafted for professional traders. Select a theme to preview:
          </p>

          {/* Theme Selector */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem',
          }}>
            {Object.entries(themes).map(([key, theme]) => (
              <button
                key={key}
                onClick={() => setSelectedTheme(key as any)}
                style={{
                  padding: '1.5rem',
                  backgroundColor: selectedTheme === key ? theme.accentLight : currentTheme.cardBg,
                  border: `2px solid ${selectedTheme === key ? theme.accent : currentTheme.border}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'left',
                }}
              >
                <div style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: currentTheme.text,
                  marginBottom: '0.5rem',
                }}>
                  {theme.name}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: currentTheme.textSecondary,
                  lineHeight: '1.5',
                }}>
                  {theme.description}
                </div>
                {selectedTheme === key && (
                  <div style={{
                    marginTop: '0.75rem',
                    fontSize: '12px',
                    color: theme.accent,
                    fontWeight: '600',
                  }}>
                    ✓ CURRENTLY VIEWING
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Live Preview */}
        <div style={{
          backgroundColor: currentTheme.cardBg,
          borderRadius: '16px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: `0 4px 12px ${currentTheme.shadow}`,
          border: `1px solid ${currentTheme.border}`,
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: currentTheme.text,
            marginBottom: '1.5rem',
          }}>
            Live Dashboard Preview
          </h2>

          {/* Top Row: Fear & Greed + Network Metrics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem',
          }}>
            {/* Fear & Greed Gauge */}
            <div style={{
              backgroundColor: currentTheme.bg,
              padding: '2rem',
              borderRadius: '12px',
              border: `1px solid ${currentTheme.border}`,
              textAlign: 'center',
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: currentTheme.textSecondary,
                marginBottom: '1rem',
                letterSpacing: '0.5px',
              }}>
                FEAR & GREED INDEX
              </div>
              <div style={{
                width: '180px',
                height: '180px',
                margin: '0 auto',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `linear-gradient(135deg, ${currentTheme.danger} 0%, ${currentTheme.neutral} 50%, ${currentTheme.success} 100%)`,
                borderRadius: '50%',
                padding: '8px',
              }}>
                <div style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: currentTheme.cardBg,
                  borderRadius: '50%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `inset 0 4px 12px ${currentTheme.shadow}`,
                }}>
                  <div style={{
                    fontSize: '64px',
                    fontWeight: '700',
                    color: currentTheme.danger,
                    lineHeight: '1',
                  }}>
                    {fearGreedValue}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: currentTheme.textSecondary,
                    marginTop: '0.5rem',
                    letterSpacing: '1px',
                  }}>
                    {fearGreedLabel}
                  </div>
                </div>
              </div>
            </div>

            {/* Network Metrics */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '1rem',
            }}>
              {[
                { label: 'Total Value Locked', value: '$142.8B', change: '+8.2%', isPositive: true },
                { label: 'Volume 24h', value: '$28.4B', change: '+14.2%', isPositive: true },
                { label: 'Active Addresses', value: '1.2M', change: '-2.5%', isPositive: false },
                { label: 'Gas Usage', value: '85%', change: '+5.1%', isPositive: false },
              ].map((metric, idx) => (
                <div key={idx} style={{
                  backgroundColor: currentTheme.bg,
                  padding: '1.5rem',
                  borderRadius: '12px',
                  border: `1px solid ${currentTheme.border}`,
                  boxShadow: metric.isPositive
                    ? `0 0 0 1px ${currentTheme.glowSuccess}`
                    : `0 0 0 1px ${currentTheme.glowDanger}`,
                }}>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: currentTheme.textSecondary,
                    marginBottom: '0.5rem',
                    letterSpacing: '0.5px',
                  }}>
                    {metric.label}
                  </div>
                  <div style={{
                    fontSize: '28px',
                    fontWeight: '700',
                    color: currentTheme.text,
                    marginBottom: '0.25rem',
                  }}>
                    {metric.value}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: metric.isPositive ? currentTheme.success : currentTheme.danger,
                  }}>
                    {metric.change}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gas Prices Grid */}
          <div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: currentTheme.text,
              marginBottom: '1rem',
            }}>
              Real-Time Gas Prices
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem',
            }}>
              {gasData.map((gas, idx) => (
                <div key={idx} style={{
                  backgroundColor: currentTheme.bg,
                  padding: '1.5rem',
                  borderRadius: '12px',
                  border: `2px solid ${currentTheme.border}`,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: currentTheme.accent,
                    marginBottom: '0.75rem',
                    letterSpacing: '0.5px',
                  }}>
                    {gas.chain}
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    marginBottom: '0.5rem',
                  }}>
                    <div style={{
                      fontSize: '32px',
                      fontWeight: '700',
                      color: currentTheme.text,
                    }}>
                      {gas.price}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: currentTheme.textSecondary,
                      marginLeft: '0.5rem',
                    }}>
                      GWEI
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: currentTheme.textTertiary,
                      padding: '4px 8px',
                      backgroundColor: currentTheme.accentLight,
                      borderRadius: '6px',
                    }}>
                      {gas.status}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: gas.change.startsWith('+') ? currentTheme.success : currentTheme.danger,
                    }}>
                      {gas.change}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Color Palette Display */}
        <div style={{
          backgroundColor: currentTheme.cardBg,
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: `0 4px 12px ${currentTheme.shadow}`,
          border: `1px solid ${currentTheme.border}`,
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: currentTheme.text,
            marginBottom: '1.5rem',
          }}>
            Color Palette & Design Tokens
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: '1rem',
          }}>
            {[
              { name: 'Background', color: currentTheme.bg },
              { name: 'Card BG', color: currentTheme.cardBg },
              { name: 'Text', color: currentTheme.text },
              { name: 'Text Secondary', color: currentTheme.textSecondary },
              { name: 'Border', color: currentTheme.border },
              { name: 'Accent', color: currentTheme.accent },
              { name: 'Success', color: currentTheme.success },
              { name: 'Danger', color: currentTheme.danger },
            ].map((item, idx) => (
              <div key={idx} style={{
                textAlign: 'center',
              }}>
                <div style={{
                  width: '100%',
                  height: '80px',
                  backgroundColor: item.color,
                  borderRadius: '8px',
                  border: `1px solid ${currentTheme.border}`,
                  marginBottom: '0.5rem',
                  boxShadow: `0 2px 8px ${currentTheme.shadow}`,
                }} />
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: currentTheme.textSecondary,
                  marginBottom: '0.25rem',
                }}>
                  {item.name}
                </div>
                <div style={{
                  fontSize: '10px',
                  fontFamily: 'monospace',
                  color: currentTheme.textTertiary,
                }}>
                  {item.color}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Design Rationale */}
        <div style={{
          marginTop: '2rem',
          padding: '2rem',
          backgroundColor: currentTheme.accentLight,
          borderRadius: '16px',
          border: `2px solid ${currentTheme.accent}`,
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: currentTheme.text,
            marginBottom: '1rem',
          }}>
            💡 Design Philosophy - {currentTheme.name}
          </h3>
          <p style={{
            fontSize: '16px',
            color: currentTheme.textSecondary,
            lineHeight: '1.6',
            marginBottom: '1rem',
          }}>
            {currentTheme.description}
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginTop: '1.5rem',
          }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: currentTheme.text }}>
                ✓ WCAG AA Compliant
              </div>
              <div style={{ fontSize: '12px', color: currentTheme.textSecondary }}>
                4.5:1 contrast ratio minimum
              </div>
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: currentTheme.text }}>
                ✓ Reduced Eye Strain
              </div>
              <div style={{ fontSize: '12px', color: currentTheme.textSecondary }}>
                Optimized for daylight viewing
              </div>
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: currentTheme.text }}>
                ✓ Professional Trust
              </div>
              <div style={{ fontSize: '12px', color: currentTheme.textSecondary }}>
                Financial industry standards
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
