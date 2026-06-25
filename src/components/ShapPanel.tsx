import React from 'react';
import { Tile, ProgressBar } from '@carbon/react';

interface ShapValue {
  feature: string;
  contribution: number;
}

interface ShapPanelProps {
  shapValues?: ShapValue[];
  direction?: string;
  probabilities?: Record<string, number>;
}

const ShapPanel: React.FC<ShapPanelProps> = ({ shapValues, direction, probabilities }) => {
  if (!shapValues || shapValues.length === 0) {
    return (
      <div style={{ padding: '1rem', color: '#8d8d8d', fontSize: '0.875rem' }}>
        No SHAP explainability data available for this signal.
      </div>
    );
  }

  // Find max absolute contribution for scaling
  const maxContrib = Math.max(...shapValues.map(v => Math.abs(v.contribution)));

  return (
    <div style={{ padding: '0.5rem 1rem' }}>
      <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#c6c6c6' }}>
        Top Features driving this <strong style={{ color: direction === 'BUY' ? '#24a148' : direction === 'SELL' ? '#fa4d56' : '#ffffff' }}>{direction}</strong> decision:
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {shapValues.map((v, i) => {
          const isPositive = v.contribution > 0;
          const absVal = Math.abs(v.contribution);
          const percent = maxContrib > 0 ? (absVal / maxContrib) * 100 : 0;
          // Carbon UI colors for positive/negative influence
          const barColor = isPositive ? '#24a148' : '#fa4d56'; 

          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '80px', fontSize: '0.75rem', textAlign: 'right', color: '#f4f4f4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {v.feature}
              </div>
              <div style={{ flex: 1, height: '8px', background: '#393939', borderRadius: '4px', position: 'relative' }}>
                <div 
                  style={{ 
                    position: 'absolute', 
                    top: 0, 
                    bottom: 0, 
                    left: 0, 
                    width: `${percent}%`, 
                    background: barColor,
                    borderRadius: '4px'
                  }} 
                />
              </div>
              <div style={{ width: '40px', fontSize: '0.75rem', color: barColor, fontWeight: 600 }}>
                {isPositive ? '+' : ''}{v.contribution.toFixed(2)}
              </div>
            </div>
          );
        })}
      </div>

      {probabilities && Object.keys(probabilities).length > 0 && (
        <div style={{ marginTop: '0.75rem' }}>
          <div style={{ marginBottom: '0.4rem', fontSize: '0.8rem', color: '#a8a8a8', fontWeight: 600 }}>
            Model Class Probabilities:
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {Object.entries(probabilities).map(([cls, prob]) => {
              const formattedProb = (Number(prob) * 100).toFixed(2) + '%';
              let clsColor = '#a8a8a8';
              if (cls === 'BUY') clsColor = '#24a148';
              if (cls === 'SELL') clsColor = '#fa4d56';
              if (cls === 'NEUTRAL') clsColor = '#ffffff';
              
              return (
                <div key={cls} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
                  <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: clsColor }} />
                  <span style={{ color: '#e0e0e0', fontWeight: 600 }}>{cls}:</span>
                  <span style={{ color: clsColor, fontWeight: 'bold' }}>{formattedProb}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShapPanel;
