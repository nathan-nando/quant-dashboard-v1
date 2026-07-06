"use client";

import React from 'react';
import { ChartLine, Renew, Globe } from '@carbon/icons-react';
import { useGlobalState } from '../contexts/GlobalStateContext';

interface CircleGaugeProps {
  value: number;
  color: string;
  label: string;
  icon?: React.ComponentType<any>;
  isDominant?: boolean;
}

const CircleGauge: React.FC<CircleGaugeProps> = ({ value, color, label, icon: Icon, isDominant }) => {
  const radius = 28;
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
      <div style={{ position: 'relative', width: '68px', height: '68px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="68" height="68" viewBox="0 0 68 68" style={{ transform: 'rotate(-90deg)' }}>
          {/* Track Circle */}
          <circle cx="34" cy="34" r={radius} fill="transparent" stroke="#555555" strokeWidth="4.5" />
          {/* Progress Circle */}
          <circle
            cx="34"
            cy="34"
            r={radius}
            fill="transparent"
            stroke={strokeColor}
            strokeWidth="4.5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.35s' }}
          />
        </svg>
        {/* Center Value */}
        <div style={{ position: 'absolute', fontSize: '0.85rem', fontWeight: 'bold', color: '#ffffff' }}>
          {value}%
        </div>
      </div>
      {/* Label below */}
      <div 
        style={{ 
          fontSize: '0.7rem', 
          color: isDominant ? '#ffffff' : '#8d8d8d', 
          fontWeight: isDominant ? 'bold' : 'normal',
          marginTop: '0.35rem', 
          display: 'inline-flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '4px',
          whiteSpace: 'nowrap' 
        }}
      >
        {Icon && <Icon size={13} color={isDominant ? '#e0e0e0' : '#757575'} style={{ flexShrink: 0 }} />}
        <span>{label}</span>
      </div>
    </div>
  );
};

export default function MoEEnsembleGauges() {
  const { state } = useGlobalState();
  const weights = state?.moe_weights || { trend: 0.0, meanrev: 0.0, macro: 0.0 };

  const trendPct = Math.round((weights.trend || 0) * 100);
  const meanrevPct = Math.round((weights.meanrev || 0) * 100);
  const macroPct = Math.round((weights.macro || 0) * 100);

  const maxVal = Math.max(trendPct, meanrevPct, macroPct);

  return (
    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', width: '100%', height: '100%', padding: '0.35rem 0' }}>
      <CircleGauge value={trendPct} color="#ffffff" label="Trend Expert" icon={ChartLine} isDominant={trendPct === maxVal && maxVal > 0} />
      <CircleGauge value={meanrevPct} color="#ffffff" label="Mean Reverting" icon={Renew} isDominant={meanrevPct === maxVal && maxVal > 0} />
      <CircleGauge value={macroPct} color="#ffffff" label="Macro Expert" icon={Globe} isDominant={macroPct === maxVal && maxVal > 0} />
    </div>
  );
}
