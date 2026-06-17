"use client";

import { Grid, Column, Tile } from "@carbon/react";
import { useEffect, useState } from "react";

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/dashboard/analytics")
      .then(res => res.json())
      .then(data => setMetrics(data))
      .catch(err => console.error("Failed to fetch analytics:", err));
  }, []);

  return (
    <Grid>
      <Column lg={16} md={8} sm={4} className="landing-page__banner">
        <h1 style={{ marginBottom: "1rem" }}>Analytics & Metrics</h1>
        <p style={{ marginBottom: "2rem" }}>Performance statistics of the Quant Engine.</p>
      </Column>
      
      <Column lg={4} md={4} sm={4}>
        <Tile>
          <h4>Win Rate</h4>
          <h2 style={{marginTop: "1rem", color: metrics?.win_rate > 50 ? "#24a148" : "#fa4d56"}}>
            {metrics ? `${metrics.win_rate}%` : "Loading..."}
          </h2>
          <p style={{marginTop: "0.5rem", fontSize: "0.8rem", color: "#a8a8a8"}}>Out of {metrics?.total_trades || 0} trades</p>
        </Tile>
      </Column>
      
      <Column lg={4} md={4} sm={4}>
        <Tile>
          <h4>Profit Factor</h4>
          <h2 style={{marginTop: "1rem", color: metrics?.profit_factor > 1 ? "#24a148" : "#fa4d56"}}>
            {metrics ? metrics.profit_factor : "..."}
          </h2>
        </Tile>
      </Column>

      <Column lg={4} md={4} sm={4}>
        <Tile>
          <h4>Total Net PnL</h4>
          <h2 style={{marginTop: "1rem", color: metrics?.total_pnl >= 0 ? "#24a148" : "#fa4d56"}}>
            {metrics ? `$${metrics.total_pnl}` : "..."}
          </h2>
        </Tile>
      </Column>

      <Column lg={4} md={4} sm={4}>
        <Tile>
          <h4>Max Drawdown</h4>
          <h2 style={{marginTop: "1rem", color: "#fa4d56"}}>
            {metrics ? `${metrics.max_drawdown}%` : "..."}
          </h2>
        </Tile>
      </Column>
      
      <Column lg={16} md={8} sm={4} style={{marginTop: "2rem"}}>
        <Tile>
          <h4>Monthly Performance</h4>
          <div style={{height: "200px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#262626", marginTop: "1rem"}}>
            <p style={{color: "#a8a8a8"}}>Equity Curve Chart (Coming Soon when Model is active)</p>
          </div>
        </Tile>
      </Column>
    </Grid>
  );
}
