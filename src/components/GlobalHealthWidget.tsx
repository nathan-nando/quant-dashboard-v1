"use client";

import React, { useEffect, useState } from "react";
import { Tile, ProgressBar } from "@carbon/react";
import { Activity, Warning, CheckmarkOutline, ErrorOutline } from "@carbon/icons-react";
import { API_BASE_URL } from '@/config/env';

export default function GlobalHealthWidget({ models }: { models: any[] }) {
  const [healthData, setHealthData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHealth = async () => {
      setLoading(true);
      const data = [];
      for (const m of models) {
        if (m.status === "Active") {
          try {
            const res = await fetch(`${API_BASE_URL}/models/${m.id}/health`);
            if (res.ok) {
              const h = await res.json();
              data.push(h);
            }
          } catch (e) {
            console.error("Failed to fetch health for", m.name);
          }
        }
      }
      setHealthData(data);
      setLoading(false);
    };

    if (models.length > 0) {
      fetchHealth();
    } else {
      setLoading(false);
    }
  }, [models]);

  const formatStatusText = (status: string) => {
    if (!status) return "";
    if (status === "INSUFFICIENT_DATA") return "Insufficient Data";
    return status.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
  };

  if (loading) return <ProgressBar label="Loading model health..." />;

  if (healthData.length === 0) {
    return (
      <Tile>
        <p>No active models to monitor. Please activate a model to see health metrics.</p>
      </Tile>
    );
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', width: '100%' }}>
      {healthData.map((h, i) => (
        <Tile key={i} style={{ borderTop: h.status === "HEALTHY" ? "4px solid #24a148" : h.status === "WARNING" ? "4px solid #f1c21b" : h.status === "CRITICAL" ? "4px solid #da1e28" : "4px solid #8d8d8d", margin: 0, padding: "0.75rem", flex: "0 1 auto", width: "fit-content", minWidth: "210px" }}>
          <h5 style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.75rem", fontSize: "0.95rem", fontWeight: 600 }}>
            {h.status === "HEALTHY" && <CheckmarkOutline fill="#24a148" size={16} />}
            {h.status === "WARNING" && <Warning fill="#f1c21b" size={16} />}
            {h.status === "CRITICAL" && <ErrorOutline fill="#da1e28" size={16} />}
            {h.status === "INSUFFICIENT_DATA" && <Activity fill="#8d8d8d" size={16} />}
            {h.model_name}
          </h5>
          
          <div style={{ display: "grid", gridTemplateColumns: "80px max-content", gap: "0.4rem 1rem", fontSize: "0.75rem", color: "#e0e0e0" }}>
            <div>
              <span style={{ color: "#8d8d8d", display: "block", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: "1px" }}>Status</span>
              <span style={{ fontWeight: "bold", color: h.status === "HEALTHY" ? "#24a148" : h.status === "WARNING" ? "#f1c21b" : h.status === "CRITICAL" ? "#da1e28" : "#8d8d8d" }}>
                {formatStatusText(h.status)}
              </span>
            </div>
            <div>
              <span style={{ color: "#8d8d8d", display: "block", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: "1px" }}>Win Rate</span>
              <span style={{ fontWeight: 600 }}>{(h.rolling_win_rate * 100).toFixed(1)}%</span>
            </div>
            <div>
              <span style={{ color: "#8d8d8d", display: "block", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: "1px" }}>Live Trades</span>
              <span style={{ fontWeight: 600 }}>{h.total_trades}</span>
            </div>
            <div>
              <span style={{ color: "#8d8d8d", display: "block", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: "1px" }}>Avg Conf (Win)</span>
              <span style={{ fontWeight: 600 }}>{h.average_confidence_win?.toFixed(3) || "0.000"}</span>
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <span style={{ color: "#8d8d8d", display: "block", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: "1px" }}>Avg Conf (Loss)</span>
              <span style={{ fontWeight: 600 }}>{h.average_confidence_loss?.toFixed(3) || "0.000"}</span>
            </div>
          </div>
        </Tile>
      ))}
    </div>
  );
}
