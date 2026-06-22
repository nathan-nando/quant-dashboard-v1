"use client";

import React, { useState } from "react";
import {
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableContainer,
  TableToolbar,
  TableToolbarContent,
  TableToolbarSearch,
  Tag,
  Modal
} from "@carbon/react";
import GlobalTable from "./GlobalTable";

interface Trade {
  trade_id: string;
  symbol: string;
  direction: string;
  entry_time: string;
  exit_time: string;
  entry_price: number;
  exit_price: number;
  volume: number;
  pnl_money: number;
  pnl_pips: number;
  close_reason: string;
  regime: string;
  confidence: number;
  model_version?: string;
  features_at_entry?: Record<string, any>;
}

const getRegimeFormat = (regime: string) => {
  if (!regime) return { text: 'UNKNOWN', color: '#f4f4f4' };
  if (regime === 'TREND_BULL') return { text: 'Bull Trend', color: '#24a148' }; // Green
  if (regime === 'TREND_BEAR') return { text: 'Bear Trend', color: '#fa4d56' }; // Red
  if (regime === 'VOLATILE_CHOP') return { text: 'Volatile Chop', color: '#f1c21b' }; // Yellow
  if (regime === 'MEAN_REVERTING') return { text: 'Mean Reverting', color: '#4589ff' }; // Blue
  return { text: regime.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' '), color: '#f4f4f4' };
};

interface TradeHistoryTableProps {
  trades: Trade[];
}

