"use client";

import React, { useEffect, useState } from 'react';
import { useGlobalState } from '../contexts/GlobalStateContext';

export default function MarketClock() {
  const [now, setNow] = useState<Date | null>(null);
  const { state } = useGlobalState();

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!now) return <div style={{ flex: 1 }} />;

  const formatTime = (d: Date, timeZone: string) => {
    return d.toLocaleTimeString('en-US', { timeZone, hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Market Open/Close logic roughly based on UTC time (Gold is closed Friday 21:00 UTC to Sunday 21:00 UTC)
  const isMarketOpen = () => {
    const day = now.getUTCDay();
    const hour = now.getUTCHours();
    if (day === 6) return false; // Saturday
    if (day === 5 && hour >= 21) return false; // Friday after 21:00 UTC
    if (day === 0 && hour < 21) return false; // Sunday before 21:00 UTC
    return true;
  };

  const marketStatus = isMarketOpen() ? 'OPEN' : 'CLOSED';
  const marketColor = isMarketOpen() ? '#24a148' : '#fa4d56';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
      {/* Live Price with merged Market Status */}
      {state?.price && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', lineHeight: 1 }}>
            <span style={{ display: 'inline-block', width: '5px', height: '5px', borderRadius: '50%', backgroundColor: marketColor }} />
            <span style={{ color: '#a8a8a8', fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              XAUUSD ({marketStatus})
            </span>
          </div>
          <span style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '1rem', color: '#ffffff', marginTop: '0.15rem', lineHeight: 1 }}>
            {state.price.last > 0 ? state.price.last.toFixed(2) : state.price.ask?.toFixed(2)}
          </span>
        </div>
      )}

      {/* Time Display */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', lineHeight: 1 }}>
          <span style={{ color: '#a8a8a8', fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>UTC</span>
          <span style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.75rem', color: '#f4f4f4' }}>{formatTime(now, 'UTC')}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', lineHeight: 1 }}>
          <span style={{ color: '#a8a8a8', fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>WIB</span>
          <span style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.75rem', color: '#4589ff' }}>{formatTime(now, 'Asia/Jakarta')}</span>
        </div>
      </div>
    </div>
  );
}
