"use client";

import { Grid, Column, Tile } from "@carbon/react";
import { Wallet, CheckmarkOutline, ChartLine, ArrowDownRight, List, Analytics } from "@carbon/icons-react";
import { useEffect, useState } from "react";

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/dashboard/analytics")
      .then(res => res.json())
      .then(data => {
        setAnalytics(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load analytics", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ padding: '2rem' }}>Loading analytics...</div>;

  return (
    <Grid fullWidth style={{ maxWidth: '100%', padding: '0 2rem' }}>
      <Column lg={16} md={8} sm={4} className="landing-page__banner">
        <h3 style={{ marginBottom: "1rem", fontWeight: 400 }}>Analytics</h3>
      </Column>

      <Column lg={16} md={8} sm={4} style={{ marginBottom: "1rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.25rem" }}>
          <Tile style={{ padding: "1rem", height: "100%" }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: "0.25rem" }}>
              <Wallet size={16} color="#a8a8a8" />
              <p style={{ fontSize: "12px", color: "#a8a8a8", margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>Total PnL</p>
            </div>
            <h3 style={{ margin: 0, fontWeight: 600, color: analytics?.total_pnl >= 0 ? "#24a148" : "#fa4d56" }}>
              {analytics ? `$${analytics.total_pnl.toFixed(2)}` : "..."}
            </h3>
          </Tile>

          <Tile style={{ padding: "1rem", height: "100%" }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: "0.25rem" }}>
              <CheckmarkOutline size={16} color="#a8a8a8" />
              <p style={{ fontSize: "12px", color: "#a8a8a8", margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>Win Rate</p>
            </div>
            <h3 style={{ margin: 0, fontWeight: 600, color: "#f4f4f4" }}>
              {analytics ? `${analytics.win_rate.toFixed(1)}%` : "..."}
            </h3>
          </Tile>

          <Tile style={{ padding: "1rem", height: "100%" }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: "0.25rem" }}>
              <ChartLine size={16} color="#a8a8a8" />
              <p style={{ fontSize: "12px", color: "#a8a8a8", margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>Profit Factor</p>
            </div>
            <h3 style={{ margin: 0, fontWeight: 600, color: "#f4f4f4" }}>
              {analytics ? analytics.profit_factor.toFixed(2) : "..."}
            </h3>
          </Tile>

          <Tile style={{ padding: "1rem", height: "100%" }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: "0.25rem" }}>
              <ArrowDownRight size={16} color="#a8a8a8" />
              <p style={{ fontSize: "12px", color: "#a8a8a8", margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>Max Drawdown</p>
            </div>
            <h3 style={{ margin: 0, fontWeight: 600, color: "#fa4d56" }}>
              {analytics ? `${analytics.max_drawdown.toFixed(1)}%` : "..."}
            </h3>
          </Tile>
          
          <Tile style={{ padding: "1rem", height: "100%" }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: "0.25rem" }}>
              <List size={16} color="#a8a8a8" />
              <p style={{ fontSize: "12px", color: "#a8a8a8", margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Trades</p>
            </div>
            <h3 style={{ margin: 0, fontWeight: 600, color: "#f4f4f4" }}>
              {analytics ? analytics.total_trades : "..."}
            </h3>
          </Tile>

          <Tile style={{ padding: "1rem", height: "100%" }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: "0.25rem" }}>
              <Analytics size={16} color="#a8a8a8" />
              <p style={{ fontSize: "12px", color: "#a8a8a8", margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>Sharpe Ratio (Est.)</p>
            </div>
            <h3 style={{ margin: 0, fontWeight: 600, color: "#f4f4f4" }}>
              {analytics ? analytics.sharpe_ratio.toFixed(2) : "..."}
            </h3>
          </Tile>
        </div>
      </Column>
    </Grid>
  );
}
