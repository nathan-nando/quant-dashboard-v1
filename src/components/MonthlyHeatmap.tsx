import React from 'react';

interface MonthlyHeatmapProps {
  data: { year: number; month: number; return_pct: number }[];
  trades?: any[];
}

export default function MonthlyHeatmap({ data, trades }: MonthlyHeatmapProps) {
  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#8d8d8d' }}>
        Not enough data to calculate monthly returns.
      </div>
    );
  }

  // Group by year
  const years = Array.from(new Set(data.map(d => d.year))).sort((a, b) => b - a);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Map to fast lookup
  const returnMap: Record<string, number> = {};
  let maxAbsReturn = 0;
  
  data.forEach(d => {
    returnMap[`${d.year}-${d.month}`] = d.return_pct;
    if (Math.abs(d.return_pct) > maxAbsReturn) {
      maxAbsReturn = Math.abs(d.return_pct);
    }
  });

  const tradeCountMap: Record<string, number> = {};
  if (trades) {
    trades.forEach(t => {
      if (t.entry_time) {
        const d = new Date(t.entry_time);
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        tradeCountMap[`${y}-${m}`] = (tradeCountMap[`${y}-${m}`] || 0) + 1;
      }
    });
  }

  // Ensure we don't divide by zero
  if (maxAbsReturn === 0) maxAbsReturn = 1;

  const getColor = (value: number | undefined) => {
    if (value === undefined) return '#262626'; // Empty cell
    
    // Scale intensity
    const intensity = Math.min(1, Math.abs(value) / maxAbsReturn);
    
    if (value > 0) {
      // Carbon green shades
      // e.g. from dark green #198038 to light green #42be65 based on intensity
      return `rgba(36, 161, 72, ${0.2 + (intensity * 0.8)})`;
    } else if (value < 0) {
      // Carbon red shades
      return `rgba(250, 77, 86, ${0.2 + (intensity * 0.8)})`;
    }
    
    return '#393939'; // Zero return
  };

  return (
    <div style={{ overflowX: 'auto', width: '100%' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
        <thead>
          <tr>
            <th style={{ padding: '0.5rem', borderBottom: '1px solid #393939', textAlign: 'left' }}>Year</th>
            {months.map(m => (
              <th key={m} style={{ padding: '0.5rem', borderBottom: '1px solid #393939', fontWeight: 'normal', fontSize: '0.875rem' }}>{m}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {years.map(year => (
            <tr key={year}>
              <td style={{ padding: '0.5rem', fontWeight: 'bold', textAlign: 'left', borderRight: '1px solid #393939' }}>{year}</td>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
                const val = returnMap[`${year}-${month}`];
                return (
                  <td 
                    key={`${year}-${month}`} 
                    title={val !== undefined ? `${val > 0 ? '+' : ''}${val.toFixed(2)}%` : 'No data'}
                    style={{ 
                      padding: '0.5rem', 
                      backgroundColor: getColor(val),
                      border: '1px solid #161616', // to show gaps between cells
                      color: val !== undefined ? '#ffffff' : '#8d8d8d',
                      fontSize: '0.875rem'
                    }}
                  >
                    <div>{val !== undefined ? `${val > 0 ? '+' : ''}${val.toFixed(1)}%` : '-'}</div>
                    {val !== undefined && trades && trades.length > 0 && (
                      <div style={{ fontSize: '0.65rem', opacity: 0.7 }}>
                        {tradeCountMap[`${year}-${month}`] || 0} trades
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
