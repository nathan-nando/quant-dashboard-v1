import React, { useEffect, useState } from 'react';
import { Loading, Tag } from '@carbon/react';
import { API_BASE_URL } from '@/config/env';
import { useGlobalState } from '@/contexts/GlobalStateContext';

interface AttributionData {
  attribution_waterfall: { category: string; value: number }[];
  summary: { total_trades: number; win_rate: number; net_pnl: number; account_mode?: string; account_name?: string };
}

const AttributionPanel: React.FC = () => {
  const { state } = useGlobalState();
  const [data, setData] = useState<AttributionData | null>(null);
  const [loading, setLoading] = useState(true);

  const activeMode = state?.account_info?.mode;
  const activeLogin = state?.account_info?.login;

  useEffect(() => {
    fetch(`${API_BASE_URL}/attribution/`)
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch account summary data', err);
        setLoading(false);
      });
  }, [activeMode, activeLogin]);

  if (loading) return <div style={{ padding: '1rem' }}><Loading withOverlay={false} small /></div>;
  if (!data) return <div style={{ padding: '1rem', color: '#8d8d8d' }}>No account summary data</div>;

  const maxVal = Math.max(...data.attribution_waterfall.map(d => Math.abs(d.value)), 1);
  const accMode = data.summary.account_mode || activeMode || "DEMO";

  return (
    <div style={{ padding: '0.4rem 0.8rem', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', borderBottom: '1px solid #393939', paddingBottom: '0.35rem' }}>
        <div>
          <div style={{ fontSize: '0.7rem', color: '#a8a8a8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            Net PnL 
            <span style={{ 
              fontSize: '0.62rem', 
              padding: '1px 5px', 
              borderRadius: '2px', 
              backgroundColor: accMode === 'LIVE' ? '#24a148' : '#0f62fe', 
              color: '#fff', 
              fontWeight: 600 
            }}>
              {accMode}
            </span>
          </div>
          <div style={{ fontSize: '1.15rem', color: data.summary.net_pnl >= 0 ? '#24a148' : '#fa4d56', fontWeight: 600 }}>
            ${data.summary.net_pnl.toFixed(2)}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.7rem', color: '#a8a8a8' }}>Win Rate (Model)</div>
          <div style={{ fontSize: '1.15rem', color: '#f4f4f4', fontWeight: 600 }}>{data.summary.win_rate.toFixed(1)}%</div>
        </div>
      </div>
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem', justifyContent: 'center' }}>
        {data.attribution_waterfall.map((item, idx) => {
          const isPositive = item.value >= 0;
          const pct = (Math.abs(item.value) / maxVal) * 100;
          const color = isPositive ? '#4589ff' : '#fa4d56'; // Blue for positive components, Red for negative
          
          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ flex: '0 0 auto', minWidth: '85px', maxWidth: '120px', fontSize: '0.68rem', color: '#c6c6c6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.category}>
                {item.category}
              </div>
              <div style={{ flex: 1, height: '10px', background: '#262626', position: 'relative' }}>
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
              <div style={{ minWidth: '45px', textAlign: 'right', fontSize: '0.68rem', color: color, fontWeight: 600, flexShrink: 0 }}>
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
