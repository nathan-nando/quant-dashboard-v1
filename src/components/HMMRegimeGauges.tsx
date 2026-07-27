"use client";

import React, { useState, useEffect } from 'react';
import { ChartLine, Lightning, Scale, Warning } from '@carbon/icons-react';
import { API_BASE_URL } from '@/config/env';
import { useGlobalState } from '@/contexts/GlobalStateContext';

interface GaugeProps {
  value: string | number;
  label: string;
  sublabel?: string;
  color?: string;
  icon?: React.ComponentType<any>;
}

const ValueGauge: React.FC<GaugeProps> = ({ value, label, sublabel, color = "#0f62fe", icon: Icon }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, minWidth: 0, padding: '0.2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '0.2rem' }}>
        {Icon && <Icon size={14} color={color} />}
        <span style={{ fontSize: '0.7rem', color: '#a8a8a8', fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#ffffff' }}>
        {value}
      </div>
      {sublabel && (
        <span style={{ fontSize: '0.65rem', color: color, marginTop: '0.15rem' }}>{sublabel}</span>
      )}
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

  const getBiasColor = (b: string) => {
    if (b.includes("BULLISH")) return "#24a148";
    if (b.includes("BEARISH")) return "#da1e28";
    return "#f1c21b";
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', width: '100%', height: '100%', padding: '0.35rem 0' }}>
      <ValueGauge value={bias.split(" ")[0]} label="Macro Bias" sublabel={bias.split(" ")[1] || ""} color={getBiasColor(bias)} icon={Lightning} />
      <ValueGauge value={`${(weight * 100).toFixed(0)}%`} label="Macro Weight" sublabel={weight >= 0 ? "Bullish Alignment" : "Bearish Alignment"} color={weight >= 0 ? "#24a148" : "#da1e28"} icon={ChartLine} />
      <ValueGauge value={buyThresh} label="BUY Thresh" sublabel="Soft Switched" color="#24a148" icon={Scale} />
      <ValueGauge value={sellThresh} label="SELL Thresh" sublabel="Soft Switched" color="#da1e28" icon={Scale} />
    </div>
  );
}
