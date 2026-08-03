"use client";

import React from 'react';
import { Lightning, MachineLearningModel, Security } from '@carbon/icons-react';

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
      <div style={{ fontSize: '1.0rem', fontWeight: 'bold', color: '#ffffff' }}>
        {value}
      </div>
      {sublabel && (
        <span style={{ fontSize: '0.65rem', color: color, marginTop: '0.15rem' }}>{sublabel}</span>
      )}
    </div>
  );
};

export default function MoEEnsembleGauges() {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', width: '100%', height: '100%', padding: '0.35rem 0' }}>
      <ValueGauge value="LightGBM ONNX" label="Engine Model" sublabel="M5 Triple Barrier" color="#0f62fe" icon={MachineLearningModel} />
      <ValueGauge value="Soft Switch" label="Macro Gating" sublabel="Continuous Dynamic" color="#24a148" icon={Lightning} />
      <ValueGauge value="Active" label="Risk Shield" sublabel="Max 3.0 Spread" color="#8a3ffc" icon={Security} />
    </div>
  );
}
