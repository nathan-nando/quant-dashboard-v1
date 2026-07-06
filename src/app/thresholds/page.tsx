"use client";

import { Grid, Column, Tile, FormGroup, NumberInput, Button, Toggle, ToastNotification, RadioButtonGroup, RadioButton } from "@carbon/react";
import { View, ViewOff, Save } from "@carbon/icons-react";
import { useEffect, useState } from "react";
import { API_BASE_URL } from '@/config/env';

export default function ThresholdsPage() {
  const [config, setConfig] = useState<any>({
    engine_active: false,
    auto_execution_enabled: false,
    use_equity_kill_switch: true,
    max_drawdown_equity_pct: 10.0,
    use_daily_kill_switch: true,
    max_daily_drawdown_pct: 5.0,
    use_ai_sl_tp: true,
    risk_control_mode: "manual",
    risk_per_trade_pct: 1.0,
    max_open_positions: 1,
    ml_conf_trend: 0.50,
    ml_margin_trend: 0.10,
    ml_conf_meanrev: 0.50,
    ml_margin_meanrev: 0.05,
    ml_conf_macro: 0.50,
    ml_margin_macro: 0.05,
    ml_conf_moe: 0.50,
    adx_trend_threshold: 25,
    bb_width_volatility_threshold: 5.0,
    sl_mult_trend: 1.5,
    tp_mult_trend: 3.0,
    sl_mult_meanrev: 1.5,
    tp_mult_meanrev: 1.5,
    sl_mult_macro: 2.0,
    tp_mult_macro: 2.0,
    cron_interval_minutes: 3,
    max_sl_pips: 500,
    max_tp_pips: 1500,
    max_holding_hours: 120
  });

  const [originalConfig, setOriginalConfig] = useState<any>(null);
  
  const [visibleCategories, setVisibleCategories] = useState({
    "risk-execution": true,
    "alpha-model": true,
    "sltp-multipliers": true,
    "system-config": true
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ kind: any, title: string, subtitle: string, caption?: string } | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/configurations/thresholds`)
      .then(res => res.json())
      .then(data => {
        setConfig(data);
        setOriginalConfig(data);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...config };
      
      for (const key in payload) {
        if (typeof payload[key] === 'string') {
          const parsed = Number(payload[key].replace(',', '.'));
          if (!isNaN(parsed)) {
            payload[key] = parsed;
          }
        }
        
        if (["ml_conf_", "ml_margin_", "meta_conf_"].some(prefix => key.startsWith(prefix))) {
           if (typeof payload[key] === 'number' && payload[key] > 1.0 && payload[key] <= 100) {
              payload[key] = payload[key] / 100.0;
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
      setToastMsg({ kind: "success", title: "Configuration Saved", subtitle: "System parameters updated successfully!", caption: new Date().toLocaleTimeString() });
    } catch (err: any) {
      setToastMsg({ kind: "error", title: "Error", subtitle: err.message || "Failed to save configuration.", caption: new Date().toLocaleTimeString() });
    } finally {
      setSaving(false);
    }
  };

  
  const parseValue = (val: any) => {
    if (typeof val === 'string') {
      const parsed = Number(val.replace(',', '.'));
      return isNaN(parsed) ? val : parsed;
    }
    return Number(val);
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

  const riskKeys = ["auto_execution_enabled", "use_equity_kill_switch", "max_drawdown_equity_pct", "use_daily_kill_switch", "max_daily_drawdown_pct", "risk_control_mode", "risk_per_trade_pct", "max_open_positions", "max_sl_pips", "max_tp_pips", "max_holding_hours"];
  const alphaKeys = [
    "ml_conf_trend", "ml_margin_trend",
    "ml_conf_meanrev", "ml_margin_meanrev",
    "ml_conf_macro", "ml_margin_macro",
    "ml_conf_moe"
  ];

  const sltpKeys = ["use_ai_sl_tp", "sl_mult_trend", "tp_mult_trend", "sl_mult_meanrev", "tp_mult_meanrev", "sl_mult_macro", "tp_mult_macro"];
  const systemKeys = ["engine_active", "cron_interval_minutes"];

  if (loading) return <div>Loading configuration...</div>;

  return (
    <Grid style={{ position: 'relative' }}>
      {/* --- FLASH MESSAGE --- */}
      {toastMsg && (
        <div style={{ position: "fixed", top: "4rem", right: "2rem", zIndex: 9999 }}>
          <ToastNotification
            key={Date.now()}
            kind={toastMsg.kind}
            title={toastMsg.title}
            subtitle={toastMsg.subtitle as any}
            caption={toastMsg.caption}
            timeout={5000}
            onClose={() => setToastMsg(null)}
          />
        </div>
      )}

      <Column lg={16} md={8} sm={4} className="landing-page__banner">
        <h3 style={{ marginBottom: "1rem", fontWeight: 400 }}>Thresholds</h3>
      </Column>
      
      <Column lg={12} md={6} sm={4}>
        {visibleCategories["risk-execution"] && (
          <Tile id="risk-execution" style={{ marginBottom: ".2rem" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0 }}>Risk & Execution Parameters</h4>
              <Button size="sm" renderIcon={Save} onClick={handleSave} disabled={saving || !hasChanges(riskKeys)} style={{ border: 'none' }}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
            <FormGroup legendText="" style={{ marginTop: "1rem" }}>
              <Toggle 
                id="auto_exec" 
                labelText="Auto Trade Master Switch" 
                labelA="Off" 
                labelB="On" 
                toggled={config.auto_execution_enabled}
                onToggle={(val) => updateConfig("auto_execution_enabled", val)}
              />
              <div style={{marginTop: "1.5rem", display: "flex", gap: "2rem"}}>
                <div style={{ flex: 1 }}>
                  <Toggle 
                    id="use_equity_kill_switch" 
                    labelText="Halt on Max Drawdown Equity" 
                    labelA="Off" 
                    labelB="On" 
                    toggled={config.use_equity_kill_switch}
                    onToggle={(val) => updateConfig("use_equity_kill_switch", val)}
                  />
                  {config.use_equity_kill_switch && (
                    <div style={{marginTop: "1.5rem"}}>
                      <NumberInput 
                        id="max_drawdown_equity" label="Max Drawdown Equity (%)" value={config.max_drawdown_equity_pct} 
                        min={1} max={100} onChange={(e: any, { value }: any) => updateConfig("max_drawdown_equity_pct", value)}
                      />
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <Toggle 
                    id="use_daily_kill_switch" 
                    labelText="Halt on Daily Drawdown" 
                    labelA="Off" 
                    labelB="On" 
                    toggled={config.use_daily_kill_switch}
                    onToggle={(val) => updateConfig("use_daily_kill_switch", val)}
                  />
                  {config.use_daily_kill_switch && (
                    <div style={{marginTop: "1.5rem"}}>
                      <NumberInput 
                        id="max_daily_drawdown" label="Daily Drawdown Floor (%)" value={config.max_daily_drawdown_pct} 
                        min={1} max={100} onChange={(e: any, { value }: any) => updateConfig("max_daily_drawdown_pct", value)}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div style={{marginTop: "1.5rem"}}>
                <FormGroup legendText="Risk Control Mode">
                  <RadioButtonGroup
                    name="risk_control_mode"
                    defaultSelected="manual"
                    valueSelected={config.risk_control_mode}
                    onChange={(selection: any) => updateConfig("risk_control_mode", selection)}
                    orientation="horizontal"
                  >
                    <RadioButton value="auto_lowest" id="radio-auto-lowest" labelText="Auto Lowest (0.01 Lot)" />
                    <RadioButton value="manual" id="radio-manual" labelText="Manual (Fixed %)" />
                  </RadioButtonGroup>
                </FormGroup>
              </div>
              {config.risk_control_mode !== "auto_lowest" && (
                <div style={{marginTop: "1rem"}}>
                  <NumberInput 
                    id="risk_per_trade" label="Risk Per Trade (%)" value={config.risk_per_trade_pct} 
                    min={0.1} max={100} step={0.1} onChange={(e: any, { value }: any) => updateConfig("risk_per_trade_pct", value)}
                  />
                </div>
              )}
              <div style={{marginTop: "1rem", display: "flex", gap: "2rem"}}>
                <div style={{ flex: 1 }}>
                  <NumberInput 
                    id="max_positions" label="Max Open Positions" value={config.max_open_positions} 
                    min={1} max={20} onChange={(e: any, { value }: any) => updateConfig("max_open_positions", value)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <NumberInput 
                    id="max_holding_hours" label="Max Holding Time (Hours)" value={config.max_holding_hours ?? 120} 
                    min={1} max={1000} onChange={(e: any, { value }: any) => updateConfig("max_holding_hours", value)}
                  />
                </div>
              </div>
              <div style={{marginTop: "1rem", display: "flex", gap: "2rem"}}>
                <div style={{ flex: 1 }}>
                  <NumberInput 
                    id="max_sl_pips" label="Max SL (Pips)" value={config.max_sl_pips ?? 500} 
                    min={10} max={5000} onChange={(e: any, { value }: any) => updateConfig("max_sl_pips", value)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <NumberInput 
                    id="max_tp_pips" label="Max TP (Pips)" value={config.max_tp_pips ?? 1500} 
                    min={10} max={10000} onChange={(e: any, { value }: any) => updateConfig("max_tp_pips", value)}
                  />
                </div>
              </div>
            </FormGroup>
          </Tile>
        )}

        {visibleCategories["alpha-model"] && (
          <Tile id="alpha-model" style={{ marginBottom: ".2rem" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0 }}>Alpha / Signal Model Thresholds</h4>
              <Button size="sm" renderIcon={Save} onClick={handleSave} disabled={saving || !hasChanges(alphaKeys)} style={{ border: 'none' }}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
            <Grid style={{ padding: 0, margin: '1rem -1rem 0 -1rem' }}>
              {/* Trend Expert */}
              <Column lg={4} md={2} sm={4} style={{ marginBottom: '1rem' }}>
                <h5 style={{ marginBottom: '0.5rem', color: '#24a148' }}>Trend Expert</h5>
                <NumberInput id="ml_margin_trend" label="ML Margin (Selisih)" value={config.ml_margin_trend ?? 0.10} min={0.01} max={1.0} step={0.01} onChange={(e: any, { value }: any) => updateConfig("ml_margin_trend", value)} />
                <div style={{marginTop: "0.5rem"}}>
                  <NumberInput id="ml_conf_trend" label="ML Confidence (Mutlak)" value={config.ml_conf_trend ?? 0.50} min={0.1} max={1.0} step={0.05} onChange={(e: any, { value }: any) => updateConfig("ml_conf_trend", value)} />
                </div>
              </Column>
              
              {/* MeanRev Expert */}
              <Column lg={4} md={2} sm={4} style={{ marginBottom: '1rem' }}>
                <h5 style={{ marginBottom: '0.5rem', color: '#0f62fe' }}>MeanRev Expert</h5>
                <NumberInput id="ml_margin_meanrev" label="ML Margin (Selisih)" value={config.ml_margin_meanrev ?? 0.05} min={0.01} max={1.0} step={0.01} onChange={(e: any, { value }: any) => updateConfig("ml_margin_meanrev", value)} />
                <div style={{marginTop: "0.5rem"}}>
                  <NumberInput id="ml_conf_meanrev" label="ML Confidence (Mutlak)" value={config.ml_conf_meanrev ?? 0.50} min={0.1} max={1.0} step={0.05} onChange={(e: any, { value }: any) => updateConfig("ml_conf_meanrev", value)} />
                </div>
              </Column>

              {/* Macro Expert */}
              <Column lg={4} md={2} sm={4} style={{ marginBottom: '1rem' }}>
                <h5 style={{ marginBottom: '0.5rem', color: '#f1c21b' }}>Macro Expert</h5>
                <NumberInput id="ml_margin_macro" label="ML Margin (Selisih)" value={config.ml_margin_macro ?? 0.05} min={0.01} max={1.0} step={0.01} onChange={(e: any, { value }: any) => updateConfig("ml_margin_macro", value)} />
                <div style={{marginTop: "0.5rem"}}>
                  <NumberInput id="ml_conf_macro" label="ML Confidence (Mutlak)" value={config.ml_conf_macro ?? 0.50} min={0.1} max={1.0} step={0.05} onChange={(e: any, { value }: any) => updateConfig("ml_conf_macro", value)} />
                </div>
              </Column>

              {/* Global MoE */}
              <Column lg={4} md={2} sm={4}>
                <h5 style={{ marginBottom: '0.5rem', color: '#8a3ffc' }}>Global MoE</h5>
                <NumberInput id="ml_conf_moe" label="ML Confidence (Mutlak)" value={config.ml_conf_moe ?? 0.50} min={0.1} max={1.0} step={0.05} onChange={(e: any, { value }: any) => updateConfig("ml_conf_moe", value)} />
              </Column>
            </Grid>
          </Tile>
        )}

        {visibleCategories["sltp-multipliers"] && (
          <Tile id="sltp-multipliers" style={{ marginBottom: ".2rem" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0 }}>SL/TP Multipliers</h4>
              <Button size="sm" renderIcon={Save} onClick={handleSave} disabled={saving || !hasChanges(sltpKeys)} style={{ border: 'none' }}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
            <div style={{marginBottom: "1.5rem"}}>
              <Toggle 
                id="use_ai_sl_tp" 
                labelText="SL/TP Control Mode" 
                labelA="Manual Fallback" 
                labelB="Fully AI Driven" 
                toggled={config.use_ai_sl_tp}
                onToggle={(val) => updateConfig("use_ai_sl_tp", val)}
              />
            </div>
            
                <FormGroup legendText="Trend Expert" style={{ marginTop: "1rem" }}>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <NumberInput 
                      id="sl_trend" label="SL Multiplier" value={config.sl_mult_trend} 
                      min={0.1} max={10.0} step={0.1} onChange={(e: any, { value }: any) => updateConfig("sl_mult_trend", value)}
                    />
                    <NumberInput 
                      id="tp_trend" label="TP Multiplier" value={config.tp_mult_trend} 
                      min={0.1} max={10.0} step={0.1} onChange={(e: any, { value }: any) => updateConfig("tp_mult_trend", value)}
                    />
                  </div>
                </FormGroup>
                <FormGroup legendText="MeanRev Expert" style={{ marginTop: "1rem" }}>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <NumberInput 
                      id="sl_mr" label="SL Multiplier" value={config.sl_mult_meanrev} 
                      min={0.1} max={10.0} step={0.1} onChange={(e: any, { value }: any) => updateConfig("sl_mult_meanrev", value)}
                    />
                    <NumberInput 
                      id="tp_mr" label="TP Multiplier" value={config.tp_mult_meanrev} 
                      min={0.1} max={10.0} step={0.1} onChange={(e: any, { value }: any) => updateConfig("tp_mult_meanrev", value)}
                    />
                  </div>
                </FormGroup>
                <FormGroup legendText="Macro Expert" style={{ marginTop: "1rem" }}>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <NumberInput 
                      id="sl_macro" label="SL Multiplier" value={config.sl_mult_macro} 
                      min={0.1} max={10.0} step={0.1} onChange={(e: any, { value }: any) => updateConfig("sl_mult_macro", value)}
                    />
                    <NumberInput 
                      id="tp_macro" label="TP Multiplier" value={config.tp_mult_macro} 
                      min={0.1} max={10.0} step={0.1} onChange={(e: any, { value }: any) => updateConfig("tp_mult_macro", value)}
                    />
                  </div>
                </FormGroup>
          </Tile>
        )}

        {visibleCategories["system-config"] && (
          <Tile id="system-config" style={{ marginBottom: ".2rem" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0 }}>System Engine Config</h4>
              <Button size="sm" renderIcon={Save} onClick={handleSave} disabled={saving || !hasChanges(systemKeys)} style={{ border: 'none' }}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
            <FormGroup legendText="" style={{ marginTop: "1rem" }}>
              <Toggle 
                id="engine_active" 
                labelText="Engine Active (Cron Job)" 
                labelA="Off" 
                labelB="On" 
                toggled={config.engine_active}
                onToggle={(val) => updateConfig("engine_active", val)}
              />
              <div style={{marginTop: "2rem"}}>
                <NumberInput 
                  id="cron_interval" label="Engine Cycle Interval (Minutes)" value={config.cron_interval_minutes} 
                  min={1} max={60} step={1} onChange={(e: any, { value }: any) => updateConfig("cron_interval_minutes", value)}
                />
              </div>
            </FormGroup>
          </Tile>
        )}
      </Column>

      <Column lg={4} md={2} sm={0}>
        <div style={{ position: "sticky", top: "5rem" }}>
          <h4 style={{ marginBottom: "1rem", fontSize: "14px", fontWeight: "bold" }}>Table of Contents</h4>
          <ul style={{ listStyleType: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "13px" }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ cursor: 'pointer', display: 'flex', color: visibleCategories["risk-execution"] ? "#0f62fe" : "#8d8d8d" }} onClick={() => toggleCategory("risk-execution")}>
                {visibleCategories["risk-execution"] ? <View size={16} /> : <ViewOff size={16} />}
              </div>
              <a href="#risk-execution" style={{ textDecoration: "none", color: visibleCategories["risk-execution"] ? "#0f62fe" : "#8d8d8d" }}>Risk & Execution</a>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ cursor: 'pointer', display: 'flex', color: visibleCategories["alpha-model"] ? "#0f62fe" : "#8d8d8d" }} onClick={() => toggleCategory("alpha-model")}>
                {visibleCategories["alpha-model"] ? <View size={16} /> : <ViewOff size={16} />}
              </div>
              <a href="#alpha-model" style={{ textDecoration: "none", color: visibleCategories["alpha-model"] ? "#0f62fe" : "#8d8d8d" }}>Alpha / Signal Model</a>
            </li>

            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ cursor: 'pointer', display: 'flex', color: visibleCategories["sltp-multipliers"] ? "#0f62fe" : "#8d8d8d" }} onClick={() => toggleCategory("sltp-multipliers")}>
                {visibleCategories["sltp-multipliers"] ? <View size={16} /> : <ViewOff size={16} />}
              </div>
              <a href="#sltp-multipliers" style={{ textDecoration: "none", color: visibleCategories["sltp-multipliers"] ? "#0f62fe" : "#8d8d8d" }}>SL/TP Multipliers</a>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ cursor: 'pointer', display: 'flex', color: visibleCategories["system-config"] ? "#0f62fe" : "#8d8d8d" }} onClick={() => toggleCategory("system-config")}>
                {visibleCategories["system-config"] ? <View size={16} /> : <ViewOff size={16} />}
              </div>
              <a href="#system-config" style={{ textDecoration: "none", color: visibleCategories["system-config"] ? "#0f62fe" : "#8d8d8d" }}>System Engine Config</a>
            </li>
          </ul>
        </div>
      </Column>
    </Grid>
  );
}
