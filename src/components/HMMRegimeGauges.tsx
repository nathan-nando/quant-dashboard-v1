"use client";

import React, { useState, useEffect } from 'react';
import { ChartLine, Lightning, Scale, Globe } from '@carbon/icons-react';
import { API_BASE_URL } from '@/config/env';
import { useGlobalState } from '@/contexts/GlobalStateContext';

interface RadialGaugeProps {
  pct: number; // 0 to 100
  label: string;
  valueStr: string;
  color: string;
  sublabel?: string;
  icon?: React.ComponentType<any>;
  isHighlighted?: boolean;
}

const RadialGauge: React.FC<RadialGaugeProps> = ({ pct, label, valueStr, color, sublabel, icon: Icon, isHighlighted }) => {
  const r = 22;
  const stroke = 4.5;
  const circ = 2 * Math.PI * r;
  const clampedPct = Math.max(0, Math.min(100, pct));
  const strokeDashoffset = circ - (clampedPct / 100) * circ;

  return (
    <div style={{ 
      flex: 1, 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'transparent',
      padding: '0.4rem 0.1rem',
      height: '100%',
      transition: 'all 0.4s ease'
    }}>
      {/* Gauge Ring */}
      <div style={{ position: 'relative', width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="52" height="52" style={{ transform: 'rotate(-90deg)' }}>
          {/* Background Track Ring */}
          <circle cx="26" cy="26" r={r} fill="none" stroke="#262626" strokeWidth={stroke} />
          {/* Active Colored Ring */}
          <circle
            cx="26"
            cy="26"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={circ}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.6s ease-out, stroke 0.4s ease' }}
          />
        </svg>
        {/* Center Text or Icon */}
        <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {Icon ? (
            <Icon size={18} color={color} />
          ) : (
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f4f4f4' }}>
              {valueStr}
            </span>
          )}
        </div>
      </div>

      {/* Label */}
      <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#f4f4f4', marginTop: '0.25rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
        {label}
      </div>

      {/* Sublabel */}
      <div style={{ fontSize: '0.62rem', color: color, fontWeight: 500, textAlign: 'center', marginTop: '0.1rem' }}>
        {sublabel || valueStr}
      </div>
    </div>
  );
};

export default function HMMRegimeGauges() {
  const { state } = useGlobalState();
  const [macroData, setMacroData] = useState<any>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/dashboard/regime/probabilities`)
      .then(res => res.json())
      .then(data => setMacroData(data))
      .catch(err => console.error("Error fetching Macro state:", err));
  }, []);

  const data = macroData || state?.macro_state || {};
  const bias = data.macro_bias || "NEUTRAL SIDEWAYS";
  const weight = data.macro_weight !== undefined ? data.macro_weight : 0.0;
  const buyThresh = data.buy_threshold !== undefined ? data.buy_threshold : 0.50;
  const sellThresh = data.sell_threshold !== undefined ? data.sell_threshold : 0.50;
  const isMacroActive = state?.use_macro_model !== undefined ? Boolean(state.use_macro_model) : true;

  const getBiasColor = (b: string) => {
    if (b.includes("BULLISH")) return "#24a148";
    if (b.includes("BEARISH")) return "#da1e28";
    return "#f1c21b";
  };

  const biasColor = getBiasColor(bias);
  const isBearish = weight < -0.10;
  const isBullish = weight > 0.10;
  
  const weightColor = isBullish ? "#24a148" : (isBearish ? "#da1e28" : "#f1c21b");
  const weightPct = Math.abs(weight) * 100; // Ring fills according to absolute strength 0-100%

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      width: '100%', 
      height: '100%', 
      padding: '0.3rem 0.2rem',
      gap: '0.25rem'
    }}>
      {/* Gauge 0: Macro Gating Status */}
      <RadialGauge 
        pct={isMacroActive ? 100 : 0} 
        label="Macro Gating" 
        valueStr={isMacroActive ? "ACTIVE" : "OFF"} 
        sublabel={isMacroActive ? "Engine Veto Active" : "Informational Only"} 
        color={isMacroActive ? "#24a148" : "#8d8d8d"} 
        icon={Globe} 
      />

      {/* Gauge 1: Macro Bias */}
      <RadialGauge 
        pct={100} 
        label="Macro Bias" 
        valueStr={bias.split(" ")[0]} 
        sublabel={bias} 
        color={biasColor} 
        icon={Lightning} 
      />

      {/* Gauge 2: Macro Weight (Bearish Red / Bullish Green Ring, clean positive magnitude) */}
      <RadialGauge 
        pct={weightPct} 
        label="Macro Weight" 
        valueStr={`${Math.abs(Math.round(weight * 100))}%`} 
        sublabel={isBullish ? "Bullish Alignment" : (isBearish ? "Bearish Alignment" : "Neutral Alignment")} 
        color={weightColor} 
      />

      {/* Gauge 3: BUY Threshold */}
      <RadialGauge 
        pct={buyThresh * 100} 
        label="BUY Threshold" 
        valueStr={`${(buyThresh * 100).toFixed(1)}%`} 
        sublabel={!isMacroActive ? "Disabled (Fixed 50%)" : (isBullish ? "Favored (Easier)" : (isBearish ? "Hurdle Raised" : "Standard 50%"))} 
        color={!isMacroActive ? "#6f6f6f" : (isBullish ? "#24a148" : "#8d8d8d")} 
        isHighlighted={isMacroActive && isBullish}
      />

      {/* Gauge 4: SELL Threshold */}
      <RadialGauge 
        pct={sellThresh * 100} 
        label="SELL Threshold" 
        valueStr={`${(sellThresh * 100).toFixed(1)}%`} 
        sublabel={!isMacroActive ? "Disabled (Fixed 50%)" : (isBearish ? "Favored (Easier)" : (isBullish ? "Hurdle Raised" : "Standard 50%"))} 
        color={!isMacroActive ? "#6f6f6f" : (isBearish ? "#da1e28" : "#8d8d8d")} 
        isHighlighted={isMacroActive && isBearish}
      />
    </div>
  );
}
