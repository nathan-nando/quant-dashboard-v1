"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/config/env";

interface ConnStatus {
  ok: boolean;
  latencyMs: number | null;
  error?: string;
  resolvedUrl?: string;
}

export default function BackendDebugPanel() {
  const [status, setStatus] = useState<ConnStatus>({ ok: false, latencyMs: null });
  const [probing, setProbing] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const probe = async () => {
    setProbing(true);
    const endpoint = `${API_BASE_URL}/dashboard/daily_stats?symbol=XAUUSD`;

    // Resolve the full URL (handles relative paths like /api-proxy)
    let resolvedUrl = endpoint;
    if (typeof window !== "undefined" && endpoint.startsWith("/")) {
      resolvedUrl = `${window.location.origin}${endpoint}`;
    }

    const t0 = performance.now();
    try {
      // Use AbortController for broad browser compatibility (not AbortSignal.timeout)
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(endpoint, {
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timer);

      const latencyMs = Math.round(performance.now() - t0);
      setStatus({
        ok: res.ok,
        latencyMs,
        resolvedUrl,
        error: res.ok ? undefined : `HTTP ${res.status} ${res.statusText}`,
      });
    } catch (e: unknown) {
      const latencyMs = Math.round(performance.now() - t0);
      let errMsg = "Unknown error";
      if (e instanceof Error) {
        errMsg = e.name === "AbortError" ? "Timeout (5s)" : e.message;
      }
      setStatus({ ok: false, latencyMs, resolvedUrl, error: errMsg });
    }
    setLastChecked(new Date());
    setProbing(false);
  };

  useEffect(() => {
    probe();
    const id = setInterval(probe, 10_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dot = status.ok ? "#42be65" : "#fa4d56";
  const bg = status.ok ? "rgba(66,190,101,0.08)" : "rgba(250,77,86,0.08)";
  const border = status.ok ? "rgba(66,190,101,0.35)" : "rgba(250,77,86,0.35)";

  return (
    <div
      id="backend-debug-panel"
      style={{
        position: "fixed",
        bottom: 16,
        right: 16,
        zIndex: 9999,
        background: "rgba(22,22,22,0.92)",
        backdropFilter: "blur(8px)",
        border: `1px solid ${border}`,
        borderRadius: 8,
        padding: "10px 14px",
        minWidth: 300,
        maxWidth: 360,
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 11,
        color: "#f4f4f4",
        boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
        transition: "border-color 0.4s",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: dot, display: "inline-block", boxShadow: `0 0 6px ${dot}`, flexShrink: 0 }} />
        <span style={{ fontWeight: 600, letterSpacing: "0.05em", color: "#c6c6c6" }}>BACKEND DEBUG</span>
        <button
          onClick={probe}
          disabled={probing}
          title="Probe now"
          style={{ marginLeft: "auto", background: "transparent", border: "1px solid #525252", borderRadius: 4, color: "#a8a8a8", fontSize: 10, padding: "2px 7px", cursor: probing ? "default" : "pointer", opacity: probing ? 0.5 : 1 }}
        >
          {probing ? "…" : "↺"}
        </button>
      </div>

      {/* API_BASE_URL (config value) */}
      <div style={{ marginBottom: 6 }}>
        <span style={{ color: "#8d8d8d" }}>API_BASE_URL</span>
        <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 4, padding: "3px 7px", marginTop: 2, wordBreak: "break-all", color: "#f4f4f4", fontWeight: 600 }}>
          {API_BASE_URL}
        </div>
      </div>

      {/* Resolved full URL */}
      {status.resolvedUrl && (
        <div style={{ marginBottom: 6 }}>
          <span style={{ color: "#8d8d8d" }}>Resolved URL</span>
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid #393939", borderRadius: 4, padding: "3px 7px", marginTop: 2, wordBreak: "break-all", color: "#a8a8a8", fontSize: 10 }}>
            {status.resolvedUrl}
          </div>
        </div>
      )}

      {/* Status + Latency */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: status.error ? 4 : 0 }}>
        <div>
          <span style={{ color: "#8d8d8d" }}>Status </span>
          <span style={{ color: dot, fontWeight: 600 }}>{status.ok ? "CONNECTED" : "ERROR"}</span>
        </div>
        {status.latencyMs !== null && (
          <div>
            <span style={{ color: "#8d8d8d" }}>Latency </span>
            <span style={{ color: status.latencyMs < 200 ? "#42be65" : status.latencyMs < 800 ? "#f1c21b" : "#fa4d56", fontWeight: 600 }}>
              {status.latencyMs}ms
            </span>
          </div>
        )}
      </div>

      {/* Error detail */}
      {status.error && (
        <div style={{ background: "rgba(250,77,86,0.1)", border: "1px solid rgba(250,77,86,0.3)", borderRadius: 4, padding: "3px 7px", marginTop: 4, color: "#fa4d56", fontSize: 10, wordBreak: "break-all" }}>
          ⚠ {status.error}
        </div>
      )}

      {/* Last checked */}
      {lastChecked && (
        <div style={{ marginTop: 6, color: "#6f6f6f", fontSize: 10 }}>
          last probe: {lastChecked.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
