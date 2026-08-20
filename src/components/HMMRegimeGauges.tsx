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

interface VerticalMacroStepperProps {
  currentBias: string;
}

const STEPS = [
  { key: "STRONG BULLISH", label: "STRONG BULLISH", color: "#24a148" },
  { key: "MODERATE BULLISH", label: "MODERATE BULLISH", color: "#42be65" },
  { key: "NEUTRAL SIDEWAYS", label: "NEUTRAL SIDEWAYS", color: "#f1c21b" },
  { key: "MODERATE BEARISH", label: "MODERATE BEARISH", color: "#ff8389" },
  { key: "STRONG BEARISH", label: "STRONG BEARISH", color: "#da1e28" },
];

const VerticalMacroStepper: React.FC<VerticalMacroStepperProps> = ({ currentBias }) => {
  const normalizedBias = (currentBias || "NEUTRAL SIDEWAYS").toUpperCase();

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'flex-start', 
      justifyContent: 'center', 
      padding: '0.2rem 0.6rem',
      position: 'relative',
      height: '100%',
      minWidth: '145px'
    }}>
      
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '5px', width: '100%' }}>
        {/* Solid White Vertical Connecting Line */}
        <div style={{ 
          position: 'absolute', 
          left: '6px', 
          top: '6px', 
          bottom: '6px', 
          width: '2px', 
          background: 'rgba(255, 255, 255, 0.45)', 
          zIndex: 1 
        }} />

        {STEPS.map((step) => {
          const isActive = normalizedBias.includes(step.key) || (step.key === "NEUTRAL SIDEWAYS" && normalizedBias.includes("NEUTRAL"));
          return (
            <div key={step.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', zIndex: 2 }}>
              {/* Colored Dot (Line is white, only active dot is colored) */}
              <div style={{ 
                width: '14px', 
                height: '14px', 
                borderRadius: '50%', 
                background: isActive ? step.color : '#161616', 
                border: isActive ? `2px solid ${step.color}` : '2px solid rgba(255, 255, 255, 0.5)', 
                boxShadow: isActive ? `0 0 10px ${step.color}` : 'none', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                transition: 'all 0.3s ease',
                flexShrink: 0
              }}>
                {isActive && (
                  <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#ffffff' }} />
                )}
              </div>
              {/* Step Label */}
              <span style={{ 
                fontSize: '0.62rem', 
                fontWeight: isActive ? 700 : 500, 
                color: isActive ? step.color : '#8d8d8d', 
                letterSpacing: '0.3px',
                transition: 'all 0.3s ease',
                whiteSpace: 'nowrap'
              }}>
                {step.label}
              </span>
            </div>
          );
        })}
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

  const isBearish = weight < -0.10;
  const isBullish = weight > 0.10;
  
  const weightColor = isBullish ? "#24a148" : (isBearish ? "#da1e28" : "#f1c21b");
  const weightPct = Math.abs(weight) * 100; // Ring fills according to absolute strength 0-100%

  return (
    <div className="regime-gauges-container">
      {/* Gauge 1: Vertical Macro Bias Stepper Line */}
      <div className="regime-top-group">
        <VerticalMacroStepper currentBias={bias} />
      </div>

      {/* Radial Gauges Group: Macro Weight, BUY Threshold, SELL Threshold */}
      <div className="regime-radial-group">
        {/* Gauge 2: Macro Weight */}
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
          sublabel={isBullish ? "Favored (Easier)" : (isBearish ? "Hurdle Raised" : "Standard 50%")} 
          color={isBullish ? "#24a148" : "#8d8d8d"} 
          isHighlighted={isBullish}
        />

        {/* Gauge 4: SELL Threshold */}
        <RadialGauge 
          pct={sellThresh * 100} 
          label="SELL Threshold" 
          valueStr={`${(sellThresh * 100).toFixed(1)}%`} 
          sublabel={isBearish ? "Favored (Easier)" : (isBullish ? "Hurdle Raised" : "Standard 50%")} 
          color={isBearish ? "#da1e28" : "#8d8d8d"} 
          isHighlighted={isBearish}
        />
      </div>
    </div>
  );
}
