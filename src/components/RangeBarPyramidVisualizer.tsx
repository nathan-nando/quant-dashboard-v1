"use client";

import React from 'react';
import { Tile, ProgressBar } from '@carbon/react';
import { Flash, Security } from '@carbon/icons-react';
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

  return (
    <Tile style={{ padding: '0.4rem 0.6rem', background: '#262626', border: 'none', borderRadius: 0, height: '100%', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      
      {/* HEADER STRIP */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Flash size={14} style={{ color: '#a8a8a8' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f4f4f4', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Event-Driven Price Engine
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.65rem', padding: '1px 5px', background: '#393939', color: '#f4f4f4', fontWeight: 600, borderRadius: 0 }}>
            RANGE BUILDER (ΔP = ${rangeSize.toFixed(2)})
          </span>
          {clusterActive ? (
            <span style={{ fontSize: '0.65rem', padding: '1px 5px', background: clusterSide === 'BUY' ? '#24a148' : '#fa4d56', color: '#fff', fontWeight: 700, borderRadius: 0 }}>
              {clusterSide} CLUSTER ({layerCount}/{maxLayers})
            </span>
          ) : (
            <span style={{ fontSize: '0.65rem', padding: '1px 5px', background: '#353535', color: '#c6c6c6', fontWeight: 500, borderRadius: 0 }}>
              STANDBY
            </span>
          )}
        </div>
      </div>

      {/* 2-COLUMN FLAT GRID (NO INNER BLACK PANELS, NO ROUNDED EDGES, NO INNER BORDERS) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0.5rem', alignItems: 'stretch' }}>
        
        {/* COLUMN 1: LIVE RANGE BUILDER */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.65rem', color: '#8d8d8d', textTransform: 'uppercase', fontWeight: 600 }}>
              Current Range Progress
            </span>
            <span style={{ fontSize: '0.72rem', color: progressPct >= 80 ? '#42be65' : '#f1c21b', fontFamily: 'monospace', fontWeight: 600 }}>
              ${currentSpread.toFixed(2)} / ${rangeSize.toFixed(2)} ({progressPct.toFixed(0)}%)
            </span>
          </div>

          <div>
            <ProgressBar 
              label="" 
              hideLabel 
              value={progressPct} 
              max={100} 
              size="small" 
              status={progressPct >= 90 ? 'finished' : 'active'}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.1rem', fontSize: '0.7rem' }}>
            <div style={{ background: '#333333', padding: '0.2rem 0.35rem', textAlign: 'center', borderRadius: 0 }}>
              <div style={{ color: '#8d8d8d', fontSize: '0.58rem' }}>Velocity</div>
              <strong style={{ color: isHighVelocity ? '#42be65' : '#f4f4f4', fontFamily: 'monospace', fontSize: '0.68rem' }}>
                ${priceVelocity.toFixed(3)}/s {isHighVelocity ? '🔥' : ''}
              </strong>
            </div>
            <div style={{ background: '#333333', padding: '0.2rem 0.35rem', textAlign: 'center', borderRadius: 0 }}>
              <div style={{ color: '#8d8d8d', fontSize: '0.58rem' }}>Duration</div>
              <strong style={{ color: '#f4f4f4', fontFamily: 'monospace', fontSize: '0.68rem' }}>
                {barDuration.toFixed(1)}s
              </strong>
            </div>
            <div style={{ background: '#333333', padding: '0.2rem 0.35rem', textAlign: 'center', borderRadius: 0 }}>
              <div style={{ color: '#8d8d8d', fontSize: '0.58rem' }}>Direction</div>
              <span style={{ color: isBullish ? '#24a148' : (lastDirection === 'BEARISH' ? '#fa4d56' : '#8d8d8d'), fontWeight: 600, fontSize: '0.68rem' }}>
                {consecutiveBars > 0 ? `${consecutiveBars}x ${lastDirection === 'BULLISH' ? 'UP' : 'DN'}` : 'FLAT'}
              </span>
            </div>
            <div style={{ background: '#333333', padding: '0.2rem 0.35rem', textAlign: 'center', borderRadius: 0 }}>
              <div style={{ color: '#8d8d8d', fontSize: '0.58rem' }}>Bar / Ticks</div>
              <strong style={{ color: '#f4f4f4', fontFamily: 'monospace', fontSize: '0.68rem' }}>
                #{currentBarIndex} ({tickVolume}t)
              </strong>
            </div>
          </div>

          {/* SPARKLINE STRIP */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.35rem', marginTop: '0.1rem' }}>
            <span style={{ fontSize: '0.58rem', color: '#8d8d8d', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              Velocity Momentum ({isAccelerating ? '▲ Accel' : '▼ Decel'}):
            </span>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '14px', flex: 1 }}>
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
                <span style={{ color: '#6f6f6f', fontSize: '0.58rem' }}>Awaiting initial range bars...</span>
              )}
            </div>
          </div>
        </div>

        {/* COLUMN 2: PYRAMIDING SCALE-IN ENGINE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.65rem', color: '#8d8d8d', textTransform: 'uppercase', fontWeight: 600 }}>
              Pyramiding Scale-In State
            </span>
            {clusterActive ? (
              <span style={{ fontSize: '0.72rem', color: netProfitPips >= 0 ? '#24a148' : '#fa4d56', fontWeight: 600, fontFamily: 'monospace' }}>
                Net: {netProfitPips > 0 ? '+' : ''}{netProfitPips.toFixed(1)}p ({totalVolume.toFixed(2)}L)
              </span>
            ) : (
              <span style={{ fontSize: '0.65rem', color: '#6f6f6f' }}>Cluster Idle</span>
            )}
          </div>

          {/* 4-LAYER STRIP (NO BORDER, FLAT CARBON BOXES, RADIUS 0) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.1rem' }}>
            {[1, 2, 3, 4].map((layerNum) => {
              const layerData = clusterLayers.find((l: any) => l.layer_index === layerNum);
              const isActive = !!layerData;
              const isWaiting = !isActive && clusterActive && layerNum === (layerCount + 1);
              const pipsVal = layerData ? Number(layerData.profit_pips || 0) : 0;
              
              let bgColor = '#333333';
              let statusLabel = 'Standby';
              let subText = layerNum === 1 ? 'Ready L1' : `Wait L${layerNum - 1}`;

              if (clusterActive) {
                if (isWaiting) {
                  bgColor = '#3d3822';
                  statusLabel = 'Waiting';
                  subText = '+$1.50 step';
                }
              }

              if (isActive) {
                bgColor = clusterSide === 'BUY' ? '#198038' : '#da1e28';
                statusLabel = layerNum === 1 ? '✓ Base' : '✓ Add';
                subText = `${pipsVal > 0 ? '+' : ''}${pipsVal.toFixed(1)}p`;
              }

              return (
                <div 
                  key={layerNum} 
                  style={{ 
                    padding: '0.25rem 0.2rem', 
                    textAlign: 'center', 
                    borderRadius: 0,
                    background: bgColor,
                    border: 'none'
                  }}
                >
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: isActive ? '#fff' : (isWaiting ? '#f1c21b' : '#8d8d8d') }}>
                    L{layerNum} {isActive ? '✓' : ''}
                  </div>
                  <div style={{ fontSize: '0.58rem', color: isActive ? '#f4f4f4' : (isWaiting ? '#f1c21b' : '#a8a8a8'), fontWeight: 500 }}>
                    {statusLabel}
                  </div>
                  <div style={{ fontSize: '0.55rem', color: isActive ? '#f4f4f4' : '#6f6f6f', fontFamily: 'monospace' }}>
                    {isActive ? `@${Number(layerData.open_price || 0).toFixed(2)}` : subText}
                  </div>
                </div>
              );
            })}
          </div>

          {/* SUMMARY STRIP */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem', background: '#333333', padding: '0.2rem 0.4rem', borderRadius: 0, marginTop: '0.1rem' }}>
            <div>
              <span style={{ color: '#8d8d8d', fontSize: '0.58rem' }}>Avg Pos: </span>
              <strong style={{ color: '#f4f4f4', fontFamily: 'monospace' }}>
                {avgPrice > 0 ? `$${avgPrice.toFixed(2)} (${totalVolume.toFixed(2)}L)` : '---'}
              </strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Security size={11} style={{ color: trailingStopLevel != null ? '#f1c21b' : '#6f6f6f' }} />
              <span style={{ color: '#8d8d8d', fontSize: '0.58rem' }}>Trailing: </span>
              <strong style={{ color: trailingStopLevel != null ? '#f1c21b' : '#6f6f6f', fontFamily: 'monospace' }}>
                {trailingStopLevel != null ? `$${trailingStopLevel.toFixed(2)}` : 'OFF'}
              </strong>
            </div>
          </div>
        </div>

      </div>
    </Tile>
  );
}
