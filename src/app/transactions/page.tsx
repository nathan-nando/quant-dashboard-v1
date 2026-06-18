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
    const col = cellId.split('__')[1] || cellId.split(':').pop() || '';
    
    if (col.includes("time") && value) {
      const d = new Date(value);
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

    if (col === 'pnl' && value !== null && value !== undefined) {
      return (
        <span style={{ color: value >= 0 ? '#24a148' : '#fa4d56' }}>
          ${Number(value).toFixed(2)}
        </span>
      );
    }
    return value;
  };

  return (
    <Grid>
      <Column lg={16} md={8} sm={4} className="landing-page__banner">
        <h3 style={{ marginBottom: "1rem", fontWeight: 400 }}>Transactions (Trades)</h3>
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
