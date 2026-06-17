"use client";

import { Grid, Column } from "@carbon/react";
import GlobalTable from "../../components/GlobalTable";

export default function SignalsPage() {
  const headers = [
    { key: "timestamp", header: "Time" },
    { key: "symbol", header: "Symbol" },
    { key: "timeframe", header: "Timeframe" },
    { key: "direction", header: "Direction" },
    { key: "confidence", header: "Confidence" },
    { key: "status", header: "Status" },
  ];

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
        />
      </Column>
    </Grid>
  );
}
