"use client";

import { Grid, Column } from "@carbon/react";
import GlobalTable from "../../components/GlobalTable";

export default function TransactionsPage() {
  const headers = [
    { key: "entry_time", header: "Entry Time" },
    { key: "symbol", header: "Symbol" },
    { key: "direction", header: "Direction" },
    { key: "entry_price", header: "Entry Price" },
    { key: "size", header: "Size" },
    { key: "status", header: "Status" },
    { key: "pnl", header: "PnL" },
  ];

  const formatCell = (cellId: string, value: any) => {
    if (cellId.endsWith(':pnl') && value !== null && value !== undefined) {
      return (
        <span style={{ color: value >= 0 ? '#24a148' : '#fa4d56' }}>
          ${Number(value).toFixed(2)}
        </span>
      );
    }
    return value;
  };

  return (
    <Grid fullWidth style={{ maxWidth: '100%', padding: '0 2rem' }}>
      <Column lg={16} md={8} sm={4} className="landing-page__banner">
        <h1 style={{ marginBottom: "1rem" }}>Transactions (Trades)</h1>
      </Column>
      <Column lg={16} md={8} sm={4}>
        <GlobalTable 
          title="Trade History"
          headers={headers}
          fetchUrl="http://127.0.0.1:8000/api/dashboard/trades"
          formatCell={formatCell}
        />
      </Column>
    </Grid>
  );
}
