import React from 'react';

interface ShapValue {
  feature: string;
  contribution: number;
}

interface ShapPanelProps {
  shapValues?: ShapValue[];
  explainability?: any;
  direction?: string;
  probabilities?: Record<string, number>;
}

const ShapPanel: React.FC<ShapPanelProps> = ({ shapValues, explainability, direction, probabilities }) => {
  let finalShap = shapValues || [];
  
  if (finalShap.length === 0 && explainability?.categories) {
    finalShap = explainability.categories.flatMap((c: any) => c.features || []);
    finalShap.sort((a: ShapValue, b: ShapValue) => Math.abs(b.contribution) - Math.abs(a.contribution));
  }

  if (!finalShap || finalShap.length === 0) {
    return (
      <div style={{ padding: '0.75rem', color: '#8d8d8d', fontSize: '0.8rem' }}>
        No SHAP explainability data available for this signal.
      </div>
    );
  }

  // Find max absolute contribution for scaling
  const maxContrib = Math.max(...finalShap.map(v => Math.abs(v.contribution)));

  return (
    <div style={{ padding: '0.35rem 0.75rem', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.35rem' }}>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {finalShap.slice(0, 5).map((v, i) => {
          const isPositive = v.contribution > 0;
          const absVal = Math.abs(v.contribution);
          const percent = maxContrib > 0 ? (absVal / maxContrib) * 100 : 0;
          const barColor = isPositive ? '#24a148' : '#fa4d56'; 

          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: '16px' }}>
              <div style={{ width: '75px', fontSize: '0.7rem', textAlign: 'right', color: '#e0e0e0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v.feature}>
                {v.feature}
              </div>
              <div style={{ flex: 1, height: '5px', background: '#393939', borderRadius: '2px', position: 'relative' }}>
                <div 
                  style={{ 
                    position: 'absolute', 
                    top: 0, 
                    bottom: 0, 
                    left: 0, 
                    width: `${percent}%`, 
                    background: barColor,
                    borderRadius: '2px'
                  }} 
                />
              </div>
              <div style={{ width: '35px', fontSize: '0.7rem', color: barColor, fontWeight: 600 }}>
                {isPositive ? '+' : ''}{v.contribution.toFixed(2)}
              </div>
            </div>
          );
        })}
      </div>

      {probabilities && Object.keys(probabilities).length > 0 && (
        <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', paddingTop: '0.3rem' }}>
          {Object.entries(probabilities).map(([cls, prob]) => {
            const formattedProb = (Number(prob) * 100).toFixed(1) + '%';
            let clsColor = '#a8a8a8';
            if (cls === 'BUY') clsColor = '#24a148';
            if (cls === 'SELL') clsColor = '#fa4d56';
            if (cls === 'NEUTRAL') clsColor = '#ffffff';
            
            return (
              <div key={cls} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem' }}>
                <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: clsColor }} />
                <span style={{ color: '#c6c6c6' }}>{cls}:</span>
                <span style={{ color: clsColor, fontWeight: 'bold' }}>{formattedProb}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ShapPanel;
