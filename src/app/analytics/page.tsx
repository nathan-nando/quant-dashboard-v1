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
        <h1 style={{ marginBottom: "1rem" }}>System Analytics</h1>
        <p style={{ marginBottom: "2rem", color: "#a8a8a8" }}>Historical performance evaluation of the trading system.</p>
      </Column>

      <Column lg={16} md={8} sm={4} style={{ marginBottom: "1rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.25rem" }}>
          <Tile style={{ padding: "1.5rem", height: "100%" }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: "0.5rem" }}>
              <Wallet size={16} color="#a8a8a8" />
              <p style={{ fontSize: "14px", color: "#a8a8a8", margin: 0 }}>Total PnL</p>
            </div>
            <h2 style={{ margin: 0, color: analytics?.total_pnl >= 0 ? "#24a148" : "#fa4d56" }}>
              {analytics ? `$${analytics.total_pnl.toFixed(2)}` : "..."}
            </h2>
          </Tile>

          <Tile style={{ padding: "1.5rem", height: "100%" }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: "0.5rem" }}>
              <CheckmarkOutline size={16} color="#a8a8a8" />
              <p style={{ fontSize: "14px", color: "#a8a8a8", margin: 0 }}>Win Rate</p>
            </div>
            <h2 style={{ margin: 0, color: "#f4f4f4" }}>
              {analytics ? `${analytics.win_rate.toFixed(1)}%` : "..."}
            </h2>
          </Tile>

          <Tile style={{ padding: "1.5rem", height: "100%" }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: "0.5rem" }}>
              <ChartLine size={16} color="#a8a8a8" />
              <p style={{ fontSize: "14px", color: "#a8a8a8", margin: 0 }}>Profit Factor</p>
            </div>
            <h2 style={{ margin: 0, color: "#f4f4f4" }}>
              {analytics ? analytics.profit_factor.toFixed(2) : "..."}
            </h2>
          </Tile>

          <Tile style={{ padding: "1.5rem", height: "100%" }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: "0.5rem" }}>
              <ArrowDownRight size={16} color="#a8a8a8" />
              <p style={{ fontSize: "14px", color: "#a8a8a8", margin: 0 }}>Max Drawdown</p>
            </div>
            <h2 style={{ margin: 0, color: "#fa4d56" }}>
              {analytics ? `${analytics.max_drawdown.toFixed(1)}%` : "..."}
            </h2>
          </Tile>
          
          <Tile style={{ padding: "1.5rem", height: "100%" }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: "0.5rem" }}>
              <List size={16} color="#a8a8a8" />
              <p style={{ fontSize: "14px", color: "#a8a8a8", margin: 0 }}>Total Trades</p>
            </div>
            <h2 style={{ margin: 0, color: "#f4f4f4" }}>
              {analytics ? analytics.total_trades : "..."}
            </h2>
          </Tile>

          <Tile style={{ padding: "1.5rem", height: "100%" }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: "0.5rem" }}>
              <Analytics size={16} color="#a8a8a8" />
              <p style={{ fontSize: "14px", color: "#a8a8a8", margin: 0 }}>Sharpe Ratio (Est.)</p>
            </div>
            <h2 style={{ margin: 0, color: "#f4f4f4" }}>
              {analytics ? analytics.sharpe_ratio.toFixed(2) : "..."}
            </h2>
          </Tile>
        </div>
      </Column>
    </Grid>
  );
}
