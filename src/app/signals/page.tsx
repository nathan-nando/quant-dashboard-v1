"use client";

import { Grid, Column, Tag } from "@carbon/react";
import { useState } from "react";
import GlobalTable from "../../components/GlobalTable";
import GlobalDetailTable from "../../components/GlobalDetailTable";

const getRegimeFormat = (regime: string) => {
  if (!regime) return { text: 'UNKNOWN', color: '#f4f4f4' };
  if (regime === 'TREND_BULL') return { text: 'Bull Trend', color: '#24a148' }; // Green
  if (regime === 'TREND_BEAR') return { text: 'Bear Trend', color: '#fa4d56' }; // Red
  if (regime === 'VOLATILE_CHOP') return { text: 'Volatile Chop', color: '#f1c21b' }; // Yellow
  if (regime === 'MEAN_REVERTING') return { text: 'Mean Reverting', color: '#4589ff' }; // Blue
  return { text: regime, color: '#f4f4f4' };
};

export default function SignalsPage() {
  const headers = [
    { key: "timestamp", header: "Time" },
    { key: "symbol", header: "Symbol" },
    { key: "timeframe", header: "Timeframe" },
    { key: "direction", header: "Direction" },
    { key: "confidence", header: "Confidence" },
    { key: "regime", header: "Regime" },
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
              const readableVal = value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : '';
              return <span style={{ color: value === 'BUY' ? '#24a148' : value === 'SELL' ? '#fa4d56' : '#f4f4f4', fontWeight: 'bold' }}>{readableVal}</span>;
            }
            if (col.includes("confidence")) {
              const conf = Number(value);
              const color = conf >= 0.7 ? '#24a148' : conf >= 0.5 ? '#f1c21b' : '#fa4d56';
              return <span style={{ color, fontWeight: 'bold' }}>{(conf * 100).toFixed(2)}%</span>;
            }
            if (col.includes("regime")) {
              const format = getRegimeFormat(value);
              return <span style={{ color: format.color, fontWeight: 'bold' }}>{format.text}</span>;
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
