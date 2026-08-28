"use client";

import React from 'react';
import { Tile } from '@carbon/react';
import { CurrencyDollar, Activity, Power, MachineLearningModel, ChartLine, Wallet, ArrowDownRight } from '@carbon/icons-react';
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

  const todayDdVal = Number(analytics?.today_drawdown ?? analytics?.max_drawdown ?? 0);

  return (
    <div className="dashboard-metrics-grid" style={{ height: '100%' }}>
      {/* Group 1: Engine & Auto Trade */}
      <Tile style={{ padding: '0.25rem 0.5rem', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: '100%', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: "0.25rem" }}>
              <Power size={13} color="#a8a8a8" />
              <p style={{ fontSize: "10px", color: "#a8a8a8", margin: 0 }}>Engine</p>
            </div>
            <h4 style={{ margin: 0, fontWeight: 600, color: state?.engine_active ? "#24a148" : "#fa4d56", lineHeight: "1.1" }}>
              {state?.engine_active ? "ON" : "OFF"}
            </h4>
          </div>
          <div style={{ width: '1px', height: '65%', backgroundColor: '#393939' }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: "0.25rem" }}>
              <MachineLearningModel size={13} color="#a8a8a8" />
              <p style={{ fontSize: "10px", color: "#a8a8a8", margin: 0 }}>Auto Trade</p>
            </div>
            <h4 style={{ margin: 0, fontWeight: 600, color: state?.auto_execution ? "#24a148" : "#fa4d56", lineHeight: "1.1" }}>
              {state?.auto_execution ? "ON" : "OFF"}
            </h4>
          </div>
        </div>
      </Tile>

      {/* Group 2: Today Trades, Today PnL, Today Winrate, Today Drawdown */}
      <Tile style={{ padding: '0.25rem 0.5rem', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: '100%', gap: '0.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: "0.25rem" }}>
              <ChartLine size={13} color="#a8a8a8" />
              <p style={{ fontSize: "10px", color: "#a8a8a8", margin: 0 }}>Today Trades</p>
            </div>
            <h4 style={{ margin: 0, color: "#f4f4f4", fontWeight: 600, lineHeight: "1.1" }}>
              {analytics?.total_trades !== undefined ? analytics.total_trades : (state?.total_trades || "0")}
            </h4>
          </div>
          <div style={{ width: '1px', height: '65%', backgroundColor: '#393939' }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: "0.25rem" }}>
              <Wallet size={13} color="#a8a8a8" />
              <p style={{ fontSize: "10px", color: "#a8a8a8", margin: 0 }}>Today PnL</p>
            </div>
            <h4 style={{ margin: 0, fontWeight: 600, color: (analytics?.total_pnl || 0) >= 0 ? "#24a148" : "#fa4d56", lineHeight: "1.1" }}>
              {analytics?.total_pnl !== undefined && analytics?.total_pnl !== null 
                ? `${analytics.total_pnl >= 0 ? '+$' : '-$'}${Math.abs(Number(analytics.total_pnl)).toFixed(2)}` 
                : "$0.00"}
            </h4>
          </div>
          <div style={{ width: '1px', height: '65%', backgroundColor: '#393939' }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: "0.25rem" }}>
              <Activity size={13} color="#a8a8a8" />
              <p style={{ fontSize: "10px", color: "#a8a8a8", margin: 0 }}>Today Winrate</p>
            </div>
            <h4 style={{ margin: 0, color: "#f4f4f4", fontWeight: 600, lineHeight: "1.1" }}>
              {analytics?.win_rate !== undefined && analytics?.win_rate !== null ? `${Number(analytics.win_rate).toFixed(1)}%` : "0.0%"}
            </h4>
          </div>
          <div style={{ width: '1px', height: '65%', backgroundColor: '#393939' }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: "0.25rem" }}>
              <ArrowDownRight size={13} color="#a8a8a8" />
              <p style={{ fontSize: "10px", color: "#a8a8a8", margin: 0 }}>Today Drawdown</p>
            </div>
            <h4 style={{ margin: 0, fontWeight: 600, color: todayDdVal > 0 ? "#fa4d56" : "#24a148", lineHeight: "1.1" }}>
              {analytics?.today_drawdown !== undefined && analytics?.today_drawdown !== null
                ? `${Number(analytics.today_drawdown) > 0 ? '-' : ''}${Math.abs(Number(analytics.today_drawdown)).toFixed(2)}%`
                : (analytics?.max_drawdown !== undefined && analytics?.max_drawdown !== null
                  ? `${Number(analytics.max_drawdown) > 0 ? '-' : ''}${Math.abs(Number(analytics.max_drawdown)).toFixed(2)}%`
                  : "0.00%")}
            </h4>
          </div>
        </div>
      </Tile>
    </div>
  );
}
