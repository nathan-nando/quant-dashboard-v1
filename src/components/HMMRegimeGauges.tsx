"use client";

import React, { useState, useEffect } from 'react';
import { RainDrop, Lightning, Renew, Tornado } from '@carbon/icons-react';
import { API_BASE_URL } from '@/config/env';
import { useGlobalState } from '@/contexts/GlobalStateContext';

interface CircleGaugeProps {
  value: number;
  color: string;
  label: string;
  icon?: React.ComponentType<any>;
  isDominant?: boolean;
}

const CircleGauge: React.FC<CircleGaugeProps> = ({ value, color, label, icon: Icon, isDominant }) => {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  // Dynamic white levels: from white approaching gray, slightly bright white, to bright white
  let strokeColor = 'rgba(255, 255, 255, 0.3)'; // Low level: white approaching gray
  if (value > 70) {
    strokeColor = 'rgba(255, 255, 255, 1.0)'; // High level: bright white
  } else if (value > 30) {
    strokeColor = 'rgba(255, 255, 255, 0.65)'; // Medium level: slightly bright white
  }

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
            stroke={strokeColor}
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
      <div 
        style={{ 
          fontSize: '0.65rem', 
          color: isDominant ? '#ffffff' : '#8d8d8d', 
          fontWeight: isDominant ? 'bold' : 'normal',
          marginTop: '0.35rem', 
          display: 'inline-flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '4px',
          whiteSpace: 'nowrap', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          width: '100%' 
        }} 
        title={label}
      >
        {Icon && <Icon size={12} color={isDominant ? '#e0e0e0' : '#757575'} style={{ flexShrink: 0 }} />}
        <span>{label}</span>
      </div>
    </div>
  );
};

export default function HMMRegimeGauges() {
  const { state } = useGlobalState();
  const [initialProbs, setInitialProbs] = useState<any>(null);

  useEffect(() => {
    // Fetch initial probabilities once on mount as fallback before SSE updates arrive
    fetch(`${API_BASE_URL}/dashboard/regime/probabilities`)
      .then(res => res.json())
      .then(data => setInitialProbs(data))
      .catch(err => console.error("Error fetching HMM probs:", err));
  }, []);

  const probs = state?.hmm_probs || initialProbs;

  const lowVolPct = probs ? Math.round((probs.State_0 || 0) * 100) : 0;
  const highVolPct = probs ? Math.round((probs.State_1 || 0) * 100) : 0;
  const meanrevPct = probs ? Math.round((probs.State_2 || 0) * 100) : 0;
  const volatilePct = probs ? Math.round((probs.State_3 || 0) * 100) : 0;

  const maxVal = Math.max(lowVolPct, highVolPct, meanrevPct, volatilePct);

  return (
    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', width: '100%', height: '100%', padding: '0.35rem 0' }}>
      <CircleGauge value={lowVolPct} color="#ffffff" label="Low Vol" icon={RainDrop} isDominant={lowVolPct === maxVal && maxVal > 0} />
      <CircleGauge value={highVolPct} color="#ffffff" label="High Vol" icon={Lightning} isDominant={highVolPct === maxVal && maxVal > 0} />
      <CircleGauge value={meanrevPct} color="#ffffff" label="Mean Rev" icon={Renew} isDominant={meanrevPct === maxVal && maxVal > 0} />
      <CircleGauge value={volatilePct} color="#ffffff" label="Chop/Crisis" icon={Tornado} isDominant={volatilePct === maxVal && maxVal > 0} />
    </div>
  );
}
