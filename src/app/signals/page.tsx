"use client";

import { Grid, Column, Tag } from "@carbon/react";
import { useState } from "react";
import GlobalTable from "../../components/GlobalTable";
import GlobalDetailTable from "../../components/GlobalDetailTable";

export default function SignalsPage() {
  const headers = [
    { key: "timestamp", header: "Time" },
    { key: "symbol", header: "Symbol" },
    { key: "timeframe", header: "Timeframe" },
    { key: "direction", header: "Direction" },
    { key: "confidence", header: "Confidence" },
    { key: "status", header: "Status" },
  ];

  const [selectedSignal, setSelectedSignal] = useState<number | null>(null);

  return (
    <Grid fullWidth style={{ maxWidth: '100%', padding: '0 2rem' }}>
      <Column lg={16} md={8} sm={4} className="landing-page__banner">
        <h1 style={{ marginBottom: "1rem" }}>All Signals</h1>
      </Column>
      <Column lg={16} md={8} sm={4}>
        <GlobalTable 
          title="Signal History"
          headers={headers}
          fetchUrl="http://127.0.0.1:8000/api/dashboard/signals"
          onViewDetails={(id) => setSelectedSignal(Number(id))}
          formatCell={(cellId, value) => {
            const col = cellId.split('__')[1] || cellId.split(':').pop() || '';
            if (col.includes("timestamp") && value) {
              return new Date(value).toLocaleString();
            }
            if (col.includes("status")) {
              return <Tag type={value === "NEW" ? "blue" : value === "PENDING_EXECUTION" ? "cyan" : "gray"}>{value}</Tag>;
            }
            if (col.includes("direction")) {
              return <span style={{ color: value === 'BUY' ? '#24a148' : value === 'SELL' ? '#fa4d56' : '#f4f4f4', fontWeight: 'bold' }}>{value}</span>;
            }
            if (col.includes("confidence")) {
              return `${(Number(value) * 100).toFixed(2)}%`;
            }
            return value;
          }}
        />
      </Column>
      
      <GlobalDetailTable 
        signalId={selectedSignal} 
        onClose={() => setSelectedSignal(null)} 
      />
    </Grid>
  );
}