export default function TradeHistoryTable({ trades }: TradeHistoryTableProps) {
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

  const handleViewDetails = (rowId: string) => {
    const trade = trades.find((t, idx) => (t.trade_id || `trade-${idx}`) === rowId);
    if (trade) {
      setSelectedTrade(trade);
    }
  };

  // Carbon DataTable requires 'id' property
  const rows = trades.map((trade, idx) => ({
    ...trade,
    id: trade.trade_id || `trade-${idx}`,
    formatted_entry_time: trade.entry_time,
    formatted_exit_time: trade.exit_time,
    formatted_pnl_money: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(trade.pnl_money),
    formatted_entry_price: trade.entry_price.toFixed(2),
    formatted_exit_price: trade.exit_price.toFixed(2),
    formatted_volume: trade.volume.toFixed(2),
    formatted_confidence: trade.confidence ? `${(trade.confidence * 100).toFixed(1)}%` : '-',
    model_version: trade.model_version || '-',
  }));

  const headers = [
    { key: "direction", header: "Dir" },
    { key: "formatted_entry_time", header: "Entry Time" },
    { key: "formatted_exit_time", header: "Exit Time" },
    { key: "formatted_entry_price", header: "Entry" },
    { key: "formatted_exit_price", header: "Exit" },
    { key: "formatted_volume", header: "Lots" },
    { key: "close_reason", header: "Reason" },
    { key: "regime", header: "Regime" },
    { key: "model_version", header: "Model" },
    { key: "formatted_confidence", header: "Conf" },
    { key: "formatted_pnl_money", header: "PnL" },
  ];

  const formatCell = (cellId: string, value: any) => {
    if (cellId.endsWith(":direction")) {
      return (
        <Tag type={value === "BUY" ? "green" : "red"} size="sm" style={{ margin: 0 }}>
          {value}
        </Tag>
      );
    }
    if (cellId.endsWith(":formatted_entry_time") || cellId.endsWith(":formatted_exit_time")) {
      if (!value) return "-";
      const d = new Date(value);
      if (isNaN(d.getTime())) return value;
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const day = d.getDate().toString().padStart(2, '0');
      const month = months[d.getMonth()];
      const year = d.getFullYear().toString().slice(-2);
      const time = d.toTimeString().split(' ')[0];
      return (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
          <span>{`${day} ${month} ${year}`}</span>
          <span style={{ color: '#a8a8a8', fontSize: '0.9em' }}>{time}</span>
        </div>
      );
    }
    if (cellId.endsWith(":regime")) {
      const format = getRegimeFormat(value);
      const parts = format.text.split(' ');
      return (
        <span style={{ color: format.color, fontWeight: 'bold', fontSize: '0.85em', display: 'inline-block', lineHeight: '1.1' }}>
          {parts.map((p, i) => <span key={i}>{p}{i < parts.length - 1 && <br/>}</span>)}
        </span>
      );
    }
    if (cellId.endsWith(":formatted_pnl_money")) {
      const isProfit = value.includes("-") === false && value !== "$0.00";
      const pnlColor = isProfit ? "#24a148" : (value.includes("-") ? "#da1e28" : "#c6c6c6");
      return <span style={{ color: pnlColor, fontWeight: 'bold' }}>{value}</span>;
    }
    if (cellId.endsWith(":formatted_confidence")) {
      return <span style={{ fontWeight: 500, color: '#8a3ffc' }}>{value}</span>;
    }
    if (cellId.endsWith(":model_version")) {
      return <span style={{ fontSize: '0.8rem', color: '#c6c6c6' }}>{value}</span>;
    }
    return value;
  };

  return (
    <>
      <GlobalTable
        title="Trade History"
        description={trades.length === 0 ? "No trades" : undefined}
        headers={headers}
        initialData={rows}
        formatCell={formatCell}
        onViewDetails={handleViewDetails}
      />

      {selectedTrade && (
        <Modal
          open={!!selectedTrade}
          onRequestClose={() => setSelectedTrade(null)}
          passiveModal
          modalHeading="Trade Details"
          size="lg"
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem 0.75rem', marginBottom: '1rem' }}>
            <div>
              <p style={{ color: '#a8a8a8', fontSize: '0.75rem', marginBottom: '4px' }}>Trade ID</p>
              <p style={{ fontSize: '0.875rem' }}>{selectedTrade.trade_id || (selectedTrade as any).id || '-'}</p>
            </div>
            <div>
              <p style={{ color: '#a8a8a8', fontSize: '0.75rem', marginBottom: '4px' }}>Symbol / Direction</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <strong style={{ fontSize: '0.875rem' }}>{selectedTrade.symbol || '-'}</strong>
                <Tag type={selectedTrade.direction === "BUY" ? "green" : "red"} size="sm" style={{ margin: 0 }}>
                  {selectedTrade.direction}
                </Tag>
              </div>
            </div>

            <div>
              <p style={{ color: '#a8a8a8', fontSize: '0.75rem', marginBottom: '4px' }}>Regime / Model</p>
              <p style={{ fontSize: '0.875rem' }}>
                {selectedTrade.regime} <span style={{ color: '#8a3ffc' }}>({selectedTrade.model_version || 'Unknown'})</span>
              </p>
            </div>
            <div>
              <p style={{ color: '#a8a8a8', fontSize: '0.75rem', marginBottom: '4px' }}>Model Confidence</p>
              <p style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>
                {selectedTrade.confidence ? `${(selectedTrade.confidence * 100).toFixed(2)}%` : '-'}
              </p>
            </div>

            <div>
              <p style={{ color: '#a8a8a8', fontSize: '0.75rem', marginBottom: '4px' }}>Entry Time</p>
              <p style={{ fontSize: '0.875rem' }}>{new Date(selectedTrade.entry_time).toLocaleString()}</p>
            </div>
            <div>
              <p style={{ color: '#a8a8a8', fontSize: '0.75rem', marginBottom: '4px' }}>Exit Time</p>
              <p style={{ fontSize: '0.875rem' }}>{selectedTrade.exit_time ? new Date(selectedTrade.exit_time).toLocaleString() : '-'}</p>
            </div>

            <div>
              <p style={{ color: '#a8a8a8', fontSize: '0.75rem', marginBottom: '4px' }}>Prices (Entry &rarr; Exit)</p>
              <p style={{ fontSize: '0.875rem' }}>
                {selectedTrade.entry_price.toFixed(5)} &rarr; {selectedTrade.exit_price ? selectedTrade.exit_price.toFixed(5) : '-'}
              </p>
            </div>
            <div>
              <p style={{ color: '#a8a8a8', fontSize: '0.75rem', marginBottom: '4px' }}>SL / TP Levels</p>
              <p style={{ fontSize: '0.875rem' }}>
                SL: {(selectedTrade as any).sl_price || '-'} | TP: {(selectedTrade as any).tp_price || '-'}
              </p>
            </div>

            <div>
              <p style={{ color: '#a8a8a8', fontSize: '0.75rem', marginBottom: '4px' }}>Volume</p>
              <p style={{ fontSize: '0.875rem' }}>{selectedTrade.volume} Lots</p>
            </div>
            <div>
              <p style={{ color: '#a8a8a8', fontSize: '0.75rem', marginBottom: '4px' }}>Costs (Commission / Slippage)</p>
              <p style={{ fontSize: '0.875rem' }}>
                ${(selectedTrade as any).commission_cost?.toFixed(2) || '0.00'} / ${(selectedTrade as any).slippage_cost?.toFixed(2) || '0.00'}
              </p>
            </div>

            <div>
              <p style={{ color: '#a8a8a8', fontSize: '0.75rem', marginBottom: '4px' }}>Net PnL (Money / Pips)</p>
              <p style={{ fontSize: '0.875rem', color: selectedTrade.pnl_money >= 0 ? "#24a148" : "#da1e28", fontWeight: 'bold' }}>
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(selectedTrade.pnl_money)} 
                <span style={{ fontWeight: 'normal', color: '#c6c6c6', marginLeft: '0.5rem' }}>({selectedTrade.pnl_pips?.toFixed(1) || '-'} pips)</span>
              </p>
            </div>
            <div>
              <p style={{ color: '#a8a8a8', fontSize: '0.75rem', marginBottom: '4px' }}>Close Reason / Duration</p>
              <p style={{ fontSize: '0.875rem' }}>
                {selectedTrade.close_reason || '-'} <span style={{ color: '#c6c6c6' }}>| {(selectedTrade as any).trade_duration || '-'}</span>
              </p>
            </div>
          </div>

          {selectedTrade.features_at_entry?._probabilities && (
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid #393939', paddingTop: '1rem' }}>
              <h4 style={{ marginBottom: '0.75rem', fontSize: '0.875rem', fontWeight: '500' }}>Model Class Probabilities</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                {Object.entries(selectedTrade.features_at_entry._probabilities).map(([cls, prob]: [string, any]) => {
                  let color = '#ffffff';
                  if (cls === 'BUY') color = '#42be65';
                  if (cls === 'SELL') color = '#ff8389';
                  if (cls === 'NEUTRAL') color = '#f1c21b';
                  return (
                    <div key={cls} style={{ backgroundColor: '#262626', padding: '0.5rem 0.75rem', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: '#a8a8a8', fontWeight: '500' }}>{cls}</span>
                      <strong style={{ fontSize: '0.875rem', color: color }}>{(prob * 100).toFixed(2)}%</strong>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
