export interface FormatterResult {
  text: string;
  color: string;
  type?: 'bullish' | 'bearish' | 'counter_scalp' | 'sideways' | 'manual' | 'default';
  description?: string;
}

/**
 * Formats the Strategy / Engine Source (e.g. Range Scalper vs Manual)
 */
export const getEngineSourceFormat = (source: string): FormatterResult => {
  if (!source) return { text: 'Range Scalper', color: '#11a3c6' };
  const s = source.toUpperCase();
  if (s.includes('RANGE') || s.includes('SCALP')) {
    return { text: 'Range Scalper ($2.00)', color: '#11a3c6', description: 'Dual LightGBM ONNX Event-Driven Model' };
  }
  if (s.includes('MANUAL')) {
    return { text: 'Manual Order', color: '#8a3ffc', description: 'User Initiated Execution' };
  }
  return { text: source, color: '#f4f4f4' };
};

/**
 * Formats the Real Market Regime / Environment Context
 */
export const getMarketRegimeFormat = (regime: string): FormatterResult => {
  if (!regime) return { text: 'UNKNOWN', color: '#8d8d8d', type: 'default' };
  const r = regime.toUpperCase();

  // 1. Triple Aligned / Pro-Trend
  if (r.includes('TRIPLE_ALIGNED_BULL') || r === 'BULLISH' || r.includes('PRO_TREND_BUY')) {
    return { text: 'Bullish Trend', color: '#24a148', type: 'bullish', description: 'Pro-Trend Scale Alignment (1.00x)' };
  }
  if (r.includes('TRIPLE_ALIGNED_BEAR') || r === 'BEARISH' || r.includes('PRO_TREND_SELL')) {
    return { text: 'Bearish Trend', color: '#fa4d56', type: 'bearish', description: 'Pro-Trend Scale Alignment (1.00x)' };
  }

  // 2. Counter-Trend Scalp
  if (r.includes('COUNTER_SCALP') || r.includes('COUNTER_TREND')) {
    return { text: 'Counter Scalp', color: '#f1c21b', type: 'counter_scalp', description: 'Micro Scalp Against Macro (0.40x)' };
  }

  // 3. Sideways / Oscillation Range
  if (r.includes('OSCILLATION') || r.includes('RANGE') || r.includes('SIDEWAYS') || r.includes('CHOP')) {
    return { text: 'Sideways Range', color: '#0f62fe', type: 'sideways', description: 'Mean Reversion Environment (0.75x)' };
  }

  // Fallbacks
  if (r === 'MANUAL' || r === 'TEST_MANUAL') {
    return { text: 'Manual', color: '#8a3ffc', type: 'manual' };
  }
  if (r === 'RANGE_SCALPER' || r === 'SCALPING') {
    return { text: 'Range Scalper', color: '#11a3c6', type: 'counter_scalp' };
  }

  return { text: regime.replace(/_/g, ' '), color: '#f4f4f4', type: 'default' };
};

// Backwards-compatible alias for existing components
export const getRegimeFormat = getMarketRegimeFormat;
