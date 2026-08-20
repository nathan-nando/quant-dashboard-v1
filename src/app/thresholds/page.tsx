"use client";

import { Grid, Column, Tile, FormGroup, NumberInput, Button, Toggle, ToastNotification, Select, SelectItem } from "@carbon/react";
import { View, ViewOff, Save } from "@carbon/icons-react";
import { useEffect, useState } from "react";
import { API_BASE_URL } from '@/config/env';

export default function ThresholdsPage() {
  const [config, setConfig] = useState<any>({
    engine_active: true,
    auto_execution_enabled: false,
    use_equity_kill_switch: true,
    max_drawdown_equity_pct: 10.0,
    use_daily_kill_switch: true,
    max_daily_drawdown_pct: 5.0,
    risk_control_mode: "manual",
    risk_per_trade_pct: 1.0,
    max_open_positions: 1,
    trading_mode: "SCALPING",
    scalping_timeframe: "RANGE_1.5",
    scalping_tp_pips: 15.0,
    scalping_sl_pips: 5.0,
    scalping_max_holding_minutes: 15,
    scalping_max_trades_per_day: 80,
    scalping_max_trades_per_hour: 10,
    scalping_max_spread_pips: 3.0,
    scalping_min_atr_pips: 1.0,
    scalping_max_consecutive_losses: 3,
    use_macro_model: true,
    scalping_base_confidence: 0.45,
    macro_soft_switch_sensitivity: 0.15,
    macro_refresh_interval_minutes: 15,
    macro_news_buffer_minutes: 15,
    macro_vix_pause_threshold: 25.0,
    range_bar_size_usd: 1.50,
    pyramiding_enabled: true,
    pyramiding_max_layers: 4,
    pyramiding_step_pips: 15.0,
    trailing_stop_pips: 20.0,
    close_on_opposite_range_bar: false
  });

  const [originalConfig, setOriginalConfig] = useState<any>(null);
  
  const [visibleCategories, setVisibleCategories] = useState({
    "risk-execution": true,
    "macro-soft-switch": true,
    "scalping-limits": true,
    "range-pyramiding": true
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ kind: any, title: string, subtitle: string, caption?: string } | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/configurations/thresholds`)
      .then(res => res.json())
      .then(data => {
        setConfig((prev: any) => ({ ...prev, ...data }));
        setOriginalConfig((prev: any) => ({ ...prev, ...data }));
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch thresholds:", err);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...config, trading_mode: "SCALPING" };
      
      for (const key in payload) {
        if (key !== 'scalping_timeframe' && typeof payload[key] === 'string') {
          const parsed = Number(payload[key].replace(',', '.'));
          if (!isNaN(parsed)) {
            payload[key] = parsed;
          }
        }
      }

      const res = await fetch(`${API_BASE_URL}/configurations/thresholds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errText = await res.text();
        console.error("Server error:", errText);
        throw new Error(errText || "Server rejected the configuration");
      }
      setOriginalConfig({ ...payload });
      setConfig({ ...payload });
      setToastMsg({ kind: "success", title: "Configuration Saved", subtitle: "Scalping parameters updated successfully!", caption: new Date().toLocaleTimeString() });
    } catch (err: any) {
      setToastMsg({ kind: "error", title: "Error", subtitle: err.message || "Failed to save configuration.", caption: new Date().toLocaleTimeString() });
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (key: string, value: any) => {
    setConfig((prev: any) => ({ ...prev, [key]: value }));
  };

  const toggleCategory = (id: string) => {
    setVisibleCategories(prev => ({ ...prev, [id]: !prev[id as keyof typeof prev] }));
  };

  const hasChanges = (keys: string[]) => {
    if (!originalConfig) return false;
    return keys.some(key => config[key] !== originalConfig[key]);
  };

  const riskKeys = ["auto_execution_enabled", "use_equity_kill_switch", "max_drawdown_equity_pct", "use_daily_kill_switch", "max_daily_drawdown_pct", "risk_control_mode", "risk_per_trade_pct", "max_open_positions"];
  const macroKeys = ["use_macro_model", "scalping_base_confidence", "macro_soft_switch_sensitivity", "macro_refresh_interval_minutes", "macro_news_buffer_minutes", "macro_vix_pause_threshold"];
  const scalpingKeys = ["engine_active", "scalping_timeframe", "scalping_tp_pips", "scalping_sl_pips", "scalping_max_holding_minutes", "scalping_max_trades_per_day", "scalping_max_trades_per_hour", "scalping_max_spread_pips", "scalping_min_atr_pips", "scalping_max_consecutive_losses"];
  const rangePyramidKeys = ["range_bar_size_usd", "pyramiding_enabled", "pyramiding_max_layers", "pyramiding_step_pips", "trailing_stop_pips", "close_on_opposite_range_bar"];

  if (loading) return <div>Loading threshold configuration...</div>;

  return (
    <div style={{ padding: "1rem" }}>
      {toastMsg && (
        <div style={{ position: "fixed", top: "4rem", right: "2rem", zIndex: 9999 }}>
          <ToastNotification
            kind={toastMsg.kind}
            title={toastMsg.title}
            subtitle={toastMsg.subtitle}
            caption={toastMsg.caption}
            timeout={5000}
            onClose={() => setToastMsg(null)}
          />
        </div>
      )}

      <Grid className="dashboard-grid" style={{ padding: 0 }}>
        {/* CLEAN COMPACT HEADER MATCHING OTHER PAGES */}
        <Column lg={16} md={8} sm={4} className="landing-page__banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "0.1rem" }}>
          <h3 style={{ fontWeight: 400 }}>Threshold Configurations</h3>
          <Button renderIcon={Save} onClick={handleSave} disabled={saving} size="sm">
            {saving ? "Saving..." : "Save Configuration"}
          </Button>
        </Column>

        {/* PANEL 1: RISK & CAPITAL CONTROLS */}
        <Column sm={4} md={8} lg={16} style={{ marginBottom: "0.1rem" }}>
          <Tile style={{ borderLeft: hasChanges(riskKeys) ? "4px solid #f1c21b" : "none", padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h5 style={{ fontWeight: 600, color: "#f4f4f4" }}>🛡️ Risk & Capital Controls</h5>
              <Button 
                kind="ghost" 
                hasIconOnly 
                size="sm"
                iconDescription={visibleCategories["risk-execution"] ? "Hide" : "Show"}
                renderIcon={visibleCategories["risk-execution"] ? ViewOff : View}
                onClick={() => toggleCategory("risk-execution")}
              />
            </div>
            {visibleCategories["risk-execution"] && (
              <div style={{ marginTop: "0.75rem" }}>
                <div style={{ display: "flex", gap: "2.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                  <Toggle
                    id="auto_execution_enabled"
                    labelText="Auto Execution Mode"
                    labelA="Disabled"
                    labelB="Active"
                    toggled={config.auto_execution_enabled}
                    onToggle={(val) => updateConfig("auto_execution_enabled", val)}
                  />
                  <Toggle
                    id="use_equity_kill_switch"
                    labelText="Max Equity Drawdown Switch"
                    labelA="Disabled"
                    labelB="Active"
                    toggled={config.use_equity_kill_switch}
                    onToggle={(val) => updateConfig("use_equity_kill_switch", val)}
                  />
                  <Toggle
                    id="use_daily_kill_switch"
                    labelText="Max Daily Drawdown Switch"
                    labelA="Disabled"
                    labelB="Active"
                    toggled={config.use_daily_kill_switch}
                    onToggle={(val) => updateConfig("use_daily_kill_switch", val)}
                  />
                </div>

                <div style={{ display: "flex", gap: "0.1rem", marginBottom: "0.1rem", flexWrap: "wrap" }}>
                  <div style={{ width: "190px" }}>
                    <NumberInput
                      id="max_drawdown_equity_pct"
                      label="Max Equity DD (%)"
                      value={config.max_drawdown_equity_pct}
                      min={1} step={0.5}
                      onChange={(e: any, { value }: any) => updateConfig("max_drawdown_equity_pct", value)}
                    />
                  </div>
                  <div style={{ width: "190px" }}>
                    <NumberInput
                      id="max_daily_drawdown_pct"
                      label="Max Daily DD (%)"
                      value={config.max_daily_drawdown_pct}
                      min={1} step={0.5}
                      onChange={(e: any, { value }: any) => updateConfig("max_daily_drawdown_pct", value)}
                    />
                  </div>
                  <div style={{ width: "190px" }}>
                    <NumberInput
                      id="risk_per_trade_pct"
                      label="Risk Per Trade (%)"
                      value={config.risk_per_trade_pct}
                      min={0.1} max={5.0} step={0.1}
                      onChange={(e: any, { value }: any) => updateConfig("risk_per_trade_pct", value)}
                    />
                  </div>
                  <div style={{ width: "190px" }}>
                    <NumberInput
                      id="max_open_positions"
                      label="Max Open Positions"
                      value={config.max_open_positions}
                      min={1} max={5}
                      onChange={(e: any, { value }: any) => updateConfig("max_open_positions", value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </Tile>
        </Column>

        {/* PANEL 2: MACRO EVALUATOR & SOFT SWITCHING */}
        <Column sm={4} md={8} lg={16} style={{ marginBottom: "0.1rem" }}>
          <Tile style={{ borderLeft: hasChanges(macroKeys) ? "4px solid #f1c21b" : "none", padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h5 style={{ fontWeight: 600, color: "#f4f4f4" }}>🌐 Macro Evaluator & Dynamic Soft Switching</h5>
              <Button 
                kind="ghost" 
                hasIconOnly 
                size="sm"
                iconDescription={visibleCategories["macro-soft-switch"] ? "Hide" : "Show"}
                renderIcon={visibleCategories["macro-soft-switch"] ? ViewOff : View}
                onClick={() => toggleCategory("macro-soft-switch")}
              />
            </div>
            {visibleCategories["macro-soft-switch"] && (
              <div style={{ marginTop: "0.75rem" }}>
                <div style={{ display: "flex", gap: "2.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                  <Toggle
                    id="use_macro_model"
                    labelText="Macro Model Signal Gating Veto"
                    labelA="Disabled (Informational Only)"
                    labelB="Active (Engine Veto)"
                    toggled={config.use_macro_model !== undefined ? config.use_macro_model : true}
                    onToggle={(val) => updateConfig("use_macro_model", val)}
                  />
                </div>
                <div style={{ display: "flex", gap: "0.1rem", marginBottom: "0.1rem", flexWrap: "wrap" }}>
                  <div style={{ width: "190px" }}>
                    <NumberInput
                      id="scalping_base_confidence"
                      label="Base Scalper Confidence"
                      value={config.scalping_base_confidence}
                      min={0.1} max={0.9} step={0.05}
                      onChange={(e: any, { value }: any) => updateConfig("scalping_base_confidence", value)}
                    />
                  </div>
                  <div style={{ width: "190px" }}>
                    <NumberInput
                      id="macro_soft_switch_sensitivity"
                      label="Soft Switch Sensitivity"
                      value={config.macro_soft_switch_sensitivity}
                      min={0.05} max={0.4} step={0.05}
                      onChange={(e: any, { value }: any) => updateConfig("macro_soft_switch_sensitivity", value)}
                    />
                  </div>
                  <div style={{ width: "190px" }}>
                    <NumberInput
                      id="macro_refresh_interval_minutes"
                      label="Macro Refresh (Mins)"
                      value={config.macro_refresh_interval_minutes}
                      min={1} max={60}
                      onChange={(e: any, { value }: any) => updateConfig("macro_refresh_interval_minutes", value)}
                    />
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.1rem", marginBottom: "0.1rem", flexWrap: "wrap" }}>
                  <div style={{ width: "190px" }}>
                    <NumberInput
                      id="macro_news_buffer_minutes"
                      label="High-Impact News Buffer (Mins)"
                      value={config.macro_news_buffer_minutes}
                      min={1} max={60}
                      onChange={(e: any, { value }: any) => updateConfig("macro_news_buffer_minutes", value)}
                    />
                  </div>
                  <div style={{ width: "190px" }}>
                    <NumberInput
                      id="macro_vix_pause_threshold"
                      label="Max VIX Volatility Ceiling"
                      value={config.macro_vix_pause_threshold}
                      min={15} max={50}
                      onChange={(e: any, { value }: any) => updateConfig("macro_vix_pause_threshold", value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </Tile>
        </Column>

        {/* PANEL 3: SCALPING EXECUTION & TARGET LIMITS */}
        <Column sm={4} md={8} lg={16} style={{ marginBottom: "0.1rem" }}>
          <Tile style={{ borderLeft: hasChanges(scalpingKeys) ? "4px solid #f1c21b" : "none", padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h5 style={{ fontWeight: 600, color: "#f4f4f4" }}>⚡ Scalping Execution & Micro Limits</h5>
              <Button 
                kind="ghost" 
                hasIconOnly 
                size="sm"
                iconDescription={visibleCategories["scalping-limits"] ? "Hide" : "Show"}
                renderIcon={visibleCategories["scalping-limits"] ? ViewOff : View}
                onClick={() => toggleCategory("scalping-limits")}
              />
            </div>
            {visibleCategories["scalping-limits"] && (
              <div style={{ marginTop: "0.75rem" }}>
                <div style={{ display: "flex", gap: "2.5rem", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap" }}>
                  <Toggle
                    id="engine_active"
                    labelText="Master Scalping Engine Switch"
                    labelA="Offline"
                    labelB="Online"
                    toggled={config.engine_active}
                    onToggle={(val) => updateConfig("engine_active", val)}
                  />
                  <div style={{ width: "260px" }}>
                    <Select
                      id="scalping_timeframe"
                      labelText="Signal Trigger Mechanism"
                      value={config.scalping_timeframe || "RANGE_1.5"}
                      onChange={(e: any) => updateConfig("scalping_timeframe", e.target.value)}
                      size="md"
                    >
                      <SelectItem value="RANGE_1.5" text="⚡ Range Bar $1.50 (Event-Driven - Default)" />
                      <SelectItem value="M1" text="1 Minute (M1)" />
                      <SelectItem value="M5" text="5 Minutes (M5)" />
                      <SelectItem value="M15" text="15 Minutes (M15)" />
                      <SelectItem value="H1" text="1 Hour (H1)" />
                    </Select>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.1rem", marginBottom: "0.1rem", flexWrap: "wrap" }}>
                  <div style={{ width: "190px" }}><NumberInput id="scalping_sl_pips" label="Stop Loss (Pips)" value={config.scalping_sl_pips} min={1} max={50} step={0.5} onChange={(e: any, { value }: any) => updateConfig("scalping_sl_pips", value)} /></div>
                  <div style={{ width: "190px" }}><NumberInput id="scalping_tp_pips" label="Take Profit (Pips)" value={config.scalping_tp_pips} min={1} max={100} step={0.5} onChange={(e: any, { value }: any) => updateConfig("scalping_tp_pips", value)} /></div>
                  <div style={{ width: "190px" }}><NumberInput id="scalping_max_trades_per_hour" label="Max Trades / Hour" value={config.scalping_max_trades_per_hour} min={1} onChange={(e: any, { value }: any) => updateConfig("scalping_max_trades_per_hour", value)} /></div>
                  <div style={{ width: "190px" }}><NumberInput id="scalping_max_trades_per_day" label="Max Trades / Day" value={config.scalping_max_trades_per_day} min={1} max={500} onChange={(e: any, { value }: any) => updateConfig("scalping_max_trades_per_day", value)} /></div>
                </div>
                <div style={{ display: "flex", gap: "0.1rem", marginBottom: "0.1rem", flexWrap: "wrap" }}>
                  <div style={{ width: "190px" }}><NumberInput id="scalping_max_spread_pips" label="Max Spread (Pips)" value={config.scalping_max_spread_pips} min={0.1} max={10.0} step={0.1} onChange={(e: any, { value }: any) => updateConfig("scalping_max_spread_pips", value)} /></div>
                  <div style={{ width: "190px" }}><NumberInput id="scalping_min_atr_pips" label="Min Volatility ATR (Pips)" value={config.scalping_min_atr_pips} min={0.1} max={10.0} step={0.1} onChange={(e: any, { value }: any) => updateConfig("scalping_min_atr_pips", value)} /></div>
                  <div style={{ width: "190px" }}><NumberInput id="scalping_max_holding_minutes" label="Max Position Hold (Mins)" value={config.scalping_max_holding_minutes} min={1} max={120} onChange={(e: any, { value }: any) => updateConfig("scalping_max_holding_minutes", value)} /></div>
                  <div style={{ width: "190px" }}><NumberInput id="scalping_max_consecutive_losses" label="Max Consec. Losses" value={config.scalping_max_consecutive_losses} min={1} max={10} onChange={(e: any, { value }: any) => updateConfig("scalping_max_consecutive_losses", value)} /></div>
                </div>
              </div>
            )}
          </Tile>
        </Column>

        {/* PANEL 4: EVENT-DRIVEN RANGE BAR & PYRAMIDING CONTROLS */}
        <Column sm={4} md={8} lg={16} style={{ marginBottom: "0.1rem" }}>
          <Tile style={{ borderLeft: hasChanges(rangePyramidKeys) ? "4px solid #f1c21b" : "none", padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h5 style={{ fontWeight: 600, color: "#f4f4f4" }}>📈 Event-Driven Range Bar & Pyramiding Controls</h5>
              <Button 
                kind="ghost" 
                hasIconOnly 
                size="sm"
                iconDescription={visibleCategories["range-pyramiding"] ? "Hide" : "Show"}
                renderIcon={visibleCategories["range-pyramiding"] ? ViewOff : View}
                onClick={() => toggleCategory("range-pyramiding")}
              />
            </div>
            {visibleCategories["range-pyramiding"] && (
              <div style={{ marginTop: "0.75rem" }}>
                <div style={{ display: "flex", gap: "2.5rem", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap" }}>
                  <Toggle
                    id="pyramiding_enabled"
                    labelText="Pyramiding Scale-In Engine"
                    labelA="Disabled"
                    labelB="Active (House Money)"
                    toggled={config.pyramiding_enabled !== undefined ? config.pyramiding_enabled : true}
                    onToggle={(val) => updateConfig("pyramiding_enabled", val)}
                  />
                  <Toggle
                    id="close_on_opposite_range_bar"
                    labelText="Close Cluster on Opposite Bar"
                    labelA="Disabled"
                    labelB="Active (Auto-Reversal)"
                    toggled={config.close_on_opposite_range_bar || false}
                    onToggle={(val) => updateConfig("close_on_opposite_range_bar", val)}
                  />
                </div>

                <div style={{ display: "flex", gap: "0.1rem", marginBottom: "0.1rem", flexWrap: "wrap" }}>
                  <div style={{ width: "190px" }}>
                    <NumberInput
                      id="range_bar_size_usd"
                      label="Range Bar Size (USD)"
                      value={config.range_bar_size_usd || 1.50}
                      min={0.5} max={10.0} step={0.1}
                      onChange={(e: any, { value }: any) => updateConfig("range_bar_size_usd", value)}
                    />
                  </div>
                  <div style={{ width: "190px" }}>
                    <NumberInput
                      id="pyramiding_max_layers"
                      label="Max Pyramiding Layers"
                      value={config.pyramiding_max_layers || 4}
                      min={1} max={10}
                      onChange={(e: any, { value }: any) => updateConfig("pyramiding_max_layers", value)}
                    />
                  </div>
                  <div style={{ width: "190px" }}>
                    <NumberInput
                      id="pyramiding_step_pips"
                      label="Scale-In Step (Pips)"
                      value={config.pyramiding_step_pips || 15.0}
                      min={5.0} max={50.0} step={1.0}
                      onChange={(e: any, { value }: any) => updateConfig("pyramiding_step_pips", value)}
                    />
                  </div>
                  <div style={{ width: "190px" }}>
                    <NumberInput
                      id="trailing_stop_pips"
                      label="Cluster Trailing Stop (Pips)"
                      value={config.trailing_stop_pips || 20.0}
                      min={5.0} max={100.0} step={1.0}
                      onChange={(e: any, { value }: any) => updateConfig("trailing_stop_pips", value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </Tile>
        </Column>
      </Grid>
    </div>
  );
}
