import React from 'react';
import { Grid, Column, Tile } from '@carbon/react';

interface RegimeBreakdownProps {
  regimeStats: Record<string, { trades: number; win_rate: number; total_pnl: number }>;
  models?: Record<string, string>;
}

export default function RegimeBreakdown({ regimeStats, models }: RegimeBreakdownProps) {
  // Define colors for each regime to match the rest of the application
  const regimeColors: Record<string, string> = {
    'TREND_BULL': '#24a148',    // Green
    'TREND_BEAR': '#fa4d56',    // Red
    'MEAN_REVERTING': '#0f62fe', // Blue
    'VOLATILE_CHOP': '#f1c21b',  // Yellow
  };

  const formatRegimeName = (name: string) => {
    return name.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
  };

  const ALL_REGIMES = ['TREND_BULL', 'TREND_BEAR', 'MEAN_REVERTING', 'VOLATILE_CHOP'];
  const safeStats = regimeStats || {};

  // Find max values for progress bars
  const maxTrades = Math.max(...ALL_REGIMES.map(r => safeStats[r]?.trades || 0), 1);
  const maxAbsPnl = Math.max(...ALL_REGIMES.map(r => Math.abs(safeStats[r]?.total_pnl || 0)), 1);

  return (
    <Grid style={{ padding: 0, margin: 0 }}>
      {ALL_REGIMES.map((regime) => {
        const stats = safeStats[regime] || { trades: 0, win_rate: 0, total_pnl: 0 };
        const modelName = models?.[regime];
        let readableModelText = '';
        if (modelName && modelName !== 'NONE') {
          const words = modelName.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
          readableModelText = words.join(' ');
        }

        return (
          <Column key={regime} lg={8} md={4} sm={4} style={{ marginBottom: '1rem' }}>
            <Tile style={{ borderLeft: `4px solid ${regimeColors[regime] || '#8d8d8d'}` }}>
              <h5 style={{ 
                marginBottom: '1rem', 
                fontSize: '0.85rem', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                gap: '6px', 
                flexWrap: 'nowrap',
                overflow: 'hidden',
                whiteSpace: 'nowrap'
              }}>
                <span style={{ fontWeight: 600 }}>{formatRegimeName(regime)}</span>
                {readableModelText && (
                  <div style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '3px', 
                    flexShrink: 0 
                  }}>
                    <svg width="10" height="10" viewBox="0 0 32 32" style={{ fill: '#4589ff', flexShrink: 0 }}>
                      <path d="M26,8V6a2,2,0,0,0-2-2H22V2H20V4H18V2H16V4H14V2H12V4H10V2H8V4H6A2,2,0,0,0,4,6V8H2v2H4v2H2v2H4v2H2v2H4v2H2v2H4v2H2v2H4v2A2,2,0,0,0,6,28H8v2h2V28h2v2h2V28h2v2h2V28h2v2h2V28h2A2,2,0,0,0,28,26V24h2V22H28V20h2V18H28V16h2V14H28V12h2V10H28V8ZM26,26H6V6H26Z" />
                      <rect x="10" y="10" width="12" height="12" />
                    </svg>
                    <span style={{ color: '#c6c6c6', fontWeight: 'bold', fontSize: '9px', whiteSpace: 'nowrap' }}>
                      {readableModelText}
                    </span>
                  </div>
                )}
              </h5>
              
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.875rem', color: '#c6c6c6' }}>Win Rate</span>
                  <span style={{ fontWeight: 'bold' }}>{(stats.win_rate * 100).toFixed(1)}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#393939', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${stats.win_rate * 100}%`, height: '100%', backgroundColor: stats.win_rate >= 0.5 ? '#24a148' : '#fa4d56' }} />
                </div>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.875rem', color: '#c6c6c6' }}>Trades</span>
                  <span>{stats.trades}</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#393939', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${(stats.trades / maxTrades) * 100}%`, height: '100%', backgroundColor: '#0f62fe' }} />
                </div>
              </div>
              
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.875rem', color: '#c6c6c6' }}>Net PnL</span>
                  <span style={{ color: stats.total_pnl > 0 ? '#24a148' : stats.total_pnl < 0 ? '#fa4d56' : '#c6c6c6', fontWeight: 'bold' }}>
                    {stats.total_pnl > 0 ? '+' : ''}${stats.total_pnl.toFixed(2)}
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#393939', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${(Math.abs(stats.total_pnl) / maxAbsPnl) * 100}%`, 
                    height: '100%', 
                    backgroundColor: stats.total_pnl >= 0 ? '#24a148' : '#fa4d56' 
                  }} />
                </div>
              </div>
            </Tile>
          </Column>
        );
      })}
    </Grid>
  );
}
