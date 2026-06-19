import React from 'react';
import { Grid, Column, Tile } from '@carbon/react';

interface RegimeBreakdownProps {
  regimeStats: Record<string, { trades: number; win_rate: number; total_pnl: number }>;
}

export default function RegimeBreakdown({ regimeStats }: RegimeBreakdownProps) {
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
        return (
          <Column key={regime} lg={8} md={4} sm={4} style={{ marginBottom: '1rem' }}>
            <Tile style={{ borderLeft: `4px solid ${regimeColors[regime] || '#8d8d8d'}` }}>
              <h5 style={{ marginBottom: '1rem', fontSize: '1rem' }}>{formatRegimeName(regime)}</h5>
              
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
