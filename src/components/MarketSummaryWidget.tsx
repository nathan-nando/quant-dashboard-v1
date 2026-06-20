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

const SESSIONS = [
  { name: 'Sydney', start: 22, end: 7 },
  { name: 'Tokyo', start: 0, end: 9 },
  { name: 'London', start: 7, end: 16 },
  { name: 'New York', start: 13, end: 22 }
];

export default function MarketSummaryWidget() {
  const { state } = useGlobalState();
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [now, setNow] = useState<Date>(new Date());

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
    
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    
    return () => { 
      isMounted = false; 
      clearInterval(timer);
    };
  }, []);

  const utcHour = now.getUTCHours();
  
  const checkActive = (start: number, end: number) => {
    if (start < end) return utcHour >= start && utcHour < end;
    return utcHour >= start || utcHour < end; // Crosses midnight
  };

  const currentPrice = state?.price?.last > 0 ? state?.price?.last : state?.price?.ask;
  const spread = state?.price?.ask && state?.price?.bid ? (state.price.ask - state.price.bid).toFixed(2) : '-';

  const dailyChange = (currentPrice && stats?.yesterday_close) ? currentPrice - stats.yesterday_close : 0;
  const dailyChangePct = (dailyChange && stats?.yesterday_close) ? (dailyChange / stats.yesterday_close) * 100 : 0;
  
  const dailyRange = (stats?.today_high && stats?.today_low) ? stats.today_high - stats.today_low : 0;

  const Metric = ({ label, value, color = '#f4f4f4', subValue = null, subColor = '' }: any) => (
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: '80px' }}>
      <span style={{ fontSize: '0.6rem', color: '#a8a8a8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.2rem' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0' }}>
        <span style={{ fontSize: '1.1rem', color, fontFamily: 'monospace', fontWeight: 600 }}>{value}</span>
        {subValue && <span style={{ fontSize: '0.75rem', color: subColor, fontFamily: 'monospace', fontWeight: 600 }}>{subValue}</span>}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', padding: '0.5rem 0.5rem', boxSizing: 'border-box', gap: '0', paddingLeft: '.75rem', justifyContent: 'flex-start' }}>
      
      {/* Left side: Price Details */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', paddingTop: '0', borderRight: '1px solid #393939', paddingRight: '0', width: 'fit-content', flexShrink: 0 }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, max-content)', rowGap: '0.5rem', columnGap: '1rem' }}>
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

      {/* Right side: Session Badges */}
      <div style={{ display: 'flex', alignItems: 'flex-start', paddingTop: '0', paddingLeft: '0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.2rem', alignItems: 'center' }}>
          {SESSIONS.map((s) => {
            const isActive = checkActive(s.start, s.end);
            return (
              <div 
                key={s.name}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.4rem 0.75rem',
                  border: `1px solid ${isActive ? '#0f62fe' : '#393939'}`,
                  background: isActive ? '#0f62fe' : 'transparent',
                  color: isActive ? '#ffffff' : '#8d8d8d',
                  transition: 'all 0.3s ease',
                  boxShadow: isActive ? '0 0 8px rgba(15, 98, 254, 0.3)' : 'none',
                  minWidth: '130px'
                }}
              >
                <span style={{ fontSize: '0.65rem', fontWeight: isActive ? 600 : 400, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {s.name}
                </span>
                <span style={{ fontSize: '0.65rem', fontFamily: 'monospace', opacity: isActive ? 1 : 0.7 }}>
                  {String(s.start).padStart(2, '0')}-{String(s.end).padStart(2, '0')}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      
    </div>
  );
}
