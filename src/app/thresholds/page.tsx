"use client";

import { Grid, Column, Tile, FormGroup, NumberInput, Button, Toggle, ToastNotification, Tag } from "@carbon/react";
import { View, ViewOff, Save } from "@carbon/icons-react";
import { useEffect, useState } from "react";
import { API_BASE_URL } from '@/config/env';

export default function ThresholdsPage() {
  const [config, setConfig] = useState<any>({
    engine_active: true,
    enforce_meso_alignment: true,
    min_bar_velocity: 0.040,
    post_loss_cooldown_bars: 2,
    auto_execution_enabled: false,
    use_equity_kill_switch: true,
    max_drawdown_equity_pct: 10.0,
    use_daily_kill_switch: true,
    max_daily_drawdown_pct: 5.0,
    risk_control_mode: "manual",
    risk_per_trade_pct: 1.0,
    max_open_positions: 1,
    trading_mode: "SCALPING",
    scalping_tp_pips: 60.0,
    scalping_sl_pips: 40.0,
    scalping_max_holding_minutes: 15,
    scalping_max_trades_per_day: 80,
    scalping_max_trades_per_hour: 15,
    scalping_max_spread_pips: 3.0,
    scalping_min_atr_pips: 1.0,
    scalping_max_consecutive_losses: 3,
    scalping_consecutive_loss_cooldown_minutes: 10,
    scalping_max_runaway_streak: 3,
    use_macro_model: true,
    scalping_base_confidence: 0.65,
    macro_soft_switch_sensitivity: 0.10,
    macro_refresh_interval_minutes: 15,
    macro_news_buffer_minutes: 15,
    macro_vix_pause_threshold: 25.0,
    range_bar_size_usd: 2.00,
    pyramiding_enabled: true,
    pyramiding_max_layers: 4,
    pyramiding_step_pips: 15.0,
    cluster_trailing_stop_enabled: false,
    trailing_stop_pips: 35.0,
    close_on_opposite_range_bar: false
  });

  const [originalConfig, setOriginalConfig] = useState<any>(null);
  
  const [visibleCategories, setVisibleCategories] = useState({
    "range-engine": true,
    "macro-regime": true,
    "risk-capital": true,
    "position-pyramid": true
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ kind: any, title: string, subtitle: string, caption?: string } | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/configurations/thresholds`)
      .then(res => res.json())
      .then(data => {
        const merged = { ...config, ...data };
        setConfig(merged);
        setOriginalConfig(merged);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load thresholds:", err);
        setLoading(false);
      });
  }, []);

  const updateConfig = (key: string, value: any) => {
    setConfig((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/configurations/thresholds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        setOriginalConfig(config);
        setToastMsg({
          kind: "success",
          title: "Configuration Saved",
          subtitle: "Threshold updates were successfully synced to Redis and Quant Engines."
        });
      } else {
        throw new Error("API returned non-OK status");
      }
    } catch (err) {
      setToastMsg({
        kind: "error",
        title: "Save Failed",
        subtitle: "An error occurred while saving threshold settings."
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (id: string) => {
    setVisibleCategories(prev => ({ ...prev, [id]: !prev[id as keyof typeof prev] }));
  };

  const hasChanges = (keys: string[]) => {
    if (!originalConfig) return false;
    return keys.some(key => config[key] !== originalConfig[key]);
  };

  const rangeKeys = ["engine_active", "enforce_meso_alignment", "range_bar_size_usd", "min_bar_velocity"];
  const macroKeys = ["scalping_base_confidence", "macro_soft_switch_sensitivity", "macro_refresh_interval_minutes"];
  const riskKeys = ["auto_execution_enabled", "use_equity_kill_switch", "max_drawdown_equity_pct", "use_daily_kill_switch", "max_daily_drawdown_pct", "risk_per_trade_pct", "scalping_max_spread_pips", "macro_news_buffer_minutes", "macro_vix_pause_threshold", "scalping_max_consecutive_losses", "scalping_consecutive_loss_cooldown_minutes", "post_loss_cooldown_bars", "scalping_max_trades_per_hour", "scalping_max_trades_per_day"];
  const pyramidKeys = ["pyramiding_enabled", "pyramiding_max_layers", "pyramiding_step_pips", "cluster_trailing_stop_enabled", "trailing_stop_pips", "scalping_sl_pips", "scalping_tp_pips", "close_on_opposite_range_bar"];

  if (loading) return <div>Loading threshold configuration...</div>;

  const microSize = Number(config.range_bar_size_usd || 2.0);
  const mesoSize = (microSize * 3).toFixed(1);
  const macroSize = (microSize * 9).toFixed(1);

  return (
    <div style={{ padding: "0.25rem 0.5rem" }}>
      {toastMsg && (
        <div style={{ position: "fixed", top: "4rem", right: "1.5rem", zIndex: 9999 }}>
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
        <Column lg={16} md={8} sm={4} className="landing-page__banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "0.1rem" }}>
          <h3 style={{ fontWeight: 400 }}>Threshold & Engine Configurations</h3>
          <Button renderIcon={Save} onClick={handleSave} disabled={saving} size="sm">
            {saving ? "Saving..." : "Save Configuration"}
          </Button>
        </Column>

        <Column sm={4} md={8} lg={16} style={{ marginBottom: "0.1rem" }}>
          <Tile style={{ borderLeft: hasChanges(rangeKeys) ? "4px solid #f1c21b" : "none", padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h5 style={{ fontWeight: 600, color: "#f4f4f4" }}>⚡ 1. Multi-Scale Range Bar Engine</h5>
              <Button 
                kind="ghost" 
                hasIconOnly 
                size="sm"
                iconDescription={visibleCategories["range-engine"] ? "Hide" : "Show"}
                renderIcon={visibleCategories["range-engine"] ? ViewOff : View}
                onClick={() => toggleCategory("range-engine")}
              />
            </div>
            {visibleCategories["range-engine"] && (
              <div style={{ marginTop: "0.75rem" }}>
                <div style={{ display: "flex", gap: "2.5rem", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap" }}>
                  <Toggle
                    id="engine_active"
                    labelText="Master Engine Switch"
                    labelA="Offline"
                    labelB="Online"
                    toggled={config.engine_active}
                    onToggle={(val) => updateConfig("engine_active", val)}
                  />
                  <Toggle
                    id="enforce_meso_alignment"
                    labelText="Enforce Meso ($6.00) Alignment"
                    labelA="Disabled"
                    labelB="Active (Anti-Whipsaw)"
                    toggled={config.enforce_meso_alignment !== undefined ? config.enforce_meso_alignment : true}
                    onToggle={(val) => updateConfig("enforce_meso_alignment", val)}
                  />
                  <div style={{ width: "200px" }}>
                    <NumberInput
                      id="range_bar_size_usd"
                      label="Micro Range Size ($USD)"
                      value={config.range_bar_size_usd || 2.00}
                      min={0.5} max={10.0} step={0.1}
                      onChange={(e: any, { value }: any) => updateConfig("range_bar_size_usd", value)}
                    />
                  </div>
                  <div style={{ width: "200px" }}>
                    <NumberInput
                      id="min_bar_velocity"
                      label="Min Bar Velocity ($/s)"
                      value={config.min_bar_velocity || 0.040}
                      min={0.01} max={0.20} step={0.005}
                      onChange={(e: any, { value }: any) => updateConfig("min_bar_velocity", value)}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <span style={{ fontSize: "12px", color: "#c6c6c6" }}>Event-Driven Multi-Scale Hierarchy</span>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <Tag type="cyan" size="md">Micro: ${microSize.toFixed(2)}</Tag>
                      <Tag type="teal" size="md">Meso: ${mesoSize}</Tag>
                      <Tag type="purple" size="md">Macro: ${macroSize}</Tag>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Tile>
        </Column>

        <Column sm={4} md={8} lg={16} style={{ marginBottom: "0.1rem" }}>
          <Tile style={{ borderLeft: hasChanges(macroKeys) ? "4px solid #f1c21b" : "none", padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h5 style={{ fontWeight: 600, color: "#f4f4f4" }}>🌐 2. Macro & Regime Conviction Engine</h5>
              <Button 
                kind="ghost" 
                hasIconOnly 
                size="sm"
                iconDescription={visibleCategories["macro-regime"] ? "Hide" : "Show"}
                renderIcon={visibleCategories["macro-regime"] ? ViewOff : View}
                onClick={() => toggleCategory("macro-regime")}
              />
            </div>
            {visibleCategories["macro-regime"] && (
              <div style={{ marginTop: "0.75rem" }}>
                <div style={{ display: "flex", gap: "0.1rem", marginBottom: "0.1rem", flexWrap: "wrap" }}>
                  <div style={{ width: "190px" }}>
                    <NumberInput
                      id="scalping_base_confidence"
                      label="Base AI Confidence"
                      value={config.scalping_base_confidence || 0.65}
                      min={0.5} max={0.9} step={0.05}
                      onChange={(e: any, { value }: any) => updateConfig("scalping_base_confidence", value)}
                    />
                  </div>
                  <div style={{ width: "190px" }}>
                    <NumberInput
                      id="macro_soft_switch_sensitivity"
                      label="Conviction Sensitivity"
                      value={config.macro_soft_switch_sensitivity || 0.15}
                      min={0.05} max={0.4} step={0.05}
                      onChange={(e: any, { value }: any) => updateConfig("macro_soft_switch_sensitivity", value)}
                    />
                  </div>
                  <div style={{ width: "190px" }}>
                    <NumberInput
                      id="macro_refresh_interval_minutes"
                      label="Macro Refresh (Mins)"
                      value={config.macro_refresh_interval_minutes || 15}
                      min={1} max={60}
                      onChange={(e: any, { value }: any) => updateConfig("macro_refresh_interval_minutes", value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </Tile>
        </Column>

        <Column sm={4} md={8} lg={16} style={{ marginBottom: "0.1rem" }}>
          <Tile style={{ borderLeft: hasChanges(riskKeys) ? "4px solid #f1c21b" : "none", padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h5 style={{ fontWeight: 600, color: "#f4f4f4" }}>🛡️ 3. Unified Risk & Capital Engine</h5>
              <Button 
                kind="ghost" 
                hasIconOnly 
                size="sm"
                iconDescription={visibleCategories["risk-capital"] ? "Hide" : "Show"}
                renderIcon={visibleCategories["risk-capital"] ? ViewOff : View}
                onClick={() => toggleCategory("risk-capital")}
              />
            </div>
            {visibleCategories["risk-capital"] && (
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
                    labelText="Equity Drawdown Kill-Switch"
                    labelA="Disabled"
                    labelB="Active"
                    toggled={config.use_equity_kill_switch}
                    onToggle={(val) => updateConfig("use_equity_kill_switch", val)}
                  />
                  <Toggle
                    id="use_daily_kill_switch"
                    labelText="Daily Drawdown Kill-Switch"
                    labelA="Disabled"
                    labelB="Active"
                    toggled={config.use_daily_kill_switch}
                    onToggle={(val) => updateConfig("use_daily_kill_switch", val)}
                  />
                </div>

                <div style={{ display: "flex", gap: "0.1rem", marginBottom: "0.1rem", flexWrap: "wrap" }}>
                  <div style={{ width: "190px" }}>
                    <NumberInput
                      id="risk_per_trade_pct"
                      label="Risk Per Trade (%)"
                      value={config.risk_per_trade_pct || 1.0}
                      min={0.1} max={5.0} step={0.1}
                      onChange={(e: any, { value }: any) => updateConfig("risk_per_trade_pct", value)}
                    />
                  </div>
                  <div style={{ width: "190px" }}>
                    <NumberInput
                      id="max_drawdown_equity_pct"
                      label="Max Equity DD (%)"
                      value={config.max_drawdown_equity_pct || 10.0}
                      min={1} step={0.5}
                      onChange={(e: any, { value }: any) => updateConfig("max_drawdown_equity_pct", value)}
                    />
                  </div>
                  <div style={{ width: "190px" }}>
                    <NumberInput
                      id="max_daily_drawdown_pct"
                      label="Max Daily DD (%)"
                      value={config.max_daily_drawdown_pct || 5.0}
                      min={1} step={0.5}
                      onChange={(e: any, { value }: any) => updateConfig("max_daily_drawdown_pct", value)}
                    />
                  </div>
                  <div style={{ width: "190px" }}>
                    <NumberInput
                      id="scalping_max_spread_pips"
                      label="Max Spread (Pips)"
                      value={config.scalping_max_spread_pips || 3.0}
                      min={0.1} max={10.0} step={0.1}
                      onChange={(e: any, { value }: any) => updateConfig("scalping_max_spread_pips", value)}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.1rem", marginBottom: "0.1rem", flexWrap: "wrap" }}>
                  <div style={{ width: "190px" }}>
                    <NumberInput
                      id="macro_news_buffer_minutes"
                      label="News Buffer (Mins)"
                      value={config.macro_news_buffer_minutes || 15}
                      min={1} max={60}
                      onChange={(e: any, { value }: any) => updateConfig("macro_news_buffer_minutes", value)}
                    />
                  </div>
                  <div style={{ width: "190px" }}>
                    <NumberInput
                      id="macro_vix_pause_threshold"
                      label="Max VIX Volatility Ceiling"
                      value={config.macro_vix_pause_threshold || 25.0}
                      min={15} max={50}
                      onChange={(e: any, { value }: any) => updateConfig("macro_vix_pause_threshold", value)}
                    />
                  </div>
                  <div style={{ width: "190px" }}>
                    <NumberInput
                      id="scalping_max_consecutive_losses"
                      label="Max Consec. Losses"
                      value={config.scalping_max_consecutive_losses ?? 3}
                      min={1} max={10}
                      onChange={(e: any, { value }: any) => updateConfig("scalping_max_consecutive_losses", value)}
                    />
                  </div>
                  <div style={{ width: "190px" }}>
                    <NumberInput
                      id="scalping_consecutive_loss_cooldown_minutes"
                      label="Loss Cooldown (Mins)"
                      value={config.scalping_consecutive_loss_cooldown_minutes ?? 10}
                      min={1} max={60}
                      onChange={(e: any, { value }: any) => updateConfig("scalping_consecutive_loss_cooldown_minutes", value)}
                    />
                  </div>
                  <div style={{ width: "190px" }}>
                    <NumberInput
                      id="post_loss_cooldown_bars"
                      label="Post-Loss Cooldown (Bars)"
                      value={config.post_loss_cooldown_bars ?? 2}
                      min={1} max={10}
                      onChange={(e: any, { value }: any) => updateConfig("post_loss_cooldown_bars", value)}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.1rem", marginBottom: "0.1rem", flexWrap: "wrap" }}>
                  <div style={{ width: "190px" }}>
                    <NumberInput
                      id="scalping_max_trades_per_hour"
                      label="Max Trades / Hour"
                      value={config.scalping_max_trades_per_hour || 10}
                      min={1}
                      onChange={(e: any, { value }: any) => updateConfig("scalping_max_trades_per_hour", value)}
                    />
                  </div>
                  <div style={{ width: "190px" }}>
                    <NumberInput
                      id="scalping_max_trades_per_day"
                      label="Max Trades / Day"
                      value={config.scalping_max_trades_per_day || 80}
                      min={1} max={500}
                      onChange={(e: any, { value }: any) => updateConfig("scalping_max_trades_per_day", value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </Tile>
        </Column>

        <Column sm={4} md={8} lg={16} style={{ marginBottom: "0.1rem" }}>
          <Tile style={{ borderLeft: hasChanges(pyramidKeys) ? "4px solid #f1c21b" : "none", padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h5 style={{ fontWeight: 600, color: "#f4f4f4" }}>🪜 4. Position State & Pyramiding Engine</h5>
              <Button 
                kind="ghost" 
                hasIconOnly 
                size="sm"
                iconDescription={visibleCategories["position-pyramid"] ? "Hide" : "Show"}
                renderIcon={visibleCategories["position-pyramid"] ? ViewOff : View}
                onClick={() => toggleCategory("position-pyramid")}
              />
            </div>
            {visibleCategories["position-pyramid"] && (
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
                    id="cluster_trailing_stop_enabled"
                    labelText="Cluster Trailing Stop"
                    labelA="Disabled"
                    labelB="Active"
                    toggled={config.cluster_trailing_stop_enabled !== undefined ? config.cluster_trailing_stop_enabled : false}
                    onToggle={(val) => updateConfig("cluster_trailing_stop_enabled", val)}
                  />
                  <Toggle
                    id="close_on_opposite_range_bar"
                    labelText="Fast Reversal Exit (Close on Opposite Bar)"
                    labelA="Disabled"
                    labelB="Active"
                    toggled={config.close_on_opposite_range_bar !== undefined ? config.close_on_opposite_range_bar : false}
                    onToggle={(val) => updateConfig("close_on_opposite_range_bar", val)}
                  />
                </div>

                <div style={{ display: "flex", gap: "0.1rem", marginBottom: "0.1rem", flexWrap: "wrap" }}>
                  <div style={{ width: "190px" }}>
                    <NumberInput
                      id="scalping_sl_pips"
                      label="Stop Loss (Pips)"
                      value={config.scalping_sl_pips || 20.0}
                      min={1} max={50} step={0.5}
                      onChange={(e: any, { value }: any) => updateConfig("scalping_sl_pips", value)}
                    />
                  </div>
                  <div style={{ width: "190px" }}>
                    <NumberInput
                      id="scalping_tp_pips"
                      label="Take Profit (Pips)"
                      value={config.scalping_tp_pips || 40.0}
                      min={1} max={100} step={0.5}
                      onChange={(e: any, { value }: any) => updateConfig("scalping_tp_pips", value)}
                    />
                  </div>
                  <div style={{ width: "190px" }}>
                    <NumberInput
                      id="pyramiding_max_layers"
                      label="Max Pyramid Layers"
                      value={config.pyramiding_max_layers || 4}
                      min={1} max={10}
                      onChange={(e: any, { value }: any) => updateConfig("pyramiding_max_layers", value)}
                    />
                  </div>
                  <div style={{ width: "190px" }}>
                    <NumberInput
                      id="pyramiding_step_pips"
                      label="Scale-In Step (Pips)"
                      value={config.pyramiding_step_pips || 20.0}
                      min={5.0} max={50.0} step={1.0}
                      onChange={(e: any, { value }: any) => updateConfig("pyramiding_step_pips", value)}
                    />
                  </div>
                  <div style={{ width: "190px" }}>
                    <NumberInput
                      id="trailing_stop_pips"
                      label="Cluster Trailing Stop (Pips)"
                      value={config.trailing_stop_pips || 35.0}
                      min={5.0} max={100.0} step={1.0}
                      onChange={(e: any, { value }: any) => updateConfig("trailing_stop_pips", value)}
                      disabled={!config.cluster_trailing_stop_enabled}
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
