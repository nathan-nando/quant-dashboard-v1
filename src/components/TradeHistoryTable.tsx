"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
  Modal
} from "@carbon/react";
import GlobalTable from "./GlobalTable";
import GlobalDetailTable from "./GlobalDetailTable";

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
  status?: string;
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
  title?: React.ReactNode;
  hideSearch?: boolean;
  hidePagination?: boolean;
  onReload?: () => void | Promise<void>;
  compact?: boolean;
}

export default function TradeHistoryTable({ 
  trades, 
  title = "Trade History", 
  hideSearch = false, 
  hidePagination = false,
  onReload,
  compact = false
}: TradeHistoryTableProps) {
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [selectedSignalId, setSelectedSignalId] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    formatted_exit_time: trade.exit_time || '-',
    formatted_pnl_money: trade.pnl_money != null ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(trade.pnl_money) : '-',
    formatted_entry_price: trade.entry_price != null ? Number(trade.entry_price).toFixed(2) : '-',
    formatted_exit_price: trade.exit_price != null ? Number(trade.exit_price).toFixed(2) : '-',
    formatted_volume: trade.volume != null ? Number(trade.volume).toFixed(2) : '-',
    formatted_confidence: trade.confidence != null ? `${(Number(trade.confidence) * 100).toFixed(1)}%` : '-',
    model_version: trade.model_version || '-',
    formatted_dir_status: '',
  }));

  const headers = [
    { key: "formatted_dir_status", header: "Status", width: "60px" },
    { key: "formatted_entry_time", header: "Time (Entry / Exit)" },
    { key: "formatted_entry_price", header: "Price (Entry/Exit) / Lots" },
    { key: "formatted_pnl_money", header: "PnL", width: "65px" },
    { key: "model_version", header: "Model / Conf" },
  ];

  const formatCell = (cellId: string, value: any) => {
    if (cellId.endsWith(":formatted_dir_status")) {
      const rowId = cellId.split(':')[0];
      const trade = trades.find((t, idx) => (t.trade_id || `trade-${idx}`) === rowId);
      if (!trade) return "-";

      const isBuy = trade.direction === "BUY";
      const dirColor = isBuy ? '#24a148' : '#fa4d56';
      const dirReadable = trade.direction ? trade.direction.charAt(0).toUpperCase() + trade.direction.slice(1).toLowerCase() : '';

      const isOpen = trade.status === "OPEN";
      const statusColor = isOpen ? '#24a148' : '#8d8d8d';
      const statusLabel = isOpen ? 'Open' : 'Closed';

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', lineHeight: '1.2', fontSize: compact ? '9.5px' : '11px' }}>
          {/* Direction */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: compact ? '4px' : '6px', fontWeight: 'bold' }}>
            {isBuy ? (
              <svg width="10" height="10" viewBox="0 0 32 32" style={{ fill: dirColor, flexShrink: 0 }}>
                <path d="M16 4L6 14h7v14h6V14h7z" />
              </svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 32 32" style={{ fill: dirColor, flexShrink: 0 }}>
                <path d="M16 28l10-10h-7V4h-6v14H6z" />
              </svg>
            )}
            <span style={{ color: dirColor, whiteSpace: 'nowrap' }}>{dirReadable}</span>
          </div>

          {/* Status */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: compact ? '4px' : '6px', fontWeight: 'bold' }}>
            <svg width="8" height="8" viewBox="0 0 32 32" style={{ fill: statusColor, flexShrink: 0 }}>
              <circle cx="16" cy="16" r="8" />
            </svg>
            <span style={{ color: statusColor, whiteSpace: 'nowrap' }}>{statusLabel}</span>
          </div>
        </div>
      );
    }
    if (cellId.endsWith(":formatted_entry_time")) {
      const rowId = cellId.split(':')[0];
      const trade = trades.find((t, idx) => (t.trade_id || `trade-${idx}`) === rowId);
      if (!trade) return "-";
      
      const formatTime = (isoString: string) => {
        if (!isoString) return "-";
        const d = new Date(isoString);
        if (isNaN(d.getTime())) return isoString;
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const day = d.getDate().toString().padStart(2, '0');
        const month = months[d.getMonth()];
        const year = d.getFullYear().toString().slice(-2);
        const timeParts = d.toTimeString().split(' ')[0].split(':');
        const time = `${timeParts[0]}:${timeParts[1]}`; // HH:MM
        
        if (compact) {
          return `${day} ${month} ${time}`; // e.g. "23 Jun 13:00"
        }
        return `${day} ${month} ${year} ${timeParts.join(':')}`;
      };
      
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? '2px' : '4px', lineHeight: '1.2', fontSize: compact ? '9.5px' : 'inherit' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: compact ? '4px' : '6px' }}>
            <svg width={compact ? 8 : 10} height={compact ? 8 : 10} viewBox="0 0 32 32" style={{ fill: '#24a148', flexShrink: 0 }}>
              <title>Entry Time</title>
              <path d="M18 6l-1.43 1.39L22.47 13H4v2h18.47l-5.9 5.61L18 22l8-8z" />
            </svg>
            <span>{formatTime(trade.entry_time)}</span>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: compact ? '4px' : '6px' }}>
            <svg width={compact ? 8 : 10} height={compact ? 8 : 10} viewBox="0 0 32 32" style={{ fill: '#fa4d56', flexShrink: 0 }}>
              <title>Exit Time</title>
              <path d="M14 22l1.43-1.39L9.53 15H28v-2H9.53l5.9-5.61L14 6l-8 8z" />
            </svg>
            <span style={{ color: '#e0e0e0' }}>{formatTime(trade.exit_time)}</span>
          </div>
        </div>
      );
    }
    if (cellId.endsWith(":formatted_entry_price")) {
      const rowId = cellId.split(':')[0];
      const trade = trades.find((t, idx) => (t.trade_id || `trade-${idx}`) === rowId);
      if (!trade) return "-";
      const entry = trade.entry_price != null ? Number(trade.entry_price).toFixed(2) : '-';
      const exit = trade.exit_price != null ? Number(trade.exit_price).toFixed(2) : '-';
      const lots = trade.volume != null ? Number(trade.volume).toFixed(2) : '-';
      
      if (compact) {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', lineHeight: '1.1', fontSize: '9.5px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <svg width="8" height="8" viewBox="0 0 32 32" style={{ fill: '#24a148', flexShrink: 0 }}>
                <title>Entry Price</title>
                <path d="M18 6l-1.43 1.39L22.47 13H4v2h18.47l-5.9 5.61L18 22l8-8z" />
              </svg>
              <span style={{ fontWeight: 'bold' }}>{entry}</span>
              <span style={{ fontSize: '8px', color: '#a8a8a8', marginLeft: '4px' }}>({lots} L)</span>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <svg width="8" height="8" viewBox="0 0 32 32" style={{ fill: '#fa4d56', flexShrink: 0 }}>
                <title>Exit Price</title>
                <path d="M14 22l1.43-1.39L9.53 15H28v-2H9.53l5.9-5.61L14 6l-8 8z" />
              </svg>
              <span style={{ fontWeight: 'bold', color: '#e0e0e0' }}>{exit}</span>
            </div>
          </div>
        );
      }
      
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', lineHeight: '1.2' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <svg width="10" height="10" viewBox="0 0 32 32" style={{ fill: '#24a148', flexShrink: 0 }}>
                <title>Entry Price</title>
                <path d="M18 6l-1.43 1.39L22.47 13H4v2h18.47l-5.9 5.61L18 22l8-8z" />
              </svg>
              <span style={{ fontWeight: 'bold' }}>{entry}</span>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <svg width="10" height="10" viewBox="0 0 32 32" style={{ fill: '#fa4d56', flexShrink: 0 }}>
                <title>Exit Price</title>
                <path d="M14 22l1.43-1.39L9.53 15H28v-2H9.53l5.9-5.61L14 6l-8 8z" />
              </svg>
              <span style={{ fontWeight: 'bold', color: '#e0e0e0' }}>{exit}</span>
            </div>
          </div>
          <div style={{ fontSize: '10px', color: '#a8a8a8' }}>Lots: {lots}</div>
        </div>
      );
    }
    if (cellId.endsWith(":formatted_pnl_money")) {
      const rowId = cellId.split(':')[0];
      const trade = trades.find((t, idx) => (t.trade_id || `trade-${idx}`) === rowId);
      if (!trade) return "-";
      
      const pnlMoney = trade.pnl_money;
      const closeReason = trade.close_reason;
      
      let pnlDisplay = "-";
      let pnlColor = "#c6c6c6";
      
      if (pnlMoney != null) {
        pnlDisplay = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(pnlMoney);
        const isProfit = pnlMoney > 0;
        pnlColor = isProfit ? "#24a148" : (pnlMoney < 0 ? "#da1e28" : "#c6c6c6");
      }
      
      const formatReason = (reason: string) => {
        if (!reason || reason === '-') return null;
        const fSize = compact ? '8.5px' : '10px';
        if (reason === "SL_HIT") return <span style={{ color: '#fa4d56', fontWeight: 'bold', fontSize: fSize, whiteSpace: 'nowrap' }}>SL Hit</span>;
        if (reason === "TP_HIT") return <span style={{ color: '#24a148', fontWeight: 'bold', fontSize: fSize, whiteSpace: 'nowrap' }}>TP Hit</span>;
        if (reason === "SIGNAL_REVERSE") return <span style={{ fontWeight: 'bold', fontSize: fSize, color: '#a8a8a8', whiteSpace: 'nowrap' }}>Signal Reverse</span>;
        if (reason === "END_OF_DATA") return <span style={{ fontWeight: 'bold', fontSize: fSize, color: '#a8a8a8', whiteSpace: 'nowrap' }}>End of Data</span>;
        if (reason === "MANUAL") return <span style={{ fontWeight: 'bold', fontSize: fSize, color: '#a8a8a8', whiteSpace: 'nowrap' }}>Manual</span>;
        
        const readable = reason.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        return <span style={{ fontWeight: 'bold', fontSize: fSize, color: '#a8a8a8', whiteSpace: 'nowrap' }}>{readable}</span>;
      };
      
      const reasonBadge = formatReason(closeReason);

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', lineHeight: '1.2' }}>
          <span style={{ color: pnlColor, fontWeight: 'bold', fontSize: compact ? '9.5px' : 'inherit' }}>{pnlDisplay}</span>
          {reasonBadge && (
            <div style={{ marginTop: '2px' }}>
              {reasonBadge}
            </div>
          )}
        </div>
      );
    }
    if (cellId.endsWith(":model_version")) {
      const rowId = cellId.split(':')[0];
      const trade = trades.find((t, idx) => (t.trade_id || `trade-${idx}`) === rowId);
      if (!trade) return "-";
      const modelName = trade.model_version === "Manual Override" ? "Manual" : trade.model_version;
      const conf = trade.confidence;
      const confColor = conf >= 0.7 ? '#24a148' : conf >= 0.5 ? '#f1c21b' : '#fa4d56';
      
      let readableModelText = '-';
      if (modelName && modelName !== '-') {
        const words = modelName.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
        readableModelText = words.join(' ');
      }
      
      if (compact) {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', lineHeight: '1.1', fontSize: '9.5px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <svg width="10" height="10" viewBox="0 0 32 32" style={{ fill: '#4589ff', flexShrink: 0 }}>
                <path d="M26,8V6a2,2,0,0,0-2-2H22V2H20V4H18V2H16V4H14V2H12V4H10V2H8V4H6A2,2,0,0,0,4,6V8H2v2H4v2H2v2H4v2H2v2H4v2H2v2H4v2H2v2H4v2A2,2,0,0,0,6,28H8v2h2V28h2v2h2V28h2v2h2V28h2v2h2V28h2A2,2,0,0,0,28,26V24h2V22H28V20h2V18H28V16h2V14H28V12h2V10H28V8ZM26,26H6V6H26Z" />
                <rect x="10" y="10" width="12" height="12" />
              </svg>
              <span style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '9.5px', whiteSpace: 'nowrap' }}>
                {readableModelText}
              </span>
            </div>
            {conf !== undefined && conf !== null && (
              <span style={{ color: confColor, fontWeight: 'bold', fontSize: '8.5px', marginLeft: '13px' }}>
                {(conf * 100).toFixed(1)}%
              </span>
            )}
          </div>
        );
      }
      
      return (
        <div style={{ display: 'flex', flexDirection: 'row', gap: '6px', alignItems: 'center', flexWrap: 'nowrap' }}>
          {modelName && modelName !== '-' ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <svg width="12" height="12" viewBox="0 0 32 32" style={{ fill: '#4589ff', flexShrink: 0 }}>
                <path d="M26,8V6a2,2,0,0,0-2-2H22V2H20V4H18V2H16V4H14V2H12V4H10V2H8V4H6A2,2,0,0,0,4,6V8H2v2H4v2H2v2H4v2H2v2H4v2H2v2H4v2H2v2H4v2A2,2,0,0,0,6,28H8v2h2V28h2v2h2V28h2v2h2V28h2v2h2V28h2A2,2,0,0,0,28,26V24h2V22H28V20h2V18H28V16h2V14H28V12h2V10H28V8ZM26,26H6V6H26Z" />
                <rect x="10" y="10" width="12" height="12" />
              </svg>
              <span style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '11px', whiteSpace: 'nowrap' }}>
                {readableModelText}
              </span>
            </div>
          ) : (
            <span>-</span>
          )}
          {conf !== undefined && conf !== null && (
            <span style={{ color: confColor, fontWeight: 'bold', fontSize: '10px', whiteSpace: 'nowrap' }}>
              {(conf * 100).toFixed(1)}%
            </span>
          )}
        </div>
      );
    }
    return value;
  };

  return (
    <>
      <GlobalTable
        title={title}
        description={trades.length === 0 ? "No trades" : undefined}
        headers={headers}
        initialData={rows}
        formatCell={formatCell}
        onViewDetails={handleViewDetails}
        hideSearch={hideSearch}
        hidePagination={hidePagination}
        onReload={onReload}
        compact={compact}
      />

      {mounted && selectedTrade && (
        <GlobalDetailTable 
          id={selectedTrade.trade_id} 
          type="trade"
          dataObj={selectedTrade}
          onClose={() => setSelectedTrade(null)} 
        />
      )}

      {mounted && selectedSignalId !== null && (
        <GlobalDetailTable 
          id={selectedSignalId} 
          type="signal"
          onClose={() => setSelectedSignalId(null)} 
        />
      )}
    </>
  );
}
