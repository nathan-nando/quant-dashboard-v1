"use client";

import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config/env';

interface CircleGaugeProps {
  value: number;
  color: string;
  label: string;
}

const CircleGauge: React.FC<CircleGaugeProps> = ({ value, color, label }) => {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, minWidth: 0 }}>
      <div style={{ position: 'relative', width: '58px', height: '58px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="58" height="58" viewBox="0 0 58 58" style={{ transform: 'rotate(-90deg)' }}>
          {/* Track Circle */}
          <circle cx="29" cy="29" r={radius} fill="transparent" stroke="#555555" strokeWidth="3.5" />
          {/* Progress Circle */}
          <circle
            cx="29"
            cy="29"
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth="3.5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.35s' }}
          />
        </svg>
        {/* Center Value */}
        <div style={{ position: 'absolute', fontSize: '0.75rem', fontWeight: 'bold', color: '#ffffff' }}>
          {value}%
        </div>
      </div>
      {/* Label below */}
      <div style={{ fontSize: '0.65rem', color: '#c6c6c6', marginTop: '0.3rem', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }} title={label}>
        {label}
      </div>
    </div>
  );
};

export default function HMMRegimeGauges() {
  const [probs, setProbs] = useState<any>(null);

  useEffect(() => {
    const fetchProbs = () => {
      fetch(`${API_BASE_URL}/dashboard/regime/probabilities`)
        .then(res => res.json())
        .then(data => setProbs(data))
        .catch(err => console.error("Error fetching HMM probs:", err));
    };
    fetchProbs();
    const interval = setInterval(fetchProbs, 5000);
    return () => clearInterval(interval);
  }, []);

  const lowVolPct = probs ? Math.round((probs.State_0 || 0) * 100) : 0;
  const highVolPct = probs ? Math.round((probs.State_1 || 0) * 100) : 0;
  const meanrevPct = probs ? Math.round((probs.State_2 || 0) * 100) : 0;
  const volatilePct = probs ? Math.round((probs.State_3 || 0) * 100) : 0;

  return (
    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', width: '100%', height: '100%', padding: '0.35rem 0' }}>
      <CircleGauge value={lowVolPct} color="#ffffff" label="Low Vol" />
      <CircleGauge value={highVolPct} color="#ffffff" label="High Vol" />
      <CircleGauge value={meanrevPct} color="#ffffff" label="Mean Rev" />
      <CircleGauge value={volatilePct} color="#ffffff" label="Chop/Crisis" />
    </div>
  );
}
