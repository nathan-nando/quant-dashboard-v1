"use client";

import React from 'react';
import { Security } from '@carbon/icons-react';
import { useGlobalState } from '../contexts/GlobalStateContext';

export default function RangeBarPyramidVisualizer() {
  const { state } = useGlobalState();

  const rawRb = state?.range_bar_state || {};
  const currentSpread = Number(rawRb.current_spread || 0);
  const rangeSize = Number(rawRb.range_size || 1.50);
  const progressPct = Number(rawRb.progress_pct || 0);
  const barDuration = Number(rawRb.bar_duration_seconds || 0);
  const priceVelocity = Number(rawRb.price_velocity || 0);
  const consecutiveBars = Number(rawRb.consecutive_bars || 0);
  const lastDirection = String(rawRb.last_direction || "NONE");
  const completedBarsCount = Number(rawRb.completed_bars_count || 0);
  const currentBarIndex = Number(rawRb.bar_index || (completedBarsCount + 1));
  const tickVolume = Number(rawRb.tick_volume || 1);
  const recentVelocities: any[] = Array.isArray(rawRb.recent_velocities) ? rawRb.recent_velocities : [];

  const rawCluster = state?.pyramid_cluster || {};
  const clusterActive = Boolean(rawCluster.active);
  const layerCount = Number(rawCluster.layer_count || 0);
  const maxLayers = Number(rawCluster.max_layers || 4);
  const clusterSide = String(rawCluster.cluster_side || "NONE");
  const totalVolume = Number(rawCluster.total_volume || 0);
  const netProfitPips = Number(rawCluster.net_profit_pips || 0);
  const clusterLayers = Array.isArray(rawCluster.layers) ? rawCluster.layers : [];
  const trailingStopLevel = rawCluster.trailing_stop_level != null ? Number(rawCluster.trailing_stop_level) : null;

  let avgPrice = 0;
  if (clusterLayers.length > 0 && totalVolume > 0) {
    const totalWeighted = clusterLayers.reduce((acc: number, l: any) => acc + (Number(l.open_price || 0) * Number(l.volume || 0.01)), 0);
    avgPrice = totalWeighted / totalVolume;
  }

  const isBullish = lastDirection === "BULLISH";
  const isHighVelocity = priceVelocity >= 0.10;

  let isAccelerating = false;
  if (recentVelocities.length >= 2) {
    const lastV = Number(recentVelocities[recentVelocities.length - 1]?.velocity || 0);
    const prevV = Number(recentVelocities[recentVelocities.length - 2]?.velocity || 0);
    isAccelerating = lastV >= prevV;
  }

  const gaugeRadius = 20;
  const gaugeCirc = 2 * Math.PI * gaugeRadius;
  const clampedProgress = Math.min(100, Math.max(0, progressPct));
  const strokeOffset = gaugeCirc - (clampedProgress / 100) * gaugeCirc;
  const progressColor = clampedProgress >= 80 ? '#24a148' : '#f1c21b';

  const CARD_BG = '#282828';

  return (
    <div style={{ padding: '0.3rem 0.5rem', height: '100%', display: 'flex', flexDirection: 'column', gap: '0.1rem', boxSizing: 'border-box' }}>
      
      {/* 2-COLUMN MAIN GRID WITH 0.1rem GAP */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '0.1rem', alignItems: 'stretch', flex: 1 }}>
        
        {/* ================= SISI KIRI: LIVE RANGE BUILDER & VELOCITY ================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', justifyContent: 'space-between', paddingRight: '0.2rem' }}>
          
          {/* Header strip Sisi Kiri - 1 line compact */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', whiteSpace: 'nowrap', overflow: 'hidden' }}>
            <span style={{ fontSize: '0.68rem', color: '#a8a8a8', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.3px' }}>
              Range Builder
            </span>
            <span style={{ fontSize: '0.62rem', padding: '1px 5px', background: CARD_BG, color: '#f1c21b', fontWeight: 600, fontFamily: 'monospace' }}>
              ΔP = ${rangeSize.toFixed(2)}
            </span>
          </div>

          {/* Top Row: Circular Gauge + 2x2 Metrics Grid */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            
            {/* 1. Circular Gauge */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '65px', flexShrink: 0 }}>
              <div style={{ position: 'relative', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="48" height="48" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="24" cy="24" r={gaugeRadius} fill="none" stroke="#383838" strokeWidth={4.5} />
                  <circle
                    cx="24"
                    cy="24"
                    r={gaugeRadius}
                    fill="none"
                    stroke={progressColor}
                    strokeWidth={4.5}
                    strokeDasharray={gaugeCirc}
                    strokeDashoffset={strokeOffset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
                  />
                </svg>
                <span style={{ position: 'absolute', fontSize: '0.75rem', fontWeight: 700, color: '#f4f4f4', fontFamily: 'monospace' }}>
                  {progressPct.toFixed(0)}%
                </span>
              </div>
              <div style={{ fontSize: '0.62rem', color: progressColor, fontFamily: 'monospace', fontWeight: 600, marginTop: '2px' }}>
                ${currentSpread.toFixed(2)} / ${rangeSize.toFixed(2)}
              </div>
            </div>

            {/* 2. Metrics 2x2 Grid with CARD_BG (No Border) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.1rem', flex: 1 }}>
              <div style={{ background: CARD_BG, padding: '0.2rem 0.35rem', borderRadius: 0 }}>
                <div style={{ color: '#8d8d8d', fontSize: '0.6rem', textTransform: 'uppercase' }}>Velocity</div>
                <strong style={{ color: isHighVelocity ? '#42be65' : '#f4f4f4', fontFamily: 'monospace', fontSize: '0.76rem' }}>
                  ${priceVelocity.toFixed(3)}/s {isHighVelocity ? '🔥' : ''}
                </strong>
              </div>
              <div style={{ background: CARD_BG, padding: '0.2rem 0.35rem', borderRadius: 0 }}>
                <div style={{ color: '#8d8d8d', fontSize: '0.6rem', textTransform: 'uppercase' }}>Duration</div>
                <strong style={{ color: '#f4f4f4', fontFamily: 'monospace', fontSize: '0.76rem' }}>
                  {barDuration.toFixed(1)}s
                </strong>
              </div>
              <div style={{ background: CARD_BG, padding: '0.2rem 0.35rem', borderRadius: 0 }}>
                <div style={{ color: '#8d8d8d', fontSize: '0.6rem', textTransform: 'uppercase' }}>Direction</div>
                <span style={{ color: isBullish ? '#24a148' : (lastDirection === 'BEARISH' ? '#fa4d56' : '#8d8d8d'), fontWeight: 700, fontSize: '0.76rem' }}>
                  {consecutiveBars > 0 ? `${consecutiveBars}x ${lastDirection === 'BULLISH' ? 'UP' : 'DN'}` : 'FLAT'}
                </span>
              </div>
              <div style={{ background: CARD_BG, padding: '0.2rem 0.35rem', borderRadius: 0 }}>
                <div style={{ color: '#8d8d8d', fontSize: '0.6rem', textTransform: 'uppercase' }}>Bar / Ticks</div>
                <strong style={{ color: '#f4f4f4', fontFamily: 'monospace', fontSize: '0.76rem' }}>
                  #{currentBarIndex} ({tickVolume}t)
                </strong>
              </div>
            </div>
          </div>

          {/* 3 & 4. Velocity Momentum with CARD_BG (No Border) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.62rem', color: '#8d8d8d', textTransform: 'uppercase', fontWeight: 600 }}>
                Velocity Momentum:
              </span>
              <span style={{ fontSize: '0.62rem', color: isAccelerating ? '#42be65' : '#ff8389', fontWeight: 600 }}>
                {isAccelerating ? '▲ Accel' : '▼ Decel'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '18px', width: '100%', background: CARD_BG, padding: '2px 4px', boxSizing: 'border-box' }}>
              {recentVelocities.length > 0 ? (
                recentVelocities.map((item, idx) => {
                  const v = Number(item.velocity || 0.05);
                  const hPct = Math.min(100, Math.max(20, (v / 0.50) * 100));
                  const isUp = item.direction === 'BULLISH';
                  return (
                    <div 
                      key={idx} 
                      title={`Bar #${item.bar_index}: $${v.toFixed(3)}/s (${item.direction})`}
                      style={{ 
                        flex: 1, 
                        height: `${hPct}%`, 
                        background: isUp ? '#24a148' : '#fa4d56', 
                        borderRadius: 0 
                      }} 
                    />
                  );
                })
              ) : (
                <span style={{ color: '#6f6f6f', fontSize: '0.58rem' }}>Awaiting range bars...</span>
              )}
            </div>
          </div>
        </div>

        {/* ================= SISI KANAN: PYRAMIDING SCALE-IN (VERTICAL L1-L4) ================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', justifyContent: 'space-between', paddingLeft: '0.2rem' }}>
          
          {/* Header Strip Sisi Kanan - 1 line compact */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', whiteSpace: 'nowrap', overflow: 'hidden' }}>
            <span style={{ fontSize: '0.68rem', color: '#a8a8a8', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.3px' }}>
              Pyramiding
            </span>
            {clusterActive ? (
              <span style={{ fontSize: '0.62rem', padding: '1px 5px', background: clusterSide === 'BUY' ? '#24a148' : '#fa4d56', color: '#fff', fontWeight: 700 }}>
                {clusterSide} ({layerCount}/{maxLayers})
              </span>
            ) : (
              <span style={{ fontSize: '0.62rem', padding: '1px 5px', background: CARD_BG, color: '#8d8d8d', fontWeight: 600 }}>
                STANDBY
              </span>
            )}
          </div>

          {/* Vertical Stack L1 to L4 with CARD_BG (No Border) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', flex: 1, justifyContent: 'center' }}>
            {[1, 2, 3, 4].map((layerNum) => {
              const layerData = clusterLayers.find((l: any) => l.layer_index === layerNum);
              const isActive = !!layerData;
              const isWaiting = !isActive && clusterActive && layerNum === (layerCount + 1);
              const pipsVal = layerData ? Number(layerData.profit_pips || 0) : 0;
              
              let rowBg = CARD_BG;
              let badgeBg = '#3c3c3c';
              let statusLabel = 'Standby';
              let subText = layerNum === 1 ? 'Ready L1' : `Wait L${layerNum - 1}`;

              if (clusterActive) {
                if (isWaiting) {
                  rowBg = '#3d3822';
                  badgeBg = '#665714';
                  statusLabel = 'Waiting';
                  subText = '+$1.50 step';
                }
              }

              if (isActive) {
                rowBg = clusterSide === 'BUY' ? 'rgba(36, 161, 72, 0.25)' : 'rgba(218, 30, 40, 0.25)';
                badgeBg = clusterSide === 'BUY' ? '#198038' : '#da1e28';
                statusLabel = layerNum === 1 ? '✓ Base' : `✓ Add-on`;
                subText = `${pipsVal > 0 ? '+' : ''}${pipsVal.toFixed(1)}p`;
              }

              return (
                <div 
                  key={layerNum} 
                  style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '2px 6px',
                    borderRadius: 0,
                    background: rowBg,
                    border: 'none',
                    fontSize: '0.68rem',
                    height: '20px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ 
                      fontSize: '0.62rem', 
                      fontWeight: 700, 
                      padding: '0 4px', 
                      background: badgeBg, 
                      color: '#fff', 
                      lineHeight: '14px',
                      height: '14px' 
                    }}>
                      L{layerNum}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: isActive ? '#f4f4f4' : (isWaiting ? '#f1c21b' : '#8d8d8d'), fontWeight: isActive ? 600 : 400 }}>
                      {statusLabel}
                    </span>
                  </div>

                  <span style={{ fontSize: '0.65rem', color: isActive ? (pipsVal >= 0 ? '#42be65' : '#ff8389') : '#8d8d8d', fontFamily: 'monospace', fontWeight: isActive ? 600 : 400 }}>
                    {isActive ? `@${Number(layerData.open_price || 0).toFixed(2)} (${subText})` : subText}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Bottom Summary Strip with CARD_BG (No Border) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem', background: CARD_BG, padding: '3px 6px', marginTop: '1px', border: 'none' }}>
            <div>
              <span style={{ color: '#8d8d8d', fontSize: '0.62rem' }}>Avg: </span>
              <strong style={{ color: '#f4f4f4', fontFamily: 'monospace', fontSize: '0.68rem' }}>
                {avgPrice > 0 ? `$${avgPrice.toFixed(2)} (${totalVolume.toFixed(2)}L)` : '---'}
              </strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Security size={11} style={{ color: trailingStopLevel != null ? '#f1c21b' : '#6f6f6f' }} />
              <span style={{ color: '#8d8d8d', fontSize: '0.62rem' }}>Trail: </span>
              <strong style={{ color: trailingStopLevel != null ? '#f1c21b' : '#6f6f6f', fontFamily: 'monospace', fontSize: '0.68rem' }}>
                {trailingStopLevel != null ? `$${trailingStopLevel.toFixed(2)}` : 'OFF'}
              </strong>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
