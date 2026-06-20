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

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
      {/* Live Price */}
      {state?.price && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <span style={{ color: '#a8a8a8', fontSize: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Price</span>
          <span style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '1rem', color: '#ffffff' }}>
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
