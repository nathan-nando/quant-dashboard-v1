"use client";

import React from 'react';
import { Tile } from '@carbon/react';
import { CurrencyDollar, Activity, Power, MachineLearningModel, ChartLine, Wallet } from '@carbon/icons-react';
import { useGlobalState } from '../contexts/GlobalStateContext';

const getRegimeFormat = (regime: string) => {
  if (!regime) return { text: 'UNKNOWN', color: '#f4f4f4' };
  if (regime === 'TREND_BULL') return { text: 'Bull Trend', color: '#24a148' }; // Green
  if (regime === 'TREND_BEAR') return { text: 'Bear Trend', color: '#fa4d56' }; // Red
  if (regime === 'VOLATILE_CHOP') return { text: 'Volatile Chop', color: '#f1c21b' }; // Yellow
  if (regime === 'MEAN_REVERTING') return { text: 'Mean Reverting', color: '#4589ff' }; // Blue
  return { text: regime, color: '#f4f4f4' };
};

export default function DashboardMetrics() {
  const { state, analytics } = useGlobalState();

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "0.2rem", flex: "1 1 auto" }}>
      <Tile style={{ padding: "0.3rem 0.5rem", height: "100%" }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: "0.35rem" }}>
          <CurrencyDollar size={14} color="#a8a8a8" />
          <p style={{ fontSize: "10px", color: "#a8a8a8", margin: 0 }}>Live Price</p>
        </div>
        <h4 style={{ margin: 0, color: "#f4f4f4", fontSize: "1.25rem", fontWeight: 600, lineHeight: "1.1" }}>
          {state?.price ? (
            state.price.ask > 0 ? state.price.ask.toFixed(2) : state.price.last?.toFixed(2) || "0.00"
          ) : "Loading..."}
        </h4>
      </Tile>

      <Tile style={{ padding: "0.3rem 0.5rem", height: "100%" }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: "0.35rem" }}>
          <Activity size={14} color="#a8a8a8" />
          <p style={{ fontSize: "10px", color: "#a8a8a8", margin: 0 }}>Regime</p>
        </div>
        <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: getRegimeFormat(state?.regime).color, lineHeight: "1.1" }}>
          {getRegimeFormat(state?.regime).text}
        </h4>
      </Tile>

      <Tile style={{ padding: "0.3rem 0.5rem", height: "100%" }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: "0.35rem" }}>
          <Power size={14} color="#a8a8a8" />
          <p style={{ fontSize: "10px", color: "#a8a8a8", margin: 0 }}>Engine</p>
        </div>
        <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: state?.engine_active ? "#24a148" : "#fa4d56", lineHeight: "1.1" }}>
          {state?.engine_active ? "ON" : "OFF"}
        </h4>
      </Tile>

      <Tile style={{ padding: "0.3rem 0.5rem", height: "100%" }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: "0.35rem" }}>
          <MachineLearningModel size={14} color="#a8a8a8" />
          <p style={{ fontSize: "10px", color: "#a8a8a8", margin: 0 }}>Auto Trade</p>
        </div>
        <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: state?.auto_execution ? "#24a148" : "#fa4d56", lineHeight: "1.1" }}>
          {state?.auto_execution ? "ON" : "OFF"}
        </h4>
      </Tile>

      <Tile style={{ padding: "0.3rem 0.5rem", height: "100%" }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: "0.35rem" }}>
          <ChartLine size={14} color="#a8a8a8" />
          <p style={{ fontSize: "10px", color: "#a8a8a8", margin: 0 }}>Total Trades</p>
        </div>
        <h4 style={{ margin: 0, color: "#f4f4f4", fontSize: "1.25rem", fontWeight: 600, lineHeight: "1.1" }}>
          {analytics ? analytics.total_trades : "..."}
        </h4>
      </Tile>

      <Tile style={{ padding: "0.3rem 0.5rem", height: "100%" }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: "0.35rem" }}>
          <Wallet size={14} color="#a8a8a8" />
          <p style={{ fontSize: "10px", color: "#a8a8a8", margin: 0 }}>Total PnL</p>
        </div>
        <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: analytics?.total_pnl >= 0 ? "#24a148" : "#fa4d56", lineHeight: "1.1" }}>
          {analytics ? `$${analytics.total_pnl.toFixed(2)}` : "..."}
        </h4>
      </Tile>
    </div>
  );
}
