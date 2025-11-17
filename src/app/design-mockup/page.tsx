'use client'

import { useState } from 'react'

export default function DesignMockupPage() {
  const [selectedOption, setSelectedOption] = useState<'current' | 'optionA' | 'optionB' | 'optionC'>('current')

  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: '#fff', padding: '40px' }}>
      {/* Header */}
      <div style={{ maxWidth: '1600px', margin: '0 auto', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '16px' }}>
          🎨 Typography System Comparison
        </h1>
        <p style={{ fontSize: '18px', color: '#aaa', marginBottom: '32px' }}>
          Compara visualmente las diferentes opciones de diseño. Haz clic en cada opción para ver el mockup completo.
        </p>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedOption('current')}
            style={{
              padding: '16px 32px',
              backgroundColor: selectedOption === 'current' ? '#0099ff' : 'rgba(255, 255, 255, 0.1)',
              border: selectedOption === 'current' ? '2px solid #0099ff' : '2px solid transparent',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            📱 ACTUAL (Current Design)
          </button>

          <button
            onClick={() => setSelectedOption('optionA')}
            style={{
              padding: '16px 32px',
              backgroundColor: selectedOption === 'optionA' ? '#00ff88' : 'rgba(255, 255, 255, 0.1)',
              border: selectedOption === 'optionA' ? '2px solid #00ff88' : '2px solid transparent',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            🚀 OPCIÓN A (Aggressive Typography)
          </button>

          <button
            onClick={() => setSelectedOption('optionB')}
            style={{
              padding: '16px 32px',
              backgroundColor: selectedOption === 'optionB' ? '#ff9500' : 'rgba(255, 255, 255, 0.1)',
              border: selectedOption === 'optionB' ? '2px solid #ff9500' : '2px solid transparent',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            ⚖️ OPCIÓN B (Balanced Growth)
          </button>

          <button
            onClick={() => setSelectedOption('optionC')}
            style={{
              padding: '16px 32px',
              backgroundColor: selectedOption === 'optionC' ? '#a29bfe' : 'rgba(255, 255, 255, 0.1)',
              border: selectedOption === 'optionC' ? '2px solid #a29bfe' : '2px solid transparent',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            ⭐ OPCIÓN C (Hybrid - RECOMENDADA)
          </button>
        </div>

        {/* Description Box */}
        <div style={{
          padding: '24px',
          backgroundColor: 'rgba(0, 153, 255, 0.1)',
          border: '1px solid rgba(0, 153, 255, 0.3)',
          borderRadius: '12px',
          marginBottom: '40px'
        }}>
          {selectedOption === 'current' && (
            <>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px' }}>📱 Diseño Actual</h3>
              <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#ddd' }}>
                El diseño actual utiliza tamaños de fuente pequeños (10-14px) lo que puede causar fatiga visual.
                La información está muy comprimida y requiere buena vista o acercarse a la pantalla.
              </p>
              <ul style={{ marginTop: '12px', fontSize: '14px', color: '#aaa', lineHeight: '1.8' }}>
                <li>• Gas Price: 14px</li>
                <li>• Fear & Greed: 36px</li>
                <li>• Card Padding: 12px</li>
                <li>• Spacing: 8px</li>
              </ul>
            </>
          )}

          {selectedOption === 'optionA' && (
            <>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px', color: '#00ff88' }}>
                🚀 Opción A: Aggressive Typography + Progressive Disclosure
              </h3>
              <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#ddd' }}>
                Números GIGANTES (56-72px) para métricas clave. Información secundaria oculta hasta hover.
                Inspirado en Bloomberg Terminal y dashboards profesionales de trading.
              </p>
              <ul style={{ marginTop: '12px', fontSize: '14px', color: '#aaa', lineHeight: '1.8' }}>
                <li>✅ Hero Numbers: 72px (números principales)</li>
                <li>✅ Primary Data: 32px (precios, porcentajes)</li>
                <li>✅ Progressive Disclosure: Detalles en hover</li>
                <li>✅ Máxima legibilidad desde distancia</li>
                <li>⚠️ Muestra menos información a simple vista</li>
              </ul>
            </>
          )}

          {selectedOption === 'optionB' && (
            <>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px', color: '#ff9500' }}>
                ⚖️ Opción B: Balanced Growth (Todo +50%)
              </h3>
              <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#ddd' }}>
                Todo crece 50-100% de manera proporcional. Más espacio, mejor spacing, cards más grandes.
                Mantiene la misma cantidad de información pero más legible.
              </p>
              <ul style={{ marginTop: '12px', fontSize: '14px', color: '#aaa', lineHeight: '1.8' }}>
                <li>✅ Gas Price: 24px (+71%)</li>
                <li>✅ Fear & Greed: 56px (+55%)</li>
                <li>✅ Card Padding: 20px (+67%)</li>
                <li>✅ Spacing: 16px (+100%)</li>
                <li>✅ Toda la info visible sin hover</li>
              </ul>
            </>
          )}

          {selectedOption === 'optionC' && (
            <>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px', color: '#a29bfe' }}>
                ⭐ Opción C: Hybrid Approach (RECOMENDADA)
              </h3>
              <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#ddd' }}>
                Combina lo mejor de A y B. Números grandes para métricas clave, spacing generoso,
                información esencial visible, detalles en hover. El balance perfecto.
              </p>
              <ul style={{ marginTop: '12px', fontSize: '14px', color: '#aaa', lineHeight: '1.8' }}>
                <li>✅ Hero Numbers: 56px (métricas principales)</li>
                <li>✅ Primary Data: 28px (datos importantes)</li>
                <li>✅ Secondary: 18px (complementarios)</li>
                <li>✅ Card Padding: 24px (+100%)</li>
                <li>✅ Progressive Disclosure para detalles</li>
                <li>⭐ Mejor de ambos mundos</li>
              </ul>
            </>
          )}
        </div>
      </div>

      {/* Mockup Display */}
      <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 300px', gap: '20px' }}>

          {/* Left Panel Mock */}
          <div>
            <div className="analytics-block" style={{
              padding: selectedOption === 'current' ? '12px' :
                       selectedOption === 'optionA' ? '24px' :
                       selectedOption === 'optionB' ? '20px' : '24px',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              <div style={{
                fontSize: selectedOption === 'current' ? '12px' :
                          selectedOption === 'optionA' ? '16px' :
                          selectedOption === 'optionB' ? '16px' : '16px',
                fontWeight: 'bold',
                color: '#fff',
                marginBottom: selectedOption === 'current' ? '8px' : '16px',
                letterSpacing: '0.05em'
              }}>
                GAS PRICES (LIVE)
              </div>

              {/* Ethereum Gas Card */}
              <div style={{
                padding: selectedOption === 'current' ? '10px' :
                        selectedOption === 'optionA' ? '20px' :
                        selectedOption === 'optionB' ? '16px' : '20px',
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '6px',
                marginBottom: selectedOption === 'current' ? '8px' : '12px'
              }}>
                <div style={{
                  fontSize: selectedOption === 'current' ? '11px' :
                            selectedOption === 'optionA' ? '18px' :
                            selectedOption === 'optionB' ? '16px' : '18px',
                  fontWeight: '600',
                  color: '#fff',
                  marginBottom: selectedOption === 'current' ? '4px' : '12px',
                  letterSpacing: '0.05em'
                }}>
                  ETHEREUM
                </div>

                {selectedOption === 'optionA' ? (
                  // Option A: Huge number
                  <>
                    <div style={{
                      fontSize: '72px',
                      fontWeight: '900',
                      color: '#0099ff',
                      lineHeight: '1',
                      marginBottom: '8px'
                    }}>
                      28.5
                    </div>
                    <div style={{
                      fontSize: '20px',
                      fontWeight: '500',
                      color: '#888',
                      marginBottom: '16px'
                    }}>
                      GWEI
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: '#666',
                      fontStyle: 'italic'
                    }}>
                      Hover for details...
                    </div>
                  </>
                ) : (
                  // Other options: Show all info
                  <>
                    <div style={{
                      fontSize: selectedOption === 'current' ? '14px' :
                                selectedOption === 'optionB' ? '24px' : '56px',
                      fontWeight: selectedOption === 'current' ? '600' : '800',
                      color: '#0099ff',
                      marginBottom: selectedOption === 'current' ? '4px' : '8px'
                    }}>
                      {selectedOption === 'current' ? '28.5 GWEI' : '28.5'}
                    </div>
                    {selectedOption !== 'current' && (
                      <div style={{
                        fontSize: selectedOption === 'optionB' ? '16px' : '20px',
                        fontWeight: '500',
                        color: '#888',
                        marginBottom: '12px'
                      }}>
                        GWEI
                      </div>
                    )}
                    <div style={{
                      fontSize: selectedOption === 'current' ? '10px' :
                                selectedOption === 'optionB' ? '14px' : '16px',
                      color: '#ffbb00',
                      fontWeight: '600',
                      marginBottom: selectedOption === 'current' ? '4px' : '8px'
                    }}>
                      MEDIUM
                    </div>
                    {selectedOption !== 'current' && (
                      <>
                        <div style={{
                          fontSize: '14px',
                          color: '#666',
                          marginTop: '12px',
                          paddingTop: '12px',
                          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                          <div style={{ marginBottom: '4px' }}>
                            Base Fee: <span style={{ color: '#0099ff' }}>12.3 GWEI</span>
                          </div>
                          <div style={{ marginBottom: '4px' }}>
                            Priority: <span style={{ color: '#00ff88' }}>16.2 GWEI</span>
                          </div>
                          <div style={{ color: '#666', fontSize: '12px', marginTop: '8px' }}>
                            Updated 5s ago
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>

              {/* Base Card */}
              <div style={{
                padding: selectedOption === 'current' ? '10px' :
                        selectedOption === 'optionA' ? '20px' :
                        selectedOption === 'optionB' ? '16px' : '20px',
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '6px'
              }}>
                <div style={{
                  fontSize: selectedOption === 'current' ? '11px' :
                            selectedOption === 'optionA' ? '18px' :
                            selectedOption === 'optionB' ? '16px' : '18px',
                  fontWeight: '600',
                  color: '#fff',
                  marginBottom: selectedOption === 'current' ? '4px' : '12px',
                  letterSpacing: '0.05em'
                }}>
                  BASE
                </div>

                {selectedOption === 'optionA' ? (
                  <>
                    <div style={{
                      fontSize: '72px',
                      fontWeight: '900',
                      color: '#00ff88',
                      lineHeight: '1',
                      marginBottom: '8px'
                    }}>
                      0.02
                    </div>
                    <div style={{
                      fontSize: '20px',
                      fontWeight: '500',
                      color: '#888',
                      marginBottom: '16px'
                    }}>
                      GWEI
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: '#666',
                      fontStyle: 'italic'
                    }}>
                      Hover for details...
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{
                      fontSize: selectedOption === 'current' ? '14px' :
                                selectedOption === 'optionB' ? '24px' : '56px',
                      fontWeight: selectedOption === 'current' ? '600' : '800',
                      color: '#00ff88',
                      marginBottom: selectedOption === 'current' ? '4px' : '8px'
                    }}>
                      {selectedOption === 'current' ? '0.02 GWEI' : '0.02'}
                    </div>
                    {selectedOption !== 'current' && (
                      <div style={{
                        fontSize: selectedOption === 'optionB' ? '16px' : '20px',
                        fontWeight: '500',
                        color: '#888',
                        marginBottom: '12px'
                      }}>
                        GWEI
                      </div>
                    )}
                    <div style={{
                      fontSize: selectedOption === 'current' ? '10px' :
                                selectedOption === 'optionB' ? '14px' : '16px',
                      color: '#00ff88',
                      fontWeight: '600'
                    }}>
                      LOW
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Center Panel Mock */}
          <div>
            <div className="analytics-block" style={{
              padding: selectedOption === 'current' ? '12px' :
                       selectedOption === 'optionA' ? '24px' :
                       selectedOption === 'optionB' ? '20px' : '24px',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px'
            }}>
              <div style={{
                fontSize: selectedOption === 'current' ? '12px' :
                          selectedOption === 'optionA' ? '16px' :
                          selectedOption === 'optionB' ? '16px' : '16px',
                fontWeight: 'bold',
                color: '#fff',
                marginBottom: selectedOption === 'current' ? '12px' : '20px',
                letterSpacing: '0.05em'
              }}>
                NETWORK METRICS
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: selectedOption === 'current' ? '12px' : '20px'
              }}>
                {/* Volume Card */}
                <div style={{
                  padding: selectedOption === 'current' ? '12px' :
                          selectedOption === 'optionA' ? '24px' :
                          selectedOption === 'optionB' ? '20px' : '24px',
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: selectedOption === 'current' ? '10px' :
                              selectedOption === 'optionA' ? '14px' :
                              selectedOption === 'optionB' ? '14px' : '14px',
                    color: '#888',
                    marginBottom: selectedOption === 'current' ? '8px' : '12px',
                    fontWeight: '500'
                  }}>
                    Volume 24h
                  </div>
                  <div style={{
                    fontSize: selectedOption === 'current' ? '18px' :
                              selectedOption === 'optionA' ? '48px' :
                              selectedOption === 'optionB' ? '32px' : '42px',
                    fontWeight: '800',
                    color: '#fff',
                    lineHeight: '1.2',
                    marginBottom: selectedOption === 'current' ? '4px' : '8px'
                  }}>
                    $28.4B
                  </div>
                  <div style={{
                    fontSize: selectedOption === 'current' ? '11px' :
                              selectedOption === 'optionA' ? '18px' :
                              selectedOption === 'optionB' ? '16px' : '18px',
                    color: '#00ff88',
                    fontWeight: '600'
                  }}>
                    +14.2%
                  </div>
                </div>

                {/* Active Wallets Card */}
                <div style={{
                  padding: selectedOption === 'current' ? '12px' :
                          selectedOption === 'optionA' ? '24px' :
                          selectedOption === 'optionB' ? '20px' : '24px',
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: selectedOption === 'current' ? '10px' :
                              selectedOption === 'optionA' ? '14px' :
                              selectedOption === 'optionB' ? '14px' : '14px',
                    color: '#888',
                    marginBottom: selectedOption === 'current' ? '8px' : '12px',
                    fontWeight: '500'
                  }}>
                    Active Wallets
                  </div>
                  <div style={{
                    fontSize: selectedOption === 'current' ? '18px' :
                              selectedOption === 'optionA' ? '48px' :
                              selectedOption === 'optionB' ? '32px' : '42px',
                    fontWeight: '800',
                    color: '#fff',
                    lineHeight: '1.2',
                    marginBottom: selectedOption === 'current' ? '4px' : '8px'
                  }}>
                    2.1M
                  </div>
                  <div style={{
                    fontSize: selectedOption === 'current' ? '11px' :
                              selectedOption === 'optionA' ? '18px' :
                              selectedOption === 'optionB' ? '16px' : '18px',
                    color: '#00ff88',
                    fontWeight: '600'
                  }}>
                    +8.7%
                  </div>
                </div>

                {/* DeFi TVL Card */}
                <div style={{
                  padding: selectedOption === 'current' ? '12px' :
                          selectedOption === 'optionA' ? '24px' :
                          selectedOption === 'optionB' ? '20px' : '24px',
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: selectedOption === 'current' ? '10px' :
                              selectedOption === 'optionA' ? '14px' :
                              selectedOption === 'optionB' ? '14px' : '14px',
                    color: '#888',
                    marginBottom: selectedOption === 'current' ? '8px' : '12px',
                    fontWeight: '500'
                  }}>
                    DeFi TVL
                  </div>
                  <div style={{
                    fontSize: selectedOption === 'current' ? '18px' :
                              selectedOption === 'optionA' ? '48px' :
                              selectedOption === 'optionB' ? '32px' : '42px',
                    fontWeight: '800',
                    color: '#fff',
                    lineHeight: '1.2',
                    marginBottom: selectedOption === 'current' ? '4px' : '8px'
                  }}>
                    $87.2B
                  </div>
                  <div style={{
                    fontSize: selectedOption === 'current' ? '11px' :
                              selectedOption === 'optionA' ? '18px' :
                              selectedOption === 'optionB' ? '16px' : '18px',
                    color: '#00ff88',
                    fontWeight: '600'
                  }}>
                    +5.8%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel Mock - Fear & Greed */}
          <div>
            <div className="analytics-block" style={{
              padding: selectedOption === 'current' ? '12px' :
                       selectedOption === 'optionA' ? '24px' :
                       selectedOption === 'optionB' ? '20px' : '24px',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px'
            }}>
              <div style={{
                fontSize: selectedOption === 'current' ? '12px' :
                          selectedOption === 'optionA' ? '16px' :
                          selectedOption === 'optionB' ? '16px' : '16px',
                fontWeight: 'bold',
                color: '#fff',
                marginBottom: selectedOption === 'current' ? '16px' : '24px',
                letterSpacing: '0.05em'
              }}>
                FEAR & GREED INDEX
              </div>

              <div style={{
                textAlign: 'center',
                padding: selectedOption === 'current' ? '20px 0' : '40px 0'
              }}>
                <div style={{
                  fontSize: selectedOption === 'current' ? '36px' :
                            selectedOption === 'optionA' ? '96px' :
                            selectedOption === 'optionB' ? '64px' : '84px',
                  fontWeight: '900',
                  color: '#ff0000',
                  lineHeight: '1',
                  marginBottom: selectedOption === 'current' ? '8px' : '16px'
                }}>
                  14
                </div>
                <div style={{
                  fontSize: selectedOption === 'current' ? '14px' :
                            selectedOption === 'optionA' ? '24px' :
                            selectedOption === 'optionB' ? '20px' : '22px',
                  fontWeight: '600',
                  color: '#ff0000'
                }}>
                  EXTREME FEAR
                </div>
              </div>

              {selectedOption !== 'optionA' && (
                <div style={{
                  marginTop: selectedOption === 'current' ? '12px' : '24px',
                  fontSize: selectedOption === 'current' ? '10px' : '14px',
                  color: '#666'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: selectedOption === 'current' ? '6px 0' : '10px 0',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                    <span>Extreme Fear</span>
                    <span style={{ color: '#ff0000' }}>0-24</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: selectedOption === 'current' ? '6px 0' : '10px 0',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                    <span>Fear</span>
                    <span>25-49</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: selectedOption === 'current' ? '6px 0' : '10px 0',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                    <span>Neutral</span>
                    <span>50</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: selectedOption === 'current' ? '6px 0' : '10px 0',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                    <span>Greed</span>
                    <span>51-75</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: selectedOption === 'current' ? '6px 0' : '10px 0'
                  }}>
                    <span>Extreme Greed</span>
                    <span>76-100</span>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Comparison Summary */}
        <div style={{
          marginTop: '40px',
          padding: '32px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          border: '2px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>
            📊 Comparación de Tamaños
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '14px', color: '#888', marginBottom: '12px' }}>📱 Actual</div>
              <div style={{ fontSize: '12px', color: '#aaa', lineHeight: '1.8' }}>
                <div>Gas: 14px</div>
                <div>F&G: 36px</div>
                <div>Padding: 12px</div>
                <div>Spacing: 8px</div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#00ff88', marginBottom: '12px' }}>🚀 Opción A</div>
              <div style={{ fontSize: '12px', color: '#aaa', lineHeight: '1.8' }}>
                <div>Gas: 72px (+414%)</div>
                <div>F&G: 96px (+167%)</div>
                <div>Padding: 24px (+100%)</div>
                <div>Spacing: 16px (+100%)</div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#ff9500', marginBottom: '12px' }}>⚖️ Opción B</div>
              <div style={{ fontSize: '12px', color: '#aaa', lineHeight: '1.8' }}>
                <div>Gas: 24px (+71%)</div>
                <div>F&G: 64px (+78%)</div>
                <div>Padding: 20px (+67%)</div>
                <div>Spacing: 16px (+100%)</div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#a29bfe', marginBottom: '12px' }}>⭐ Opción C</div>
              <div style={{ fontSize: '12px', color: '#aaa', lineHeight: '1.8' }}>
                <div>Gas: 56px (+300%)</div>
                <div>F&G: 84px (+133%)</div>
                <div>Padding: 24px (+100%)</div>
                <div>Spacing: 16px (+100%)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendation */}
        <div style={{
          marginTop: '24px',
          padding: '24px',
          backgroundColor: 'rgba(162, 155, 254, 0.1)',
          border: '2px solid rgba(162, 155, 254, 0.3)',
          borderRadius: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span style={{ fontSize: '32px' }}>⭐</span>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#a29bfe' }}>
              Recomendación del Experto UX
            </h3>
          </div>
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#ddd' }}>
            La <strong>Opción C (Hybrid)</strong> ofrece el mejor balance entre legibilidad profesional y
            eficiencia de espacio. Los números principales son 3x más grandes (56-84px), el spacing es
            2x más generoso, y mantiene la información esencial visible mientras permite progressive
            disclosure para detalles adicionales.
          </p>
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#ddd', marginTop: '12px' }}>
            Esta opción está inspirada en terminales profesionales como Bloomberg y TradingView,
            optimizada para sesiones largas sin fatiga visual.
          </p>
        </div>
      </div>
    </div>
  )
}
