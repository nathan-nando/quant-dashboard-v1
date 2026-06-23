"use client";

import React, { useEffect, useState } from 'react';
import { useGlobalState } from '../contexts/GlobalStateContext';

interface DailyStats {
  yesterday_close: number;
  today_open: number;
  today_high: number;
  today_low: number;
  today_volume: number;
  atr_14: number;
}

export default function MarketSummaryWidget() {
  const { state } = useGlobalState();
  const [stats, setStats] = useState<DailyStats | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/dashboard/daily_stats?symbol=XAUUSD");
        if (!res.ok) throw new Error("Failed to fetch daily stats");
        const data = await res.json();
        if (isMounted && data && data.today_open) {
          setStats(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
    
    return () => { 
      isMounted = false; 
    };
  }, []);

  const currentPrice = state?.price?.last > 0 ? state?.price?.last : state?.price?.ask;
  const spread = state?.price?.ask && state?.price?.bid ? (state.price.ask - state.price.bid).toFixed(2) : '-';

  const dailyChange = (currentPrice && stats?.yesterday_close) ? currentPrice - stats.yesterday_close : 0;
  const dailyChangePct = (dailyChange && stats?.yesterday_close) ? (dailyChange / stats.yesterday_close) * 100 : 0;
  
  const dailyRange = (stats?.today_high && stats?.today_low) ? stats.today_high - stats.today_low : 0;

  const Metric = ({ label, value, color = '#f4f4f4', subValue = null, subColor = '' }: any) => (
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 'auto' }}>
      <span style={{ fontSize: '0.58rem', color: '#a8a8a8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.1rem' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.05rem' }}>
        <span style={{ fontSize: '0.75rem', color, fontFamily: 'monospace', fontWeight: 600 }}>{value}</span>
        {subValue && <span style={{ fontSize: '0.55rem', color: subColor, fontFamily: 'monospace', fontWeight: 600 }}>{subValue}</span>}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', padding: '0', boxSizing: 'border-box', gap: '0', justifyContent: 'flex-start' }}>
      
      {/* Price Details */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', paddingTop: '0', width: '100%', flexShrink: 0 }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', rowGap: '0.35rem', columnGap: '0.5rem', width: '100%' }}>
          <Metric 
            label="Daily Change" 
            value={`${dailyChange >= 0 ? '+' : ''}${dailyChange.toFixed(2)}`} 
            color={dailyChange >= 0 ? '#24a148' : '#fa4d56'}
            subValue={`(${dailyChange >= 0 ? '+' : ''}${dailyChangePct.toFixed(2)}%)`}
            subColor={dailyChange >= 0 ? '#24a148' : '#fa4d56'}
          />
          <Metric label="Daily Range" value={dailyRange > 0 ? dailyRange.toFixed(2) : '---'} color="#f1c21b" />
          <Metric label="ATR (14)" value={stats?.atr_14 ? stats.atr_14.toFixed(2) : '---'} color="#4589ff" />
          <Metric label="Volume" value={stats?.today_volume?.toLocaleString() || '---'} />
          <Metric label="Spread" value={spread} />

          <Metric label="Prev Close" value={stats?.yesterday_close?.toFixed(2) || '---'} color="#c6c6c6" />
          <Metric label="Open" value={stats?.today_open?.toFixed(2) || '---'} color="#c6c6c6" />
          <Metric label="High" value={stats?.today_high?.toFixed(2) || '---'} color="#24a148" />
          <Metric label="Low" value={stats?.today_low?.toFixed(2) || '---'} color="#fa4d56" />
        </div>

      </div>
      
    </div>
  );
}
