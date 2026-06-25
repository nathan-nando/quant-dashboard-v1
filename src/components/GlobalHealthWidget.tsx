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

  if (loading) return <ProgressBar label="Loading model health..." />;

  if (healthData.length === 0) {
    return (
      <Tile>
        <p>No active models to monitor. Please activate a model to see health metrics.</p>
      </Tile>
    );
  }

  return (
    <div className="model-health-grid">
      {healthData.map((h, i) => (
        <Tile key={i} style={{ borderTop: h.status === "HEALTHY" ? "4px solid #24a148" : h.status === "WARNING" ? "4px solid #f1c21b" : h.status === "CRITICAL" ? "4px solid #da1e28" : "4px solid #8d8d8d", margin: 0 }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            {h.status === "HEALTHY" && <CheckmarkOutline fill="#24a148" size={24} />}
            {h.status === "WARNING" && <Warning fill="#f1c21b" size={24} />}
            {h.status === "CRITICAL" && <ErrorOutline fill="#da1e28" size={24} />}
            {h.status === "INSUFFICIENT_DATA" && <Activity fill="#8d8d8d" size={24} />}
            {h.model_name}
          </h3>
          
          <div style={{ marginBottom: "0.5rem" }}>
            <strong>Status:</strong> <span style={{ fontWeight: "bold", color: h.status === "HEALTHY" ? "#24a148" : h.status === "WARNING" ? "#f1c21b" : h.status === "CRITICAL" ? "#da1e28" : "#8d8d8d" }}>{h.status}</span>
          </div>
          <div style={{ marginBottom: "0.5rem" }}>
            <strong>Rolling Win Rate:</strong> {(h.rolling_win_rate * 100).toFixed(1)}%
          </div>
          <div style={{ marginBottom: "0.5rem" }}>
            <strong>Total Live Trades:</strong> {h.total_trades}
          </div>
          <div style={{ marginBottom: "0.5rem" }}>
            <strong>Avg Confidence (Win):</strong> {h.average_confidence_win?.toFixed(3) || "0.000"}
          </div>
          <div>
            <strong>Avg Confidence (Loss):</strong> {h.average_confidence_loss?.toFixed(3) || "0.000"}
          </div>
        </Tile>
      ))}
    </div>
  );
}
