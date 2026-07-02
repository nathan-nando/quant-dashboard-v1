"use client";

import React from 'react';
import { useGlobalState } from '../contexts/GlobalStateContext';

interface CircleGaugeProps {
  value: number;
  color: string;
  label: string;
}

const CircleGauge: React.FC<CircleGaugeProps> = ({ value, color, label }) => {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

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
            stroke={color}
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
      <div style={{ fontSize: '0.7rem', color: '#c6c6c6', marginTop: '0.35rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
        {label}
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

  return (
    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', width: '100%', height: '100%', padding: '0.35rem 0' }}>
      <CircleGauge value={trendPct} color="#ffffff" label="Trend Expert" />
      <CircleGauge value={meanrevPct} color="#ffffff" label="Mean Reverting" />
      <CircleGauge value={macroPct} color="#ffffff" label="Macro Expert" />
    </div>
  );
}
