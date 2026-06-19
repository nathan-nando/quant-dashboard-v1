"use client";

import React from "react";
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
  Tag
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
}

interface TradeHistoryTableProps {
  trades: Trade[];
}

export default function TradeHistoryTable({ trades }: TradeHistoryTableProps) {
  // Carbon DataTable requires 'id' property
  const rows = trades.map((trade, idx) => ({
    ...trade,
    id: trade.trade_id || `trade-${idx}`,
    formatted_entry_time: new Date(trade.entry_time).toLocaleString(),
    formatted_exit_time: new Date(trade.exit_time).toLocaleString(),
    formatted_pnl_money: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(trade.pnl_money),
    formatted_entry_price: trade.entry_price.toFixed(2),
    formatted_exit_price: trade.exit_price.toFixed(2),
    formatted_volume: trade.volume.toFixed(2),
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
    if (cellId.endsWith(":formatted_pnl_money")) {
      const isProfit = value.includes("-") === false && value !== "$0.00";
      const pnlColor = isProfit ? "#24a148" : (value.includes("-") ? "#da1e28" : "#c6c6c6");
      return <span style={{ color: pnlColor, fontWeight: 'bold' }}>{value}</span>;
    }
    return value;
  };

  return (
    <GlobalTable
      title="Trade History"
      description={trades.length === 0 ? "No trades executed during this simulation." : undefined}
      headers={headers}
      initialData={rows}
      formatCell={formatCell}
    />
  );
}
