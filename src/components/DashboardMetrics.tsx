"use client";

import React from 'react';
import { Tile } from '@carbon/react';
import { CurrencyDollar, Activity, Power, MachineLearningModel, ChartLine, Wallet } from '@carbon/icons-react';
import { useGlobalState } from '../contexts/GlobalStateContext';

const getRegimeFormat = (regime: string) => {
  if (!regime) return { text: 'UNKNOWN', color: '#f4f4f4' };
  if (regime === 'MoE' || regime === 'MOE_ENSEMBLE') return { text: 'MoE Ensemble', color: '#8a3ffc' }; // Purple
  if (regime === 'TREND_EXPERT' || regime === 'trend') return { text: 'Trend Expert', color: '#24a148' }; // Green
  if (regime === 'MEANREV_EXPERT' || regime === 'meanrev') return { text: 'MeanRev Expert', color: '#4589ff' }; // Blue
  if (regime === 'MACRO_EXPERT' || regime === 'macro') return { text: 'Macro Expert', color: '#d12771' }; // Magenta
  if (regime === 'TREND_BULL') return { text: 'Bull Trend', color: '#24a148' };
  if (regime === 'TREND_BEAR') return { text: 'Bear Trend', color: '#fa4d56' };
  if (regime === 'VOLATILE_CHOP') return { text: 'Volatile Chop', color: '#f1c21b' };
  if (regime === 'MEAN_REVERTING') return { text: 'Mean Reverting', color: '#4589ff' };
  return { text: regime.replace('_EXPERT', ' Expert'), color: '#f4f4f4' };
};

export default function DashboardMetrics() {
  const { state, analytics } = useGlobalState();

  return (
    <div className="dashboard-metrics-grid">
      <Tile>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: "0.35rem" }}>
          <Power size={14} color="#a8a8a8" />
          <p style={{ fontSize: "10px", color: "#a8a8a8", margin: 0 }}>Engine</p>
        </div>
        <h4 style={{ margin: 0, fontWeight: 600, color: state?.engine_active ? "#24a148" : "#fa4d56", lineHeight: "1.1" }}>
          {state?.engine_active ? "ON" : "OFF"}
        </h4>
      </Tile>

      <Tile>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: "0.35rem" }}>
          <MachineLearningModel size={14} color="#a8a8a8" />
          <p style={{ fontSize: "10px", color: "#a8a8a8", margin: 0 }}>Auto Trade</p>
        </div>
        <h4 style={{ margin: 0, fontWeight: 600, color: state?.auto_execution ? "#24a148" : "#fa4d56", lineHeight: "1.1" }}>
          {state?.auto_execution ? "ON" : "OFF"}
        </h4>
      </Tile>

      <Tile>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: "0.35rem" }}>
          <ChartLine size={14} color="#a8a8a8" />
          <p style={{ fontSize: "10px", color: "#a8a8a8", margin: 0 }}>Total Trades</p>
        </div>
        <h4 style={{ margin: 0, color: "#f4f4f4", fontWeight: 600, lineHeight: "1.1" }}>
          {analytics ? analytics.total_trades : "..."}
        </h4>
      </Tile>

      <Tile>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: "0.35rem" }}>
          <Wallet size={14} color="#a8a8a8" />
          <p style={{ fontSize: "10px", color: "#a8a8a8", margin: 0 }}>Total PnL</p>
        </div>
        <h4 style={{ margin: 0, fontWeight: 600, color: analytics?.total_pnl >= 0 ? "#24a148" : "#fa4d56", lineHeight: "1.1" }}>
          {analytics ? `$${analytics.total_pnl.toFixed(2)}` : "..."}
        </h4>
      </Tile>
    </div>
  );
}
