import React, { useEffect, useState } from 'react';
import { Loading } from '@carbon/react';

interface AttributionData {
  attribution_waterfall: { category: string; value: number }[];
  summary: { total_trades: number; win_rate: number; net_pnl: number };
}

const AttributionPanel: React.FC = () => {
  const [data, setData] = useState<AttributionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/attribution/')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch attribution data', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ padding: '1rem' }}><Loading withOverlay={false} small /></div>;
  if (!data) return <div style={{ padding: '1rem', color: '#8d8d8d' }}>No attribution data</div>;

  const maxVal = Math.max(...data.attribution_waterfall.map(d => Math.abs(d.value)), 1);

  return (
    <div style={{ padding: '0.5rem 1rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #393939', paddingBottom: '0.5rem' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#a8a8a8' }}>Net PnL</div>
          <div style={{ fontSize: '1.25rem', color: data.summary.net_pnl >= 0 ? '#24a148' : '#fa4d56' }}>
            ${data.summary.net_pnl.toFixed(2)}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: '#a8a8a8' }}>Win Rate (Model)</div>
          <div style={{ fontSize: '1.25rem', color: '#f4f4f4' }}>{data.summary.win_rate.toFixed(1)}%</div>
        </div>
      </div>
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'center' }}>
        {data.attribution_waterfall.map((item, idx) => {
          const isPositive = item.value >= 0;
          const pct = (Math.abs(item.value) / maxVal) * 100;
          const color = isPositive ? '#4589ff' : '#fa4d56'; // Blue for positive components, Red for negative
          
          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '130px', fontSize: '0.75rem', color: '#c6c6c6' }}>{item.category}</div>
              <div style={{ flex: 1, height: '12px', background: '#262626', position: 'relative' }}>
                <div style={{ 
                  position: 'absolute', 
                  top: 0, 
                  bottom: 0, 
                  left: isPositive ? 0 : 'auto', 
                  right: isPositive ? 'auto' : 0, 
                  width: `${pct}%`, 
                  background: color 
                }} />
              </div>
              <div style={{ width: '60px', textAlign: 'right', fontSize: '0.75rem', color: color, fontWeight: 600 }}>
                {isPositive ? '+$' : '-$'}{Math.abs(item.value).toFixed(2)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AttributionPanel;
