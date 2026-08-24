import React from 'react';
import { getMarketRegimeFormat } from '../utils/formatters';

interface RegimeBadgeProps {
  regime: string;
  fontSize?: string;
}

export default function RegimeBadge({ regime, fontSize = '9.5px' }: RegimeBadgeProps) {
  if (!regime || regime === '-') return <span style={{ color: '#525252', fontSize: '10px' }}>-</span>;
  const format = getMarketRegimeFormat(regime);

  const renderIcon = () => {
    switch (format.type) {
      case 'bullish':
        return (
          <svg width="11" height="11" viewBox="0 0 32 32" style={{ fill: '#24a148', flexShrink: 0 }}>
            <path d="M10 6v2h10.59L4.29 24.29l1.41 1.41L22 9.41V20h2V6H10z" />
          </svg>
        );
      case 'bearish':
        return (
          <svg width="11" height="11" viewBox="0 0 32 32" style={{ fill: '#fa4d56', flexShrink: 0 }}>
            <path d="M22 26v-2H11.41L27.71 7.71l-1.41-1.41L10 22.59V12H8v14h14z" />
          </svg>
        );
      case 'counter_scalp':
        return (
          <svg width="11" height="11" viewBox="0 0 32 32" style={{ fill: '#f1c21b', flexShrink: 0 }}>
            <path d="M19 2L7 18h7l-3 12 14-18h-8l2-10z" />
          </svg>
        );
      case 'sideways':
        return (
          <svg width="11" height="11" viewBox="0 0 32 32" style={{ fill: '#0f62fe', flexShrink: 0 }}>
            <path d="M20 7l-1.41 1.41L21.17 11H6v2h15.17l-2.58 2.59L20 17l6-5-6-5zm-8 10l1.41-1.41L10.83 13H26v-2H10.83l2.58-2.59L12 7l-6 5 6 5z" />
          </svg>
        );
      case 'volatile':
        return (
          <svg width="11" height="11" viewBox="0 0 32 32" style={{ fill: '#fa4d56', flexShrink: 0 }}>
            <path d="M27.71 18.29l-9-9a1 1 0 0 0-1.42 0l-5 5L4.71 6.71 3.29 8.12l8.29 8.29a1 1 0 0 0 1.42 0l5-5 8.29 8.3z" />
          </svg>
        );
      case 'manual':
        return (
          <svg width="11" height="11" viewBox="0 0 32 32" style={{ fill: '#8a3ffc', flexShrink: 0 }}>
            <path d="M16 4a6 6 0 1 0 6 6 6 6 0 0 0-6-6zm0 14c-4.42 0-8 2.69-8 6v2h16v-2c0-3.31-3.58-6-8-6z" />
          </svg>
        );
      default:
        return (
          <svg width="11" height="11" viewBox="0 0 32 32" style={{ fill: '#8d8d8d', flexShrink: 0 }}>
            <circle cx="16" cy="16" r="6" />
          </svg>
        );
    }
  };

  return (
    <div 
      style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '5px', 
        whiteSpace: 'nowrap' 
      }} 
      title={format.description || format.text}
    >
      {renderIcon()}
      <span style={{ color: '#e0e0e0', fontWeight: 500, fontSize }}>
        {format.text}
      </span>
    </div>
  );
}
