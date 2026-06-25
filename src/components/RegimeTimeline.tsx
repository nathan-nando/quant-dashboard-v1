import React, { useEffect, useState } from 'react';
import { Loading } from '@carbon/react';
import { API_BASE_URL } from '@/config/env';

interface TimelineItem {
  timestamp: string;
  regime: string;
  direction: string;
}

const getRegimeColor = (regime: string) => {
  switch (regime) {
    case 'TREND_BULL': return '#24a148'; // Green
    case 'TREND_BEAR': return '#fa4d56'; // Red
    case 'VOLATILE_CHOP': return '#f1c21b'; // Yellow
    case 'MEAN_REVERTING': return '#4589ff'; // Blue
    default: return '#8d8d8d';
  }
};

const RegimeTimeline: React.FC = () => {
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/attribution/`)
      .then(res => res.json())
      .then(d => {
        setTimeline(d.regime_timeline || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch timeline', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ padding: '1rem' }}><Loading withOverlay={false} small /></div>;
  if (timeline.length === 0) return <div style={{ padding: '1rem', color: '#8d8d8d' }}>No timeline data</div>;

  return (
    <div style={{ padding: '0.5rem 1rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: '0.875rem', color: '#c6c6c6', marginBottom: '1rem' }}>
        Historical Regime Timeline (Last 50 Signals)
      </div>
      
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        <div style={{ display: 'flex', height: '30px', width: '100%', minWidth: '400px' }}>
          {timeline.map((item, idx) => {
            const color = getRegimeColor(item.regime);
            return (
              <div 
                key={idx} 
                style={{
                  flex: 1,
                  background: color,
                  borderRight: idx < timeline.length - 1 ? '1px solid #161616' : 'none',
                  opacity: 0.85,
                  position: 'relative'
                }}
                title={`${new Date(item.timestamp).toLocaleString()} - ${item.regime} (${item.direction})`}
              >
                {/* Tick mark for signal direction */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '4px',
                  height: '10px',
                  background: item.direction === 'BUY' ? '#fff' : item.direction === 'SELL' ? '#000' : 'transparent',
                  borderRadius: '2px',
                  opacity: 0.6
                }} />
              </div>
            );
          })}
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.65rem', color: '#a8a8a8', justifyContent: 'center', marginTop: 'auto' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <div style={{ width: 8, height: 8, background: '#24a148' }} /> Bull
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <div style={{ width: 8, height: 8, background: '#fa4d56' }} /> Bear
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <div style={{ width: 8, height: 8, background: '#4589ff' }} /> Mean Reverting
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <div style={{ width: 8, height: 8, background: '#f1c21b' }} /> Volatile
        </span>
      </div>
    </div>
  );
};

export default RegimeTimeline;
