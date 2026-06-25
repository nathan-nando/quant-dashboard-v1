"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Tabs, 
  Tab, 
  TabList, 
  TabPanels, 
  TabPanel, 
  Grid, 
  Column, 
  Form, 
  Select, 
  SelectItem, 
  TextInput, 
  Button,
  Tile,
  DataTable,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  ProgressBar,
  Checkbox,
  Toggle,
  InlineNotification,
  MultiSelect,
  ToastNotification,
  Modal,
  RadioButtonGroup,
  RadioButton,
  Loading
} from '@carbon/react';
import { Play, ChartLineData, Compare, Maximize, Minimize, Settings as SettingsIcon, Renew, Catalog, TrashCan, Document } from '@carbon/icons-react';

import SimulationChart from '../../components/SimulationChart';
import MonthlyHeatmap from '../../components/MonthlyHeatmap';
import RegimeBreakdown from '../../components/RegimeBreakdown';
import TradeHistoryTable from '../../components/TradeHistoryTable';
import GlobalTable from '../../components/GlobalTable';
import GlobalJobsTable from '../../components/GlobalJobsTable';
import ComparisonChart from '../../components/ComparisonChart';
import { API_BASE_URL } from '@/config/env';

function SimulationPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const currentTab = tabParam || 'launch';
  const runIdParam = searchParams.get('run_id');
  
  const navItems = [
    { id: 'launch', label: 'Launch', icon: Play },
    { id: 'results', label: 'Results', icon: ChartLineData },
    { id: 'compare', label: 'Compare', icon: Compare },
    { id: 'history', label: 'History', icon: Catalog },
    { id: 'settings', label: 'Settings', icon: SettingsIcon }
  ];
  const [models, setModels] = useState<any[]>([]);
  const [isChartFullscreen, setIsChartFullscreen] = useState(false);
  const [refreshJobsTrigger, setRefreshJobsTrigger] = useState(0);
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    body: string;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: '',
    body: '',
    onConfirm: () => {}
  });
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [runs, setRuns] = useState<any[]>([]);
  const handleSetRuns = (data: any[]) => {
    if (Array.isArray(data)) {
      const sorted = [...data].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setRuns(sorted);
    }
  };
  const [selectedRunId, setSelectedRunId] = useState<string>(runIdParam || '');
  const [activeRunData, setActiveRunData] = useState<any>(null);

  const handleConfirmSubmit = async () => {
    setConfirmLoading(true);
    try {
      await confirmModalConfig.onConfirm();
    } catch (e) {
      console.error("Confirmation action failed:", e);
    } finally {
      setConfirmLoading(false);
    }
  };

  const openJobDetails = (jobId: string) => {
    window.dispatchEvent(new CustomEvent('open-job-details', { detail: { jobId } }));
  };

  const handleDeleteRun = (runId: string) => {
    setConfirmModalConfig({
      isOpen: true,
      title: "Delete Simulation Run",
      body: "Are you sure you want to completely delete this simulation run? This action cannot be undone.",
      onConfirm: async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/simulation/runs/${runId}`, {
            method: 'DELETE'
          });
          if (res.ok) {
            setNotification({ kind: "success", title: "Simulation Deleted", subtitle: "The simulation run has been deleted." });
            // Refresh list
            const runsRes = await fetch(`${API_BASE_URL}/simulation/runs?limit=1000`);
            if (runsRes.ok) {
              const data = await runsRes.json();
              handleSetRuns(data);
            }
          } else {
            setNotification({ kind: "error", title: "Delete Failed", subtitle: "Failed to delete simulation run." });
          }
        } catch (err) {
          console.error(err);
          setNotification({ kind: "error", title: "Delete Failed", subtitle: "Failed to communicate with server." });
        } finally {
          setConfirmModalConfig(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const simHeaders = [
    { key: "name", header: "Simulation Name" },
    { key: "created_at", header: "Date" },
    { key: "capital_summary", header: "Capital / Equity / PnL" },
    { key: "stats_summary", header: "Trades / Win Rate / Max DD" },
    { key: "status", header: "Status" },
    { key: "actions", header: "Actions" }
  ];

  const formatSimCell = (cellId: string, value: any) => {
    if (cellId.endsWith(':actions')) {
      const rowId = cellId.split(':')[0];
      return (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button 
            kind="ghost" 
            size="sm" 
            renderIcon={Document} 
            iconDescription="View Details" 
            hasIconOnly 
            onClick={() => {
              setSelectedRunId(rowId);
              router.push(`/simulation?tab=results&run_id=${rowId}`);
            }} 
          />
          <Button 
            kind="danger--ghost" 
            size="sm" 
            renderIcon={TrashCan} 
            iconDescription="Delete" 
            hasIconOnly 
            onClick={() => handleDeleteRun(rowId)} 
          />
        </div>
      );
    }
    
    if (cellId.endsWith(':created_at')) {
      if (!value) return 'N/A';
      const d = new Date(value);
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const day = d.getDate().toString().padStart(2, '0');
      const month = months[d.getMonth()];
      const year = d.getFullYear().toString().slice(-2);
      const time = d.toTimeString().split(' ')[0];
      return (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
          <span>{`${day} ${month} ${year}`}</span>
          <span style={{ color: '#a8a8a8', fontSize: '0.9em' }}>{time}</span>
        </div>
      );
    }
    
    if (cellId.endsWith(':capital_summary')) {
      const rowId = cellId.split(':')[0];
      const run = runs.find(r => String(r.id) === String(rowId));
      if (!run) return '-';
      
      const initialCapital = run.initial_capital;
      const finalEquity = run.final_equity;
      const totalPnL = run.total_pnl;

      const pnlPct = (initialCapital && totalPnL !== undefined && totalPnL !== null) 
        ? ((totalPnL / initialCapital) * 100).toFixed(2) 
        : null;

      const pnlColor = totalPnL >= 0 ? '#24a148' : '#fa4d56';
      const pnlSign = totalPnL >= 0 ? '+' : '';

      const formatCurrency = (val: any, showSign = false) => {
        if (val === undefined || val === null) return '-';
        const isNegative = val < 0;
        const absVal = Math.abs(val);
        const formatted = absVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        if (showSign) {
          return `${isNegative ? '-' : '+'}$${formatted}`;
        }
        return `${isNegative ? '-' : ''}$${formatted}`;
      };

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', lineHeight: '1.2' }}>
          <div>
            <span style={{ color: '#a8a8a8' }}>Cap: </span>
            <span>{formatCurrency(initialCapital)}</span>
          </div>
          <div>
            <span style={{ color: '#a8a8a8' }}>Eq: </span>
            <span>{formatCurrency(finalEquity)}</span>
          </div>
          {totalPnL !== undefined && totalPnL !== null ? (
            <div style={{ color: pnlColor, fontWeight: 'bold' }}>
              <span>PnL: {formatCurrency(totalPnL, true)}</span>
              {pnlPct !== null && <span style={{ fontSize: '0.9em', marginLeft: '4px' }}>({pnlSign}{pnlPct}%)</span>}
            </div>
          ) : (
            <div><span style={{ color: '#a8a8a8' }}>PnL: </span><span>-</span></div>
          )}
        </div>
      );
    }
    
    if (cellId.endsWith(':stats_summary')) {
      const rowId = cellId.split(':')[0];
      const run = runs.find(r => String(r.id) === String(rowId));
      if (!run) return '-';
      
      const totalTrades = run.total_trades;
      const winRate = run.win_rate;
      const maxDrawdown = run.max_drawdown;

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', lineHeight: '1.2' }}>
          <div>
            <span style={{ color: '#a8a8a8' }}>Trades: </span>
            <span>{totalTrades !== undefined && totalTrades !== null ? totalTrades : '-'}</span>
          </div>
          <div>
            <span style={{ color: '#a8a8a8' }}>Win Rate: </span>
            <span>{winRate !== undefined && winRate !== null ? `${(winRate * 100).toFixed(1)}%` : '-'}</span>
          </div>
          <div>
            <span style={{ color: '#a8a8a8' }}>Max DD: </span>
            <span style={{ color: maxDrawdown ? '#fa4d56' : 'inherit' }}>
              {maxDrawdown !== undefined && maxDrawdown !== null ? `${(maxDrawdown * 100).toFixed(1)}%` : '-'}
            </span>
          </div>
        </div>
      );
    }
    
    if (cellId.endsWith(':status')) {
      const statusUpper = value ? String(value).toUpperCase() : '';
      if (statusUpper === "COMPLETED" || statusUpper === "SUCCESS" || statusUpper === "DONE") {
        return (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '11px' }}>
            <svg width="12" height="12" viewBox="0 0 32 32" style={{ fill: '#24a148', flexShrink: 0 }}>
              <path d="M14 21.414l-5.707-5.707-1.414 1.414 7.121 7.121 12-12-1.414-1.414z" />
            </svg>
            <span style={{ color: '#ffffff', whiteSpace: 'nowrap' }}>Completed</span>
          </div>
        );
      }
      if (statusUpper === "RUNNING" || statusUpper === "PENDING" || statusUpper === "STARTED") {
        return (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '11px' }}>
            <svg width="12" height="12" viewBox="0 0 32 32" style={{ fill: '#11a3c6', flexShrink: 0 }}>
              <path d="M16 4C9.383 4 4 9.383 4 16s5.383 12 12 12 12-5.383 12-12S22.617 4 16 4zm0 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S6 21.523 6 16 10.477 6 16 6zm-1 3v8h6v-2h-4v-6h-2z" />
            </svg>
            <span style={{ color: '#11a3c6', whiteSpace: 'nowrap' }}>{statusUpper === 'RUNNING' ? 'Running' : 'Pending'}</span>
          </div>
        );
      }
      if (statusUpper === "FAILED" || statusUpper === "ERROR") {
        return (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '11px' }}>
            <svg width="12" height="12" viewBox="0 0 32 32" style={{ fill: '#fa4d56', flexShrink: 0 }}>
              <circle cx="16" cy="16" r="8" />
            </svg>
            <span style={{ color: '#fa4d56', whiteSpace: 'nowrap' }}>Failed</span>
          </div>
        );
      }
      // Fallback
      const readableValue = value ? String(value).split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : 'Unknown';
      return (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '11px' }}>
          <svg width="12" height="12" viewBox="0 0 32 32" style={{ fill: '#6f6f6f', flexShrink: 0 }}>
            <circle cx="16" cy="16" r="8" />
          </svg>
          <span style={{ color: '#a8a8a8', whiteSpace: 'nowrap' }}>{readableValue}</span>
        </div>
      );
    }

    return value;
  };
  
  // Compare State
  const [selectedCompareRunIds, setSelectedCompareRunIds] = useState<string[]>([]);
  const [compareRunsData, setCompareRunsData] = useState<any[]>([]);
  
  const [datasetConfigs, setDatasetConfigs] = useState<{static: any, latest: any}>({ static: null, latest: null });

  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestStatus, setIngestStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [notification, setNotification] = useState<{kind: "success" | "error" | "info", title: string, subtitle: string} | null>(null);
  const [ingestForm, setIngestForm] = useState({ 
    dataset_type: 'latest',
    start_date: '2015-01-01', 
    end_date: (() => {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      return d.toISOString().split('T')[0];
    })()
  });
  
  const [config, setConfig] = useState({
    name: "",
    mode: "BACKTEST",
    dataset_type: "latest",
    models: {
      bull_trend: "xbull_5years",
      bear_trend: "xbear_5years",
      mean_reverting: "xmean_5years"
    },
    start_date: "2024-01-01",
    end_date: "2024-06-01",
    initial_capital: 10000,
    slippage_pips: 0.5,
    spread_pips: 2.0,
    commission_per_lot: 0.0,
    use_ai_sl_tp: true,
    use_custom_risk: false,
    custom_risk_pct: 1.0,
    use_equity_kill_switch: false,
    max_drawdown_equity_pct: 10.0,
    use_daily_kill_switch: false,
    max_daily_drawdown_pct: 5.0,
    use_global_thresholds: true,
    ml_conf_bull: 0.50,
    ml_margin_bull: 0.10,
    meta_conf_bull: 0.50,
    ml_conf_bear: 0.50,
    ml_margin_bear: 0.10,
    meta_conf_bear: 0.50,
    ml_conf_mean: 0.50,
    ml_margin_mean: 0.05,
    meta_conf_mean: 0.50
  });

  // Tab state synchronized via URL

  useEffect(() => {
    fetch(`${API_BASE_URL}/models`)
      .then(res => res.json())
      .then(data => { 
        if (Array.isArray(data)) {
          setModels(data);
          
          // Find default models by searching name for keywords
          const bullOption = data.find(m => (!m.regime || m.regime === 'TREND_BULL') && m.name.toLowerCase().includes('bull'));
          const bearOption = data.find(m => (!m.regime || m.regime === 'TREND_BEAR') && m.name.toLowerCase().includes('bear'));
          const meanOption = data.find(m => (!m.regime || m.regime === 'MEAN_REVERTING') && m.name.toLowerCase().includes('mean'));
          
          setConfig(prev => ({
            ...prev,
            models: {
              bull_trend: bullOption ? bullOption.name : (prev.models.bull_trend || "NONE"),
              bear_trend: bearOption ? bearOption.name : (prev.models.bear_trend || "NONE"),
              mean_reverting: meanOption ? meanOption.name : (prev.models.mean_reverting || "NONE")
            }
          }));
        }
      })
      .catch(console.error);
      
    fetch(`${API_BASE_URL}/simulation/runs?limit=1000`)
      .then(res => res.json())
      .then(data => { handleSetRuns(data); })
      .catch(console.error);
      
    fetch(`${API_BASE_URL}/configurations`)
      .then(res => res.json())
      .then(data => { 
        if (Array.isArray(data)) {
          const latestConfig = data.find((c: any) => c.key === 'simulation_dataset_latest');
          const staticConfig = data.find((c: any) => c.key === 'simulation_dataset_static');
          
          let parsedLatest = null;
          let parsedStatic = null;
          
          if (latestConfig && latestConfig.value) {
             parsedLatest = typeof latestConfig.value === 'string' ? JSON.parse(latestConfig.value) : latestConfig.value;
          }
          if (staticConfig && staticConfig.value) {
             parsedStatic = typeof staticConfig.value === 'string' ? JSON.parse(staticConfig.value) : staticConfig.value;
          }
          
          const newConfigs = { latest: parsedLatest, static: parsedStatic };
          setDatasetConfigs(newConfigs);
          
          const defaultLaunchConfig = newConfigs['latest'] || newConfigs['static'];
          if (defaultLaunchConfig) {
             setConfig(prev => ({ 
               ...prev, 
               dataset_type: defaultLaunchConfig.dataset_type || 'latest',
               start_date: defaultLaunchConfig.start_date, 
               end_date: defaultLaunchConfig.end_date 
             }));
          }
          
          if (newConfigs['latest']) {
             setIngestForm(prev => ({
               ...prev,
               start_date: newConfigs['latest'].start_date || prev.start_date,
               end_date: newConfigs['latest'].end_date || prev.end_date
             }));
          }
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedRunId) {
      fetch(`${API_BASE_URL}/simulation/runs/${selectedRunId}`)
        .then(res => res.json())
        .then(data => {
          // Also fetch trades
          fetch(`${API_BASE_URL}/simulation/runs/${selectedRunId}/trades?limit=10000`)
            .then(res => res.json())
            .then(trades => {
              setActiveRunData({ ...data, tradeList: trades });
            });
        })
        .catch(console.error);
    }
  }, [selectedRunId]);

  useEffect(() => {
    if (selectedCompareRunIds.length === 0) {
      setCompareRunsData([]);
      return;
    }

    const fetchPromises = selectedCompareRunIds.map(id => 
      fetch(`${API_BASE_URL}/simulation/runs/${id}`).then(res => res.json())
    );

    Promise.all(fetchPromises)
      .then(results => {
        setCompareRunsData(results);
      })
      .catch(console.error);
  }, [selectedCompareRunIds]);

  const handleTabChange = (tabId: string) => {
    router.push(`/simulation?tab=${tabId}${selectedRunId ? `&run_id=${selectedRunId}` : ''}`);
  };

  const handleReingest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsIngesting(true);
    setIngestStatus(null);
    
    // Validation
    const selectedDate = new Date(ingestForm.dataset_type === 'latest' ? new Date().setDate(new Date().getDate() - 1) : ingestForm.end_date);
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() - 1);
    selectedDate.setHours(0,0,0,0);
    maxDate.setHours(0,0,0,0);
    
    if (selectedDate > maxDate) {
      setIngestStatus({ type: 'error', message: 'Validation Error: End date must be at least 1 day in the past.' });
      setIsIngesting(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/simulation/dataset/reingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ingestForm)
      });
      const data = await res.json();
      if (res.ok) {
        setIngestStatus({ type: 'success', message: data.message });
        const newConfigData = {
          dataset_type: ingestForm.dataset_type,
          start_date: ingestForm.start_date,
          end_date: ingestForm.dataset_type === 'latest' ? (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().split('T')[0]; })() : ingestForm.end_date,
          filename: `SIMULATION_${ingestForm.dataset_type.toUpperCase()}.csv`
        };
        setDatasetConfigs(prev => ({ ...prev, [ingestForm.dataset_type]: newConfigData }));
        setConfig(prev => ({ 
          ...prev, 
          dataset_type: ingestForm.dataset_type, 
          start_date: ingestForm.start_date, 
          end_date: ingestForm.dataset_type === 'latest' ? (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().split('T')[0]; })() : ingestForm.end_date 
        }));
      } else {
        setIngestStatus({ type: 'error', message: data.detail || 'Failed to reingest dataset' });
      }
    } catch (err: any) {
      setIngestStatus({ type: 'error', message: err.message });
    } finally {
      setIsIngesting(false);
    }
  };

  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare payload. If use_global_thresholds is true, remove local thresholds so backend uses global.
    const payload = { ...config };
    if (payload.use_global_thresholds) {
      const keysToDelete = [
        "ml_conf_bull", "ml_margin_bull", "meta_conf_bull",
        "ml_conf_bear", "ml_margin_bear", "meta_conf_bear",
        "ml_conf_mean", "ml_margin_mean", "meta_conf_mean"
      ];
      keysToDelete.forEach(k => delete (payload as any)[k]);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/simulation/backtest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (res.ok && data.run_id) {
        setNotification({ 
          kind: "success", 
          title: "Simulation Started", 
          subtitle: "Simulation is running in the background. Track progress in the Active Jobs panel." 
        });
        
        // Refresh runs list to include the new run (which will be in RUNNING status)
        fetch(`${API_BASE_URL}/simulation/runs?limit=1000`)
          .then(res => res.json())
          .then(r => { handleSetRuns(r); });
      } else {
        setNotification({ kind: "error", title: "Launch Failed", subtitle: data.detail || 'Unknown error' });
      }
    } catch (err) {
      console.error(err);
      setNotification({ kind: "error", title: "Launch Failed", subtitle: "Failed to communicate with simulation server." });
    }
  };

  return (
    <>
      {notification && (
        <div style={{ position: "fixed", top: "4rem", right: "1rem", zIndex: 9999 }}>
          <ToastNotification
            timeout={5000}
            kind={notification.kind as any}
            title={notification.title}
            subtitle={notification.subtitle}
            caption={new Date().toLocaleTimeString()}
            onClose={() => { setNotification(null); return false; }}
          />
        </div>
      )}

      <Grid fullWidth>
        <Column lg={16} md={8} sm={4} className="landing-page__banner">
          <h3 style={{ marginBottom: "1rem", fontWeight: 400 }}>Simulation</h3>
      </Column>

      <Column lg={16} md={8} sm={4}>
        <div style={{ position: 'relative' }}>


          <div style={{ display: 'flex', gap: '2rem', marginTop: '0.5rem' }}>
            {/* Sidebar Navigation */}
            <div style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '0.25rem', flexShrink: 0 }}>
              {navItems.map(item => {
                const isActive = currentTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleTabChange(item.id)}
                    className={isActive ? "settings-sidebar-item active" : "settings-sidebar-item"}
                  >
                    <Icon size={16} style={{ marginRight: '0.5rem' }} />
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Content Panels */}
            <div style={{ flex: 1 }}>
            {/* Tab 1: Launch */}
            {currentTab === 'launch' && (
              <Tile style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Configure Simulation</h3>
                    <Form onSubmit={handleLaunch}>
                      <div style={{ marginBottom: '2rem', maxWidth: '400px' }}>
                        <TextInput 
                          id="simulation-name" 
                          labelText="Simulation Name (Optional)" 
                          placeholder="e.g., AI SL/TP Baseline, High Spread Stress Test"
                          value={config.name || ""}
                          onChange={(e) => setConfig({...config, name: e.target.value})}
                        />
                      </div>
                      <Grid style={{ padding: 0, marginLeft: '-1rem', marginRight: '-1rem', marginBottom: '2rem' }}>
                        {/* Row 1: Left */}
                        <Column lg={8} md={4} sm={4}>
                          <h4 style={{ margin: '0 0 1rem 0' }}>Dynamic Routing by Regime</h4>
                          <div style={{ marginBottom: '1rem' }}>
                            <Select 
                              id="model-bull" 
                              labelText="Bull Trend" 
                              value={config.models?.bull_trend || "NONE"}
                              onChange={(e) => setConfig({...config, models: {...config.models, bull_trend: e.target.value}})}
                            >
                              <SelectItem value="NONE" text="None (Disabled)" />
                              {models.filter(m => !m.regime || m.regime === 'TREND_BULL').map(m => (
                                <SelectItem key={`bull-${m.id}`} value={m.name} text={`${m.name}`} />
                              ))}
                            </Select>
                          </div>
                          <div style={{ marginBottom: '1rem' }}>
                            <Select 
                              id="model-bear" 
                              labelText="Bear Trend" 
                              value={config.models?.bear_trend || "NONE"}
                              onChange={(e) => setConfig({...config, models: {...config.models, bear_trend: e.target.value}})}
                            >
                              <SelectItem value="NONE" text="None (Disabled)" />
                              {models.filter(m => !m.regime || m.regime === 'TREND_BEAR').map(m => (
                                <SelectItem key={`bear-${m.id}`} value={m.name} text={`${m.name}`} />
                              ))}
                            </Select>
                          </div>
                          <div>
                            <Select 
                              id="model-mean" 
                              labelText="Mean Reverting" 
                              value={config.models?.mean_reverting || "NONE"}
                              onChange={(e) => setConfig({...config, models: {...config.models, mean_reverting: e.target.value}})}
                            >
                              <SelectItem value="NONE" text="None (Disabled)" />
                              {models.filter(m => !m.regime || m.regime === 'MEAN_REVERTING').map(m => (
                                <SelectItem key={`mean-${m.id}`} value={m.name} text={`${m.name}`} />
                              ))}
                            </Select>
                          </div>
                        </Column>

                        {/* Row 1: Right */}
                        <Column lg={8} md={4} sm={4}>
                          <h4 style={{ margin: '0 0 1rem 0' }}>Capital & Risk</h4>
                          <div style={{ marginBottom: '1.5rem' }}>
                            <Toggle 
                              id="use-ai-sl-tp" 
                              labelText="SL/TP Control Mode" 
                              labelA="Manual (Thresholds)" 
                              labelB="Fully AI Driven" 
                              toggled={config.use_ai_sl_tp}
                              onToggle={(val) => setConfig({...config, use_ai_sl_tp: val})}
                            />
                          </div>
                          <div style={{ marginBottom: '1.5rem' }}>
                            <TextInput 
                              id="capital" 
                              type="number" 
                              labelText="Initial Capital ($)" 
                              value={config.initial_capital}
                              onChange={(e) => setConfig({...config, initial_capital: parseFloat(e.target.value)})}
                            />
                          </div>
                          
                          <div>
                            <Checkbox 
                              id="use-custom-risk" 
                              labelText="Override Risk % (Otherwise defaults to System Thresholds)" 
                              checked={config.use_custom_risk}
                              onChange={(_, { checked }) => setConfig({...config, use_custom_risk: checked})}
                            />
                            {config.use_custom_risk && (
                              <div style={{ marginTop: '1rem', width: '100%' }}>
                                <TextInput 
                                  id="custom-risk" 
                                  type="number" 
                                  step="0.1"
                                  labelText="Custom Risk per Trade (%)" 
                                  value={config.custom_risk_pct}
                                  onChange={(e) => setConfig({...config, custom_risk_pct: parseFloat(e.target.value)})}
                                />
                              </div>
                            )}
                          </div>
                          
                          <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                            <div style={{ flex: 1 }}>
                              <Checkbox 
                                id="use-equity-kill-switch" 
                                labelText="Halt on Max Drawdown Equity" 
                                checked={config.use_equity_kill_switch}
                                onChange={(_, { checked }) => setConfig({...config, use_equity_kill_switch: checked})}
                              />
                              {config.use_equity_kill_switch && (
                                <div style={{ marginTop: '1rem', width: '100%' }}>
                                  <TextInput 
                                    id="max-drawdown-equity" 
                                    type="number" 
                                    step="0.1"
                                    labelText="Max Drawdown Equity (%)" 
                                    value={config.max_drawdown_equity_pct}
                                    onChange={(e) => setConfig({...config, max_drawdown_equity_pct: parseFloat(e.target.value)})}
                                  />
                                </div>
                              )}
                            </div>
                            
                            <div style={{ flex: 1 }}>
                              <Checkbox 
                                id="use-daily-kill-switch" 
                                labelText="Halt on Daily Drawdown" 
                                checked={config.use_daily_kill_switch}
                                onChange={(_, { checked }) => setConfig({...config, use_daily_kill_switch: checked})}
                              />
                              {config.use_daily_kill_switch && (
                                <div style={{ marginTop: '1rem', width: '100%' }}>
                                  <TextInput 
                                    id="max-daily-drawdown" 
                                    type="number" 
                                    step="0.1"
                                    labelText="Max Daily Drawdown (%)" 
                                    value={config.max_daily_drawdown_pct}
                                    onChange={(e) => setConfig({...config, max_daily_drawdown_pct: parseFloat(e.target.value)})}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </Column>
                      </Grid>

                      {/* Section: ML Confidence Thresholds */}
                      <Grid style={{ padding: 0, marginLeft: '-1rem', marginRight: '-1rem', marginBottom: '2rem' }}>
                        <Column lg={16} md={8} sm={4}>
                          <h4 style={{ margin: '0 0 1rem 0' }}>ML Confidence Thresholds</h4>
                          <div style={{ marginBottom: '1.5rem' }}>
                            <Toggle 
                              id="use-global-thresholds" 
                              labelText="Simulation Confidence Thresholds" 
                              labelA="Custom Overrides" 
                              labelB="Use Global Settings" 
                              toggled={config.use_global_thresholds}
                              onToggle={(val) => setConfig({...config, use_global_thresholds: val})}
                            />
                            {!config.use_global_thresholds && (
                              <div style={{ marginTop: '1.5rem', width: '100%' }}>
                                <Grid style={{ padding: 0, margin: '0 -1rem' }}>
                                  <Column lg={5} md={2} sm={4} style={{ marginBottom: '1rem' }}>
                                    <h5 style={{ marginBottom: '0.5rem', color: '#24a148', fontSize: '0.8rem' }}>Bull Trend</h5>
                                    <TextInput id="ml-margin-bull" type="number" step="0.01" labelText="Margin" value={config.ml_margin_bull} onChange={(e) => setConfig({...config, ml_margin_bull: parseFloat(e.target.value)})} />
                                    <div style={{marginTop: "0.5rem"}}>
                                      <TextInput id="ml-conf-bull" type="number" step="0.05" labelText="Raw Conf" value={config.ml_conf_bull} onChange={(e) => setConfig({...config, ml_conf_bull: parseFloat(e.target.value)})} />
                                    </div>
                                    <div style={{marginTop: "0.5rem"}}>
                                      <TextInput id="meta-conf-bull" type="number" step="0.05" labelText="Meta Conf" value={config.meta_conf_bull} onChange={(e) => setConfig({...config, meta_conf_bull: parseFloat(e.target.value)})} />
                                    </div>
                                  </Column>
                                  
                                  <Column lg={5} md={2} sm={4} style={{ marginBottom: '1rem' }}>
                                    <h5 style={{ marginBottom: '0.5rem', color: '#fa4d56', fontSize: '0.8rem' }}>Bear Trend</h5>
                                    <TextInput id="ml-margin-bear" type="number" step="0.01" labelText="Margin" value={config.ml_margin_bear} onChange={(e) => setConfig({...config, ml_margin_bear: parseFloat(e.target.value)})} />
                                    <div style={{marginTop: "0.5rem"}}>
                                      <TextInput id="ml-conf-bear" type="number" step="0.05" labelText="Raw Conf" value={config.ml_conf_bear} onChange={(e) => setConfig({...config, ml_conf_bear: parseFloat(e.target.value)})} />
                                    </div>
                                    <div style={{marginTop: "0.5rem"}}>
                                      <TextInput id="meta-conf-bear" type="number" step="0.05" labelText="Meta Conf" value={config.meta_conf_bear} onChange={(e) => setConfig({...config, meta_conf_bear: parseFloat(e.target.value)})} />
                                    </div>
                                  </Column>

                                  <Column lg={6} md={4} sm={4}>
                                    <h5 style={{ marginBottom: '0.5rem', color: '#0f62fe', fontSize: '0.8rem' }}>Mean Reverting</h5>
                                    <TextInput id="ml-margin-mean" type="number" step="0.01" labelText="Margin" value={config.ml_margin_mean} onChange={(e) => setConfig({...config, ml_margin_mean: parseFloat(e.target.value)})} />
                                    <div style={{marginTop: "0.5rem"}}>
                                      <TextInput id="ml-conf-mean" type="number" step="0.05" labelText="Raw Conf" value={config.ml_conf_mean} onChange={(e) => setConfig({...config, ml_conf_mean: parseFloat(e.target.value)})} />
                                    </div>
                                    <div style={{marginTop: "0.5rem"}}>
                                      <TextInput id="meta-conf-mean" type="number" step="0.05" labelText="Meta Conf" value={config.meta_conf_mean} onChange={(e) => setConfig({...config, meta_conf_mean: parseFloat(e.target.value)})} />
                                    </div>
                                  </Column>
                                </Grid>
                              </div>
                            )}
                          </div>
                        </Column>
                      </Grid>

                      <Grid style={{ padding: 0, marginLeft: '-1rem', marginRight: '-1rem', marginBottom: '1.5rem' }}>
                        {/* Row 2: Left */}
                        <Column lg={8} md={4} sm={4}>
                          <h4 style={{ margin: '0 0 1rem 0' }}>Simulation Period</h4>
                          <div style={{ marginBottom: '1.5rem' }}>
                            <h5 style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>Dataset Target Mode</h5>
                            <RadioButtonGroup
                              name="launch-dataset-type"
                              valueSelected={config.dataset_type}
                              onChange={(newType) => {
                                const typeStr = String(newType);
                                const currentDataset = datasetConfigs[typeStr as keyof typeof datasetConfigs];
                                setConfig(prev => ({
                                  ...prev,
                                  dataset_type: typeStr,
                                  start_date: currentDataset?.start_date || prev.start_date,
                                  end_date: currentDataset?.end_date || prev.end_date
                                }));
                              }}
                            >
                              <RadioButton value="latest" id="launch-latest" labelText="Use latest data (Auto-syncs up to Yesterday)" />
                              <RadioButton value="static" id="launch-static" labelText="Static (Fixed Date Range)" />
                            </RadioButtonGroup>
                          </div>
                          {config.dataset_type === 'static' && (
                            <Grid style={{ padding: 0, marginLeft: '-1rem', marginRight: '-1rem' }}>
                              <Column lg={8} md={4} sm={2}>
                                <TextInput 
                                  id="start-date" 
                                  type="date" 
                                  labelText="Start Date" 
                                  value={config.start_date}
                                  min={datasetConfigs.static?.start_date}
                                  max={datasetConfigs.static?.end_date}
                                  onChange={(e) => setConfig({...config, start_date: e.target.value})}
                                />
                              </Column>
                              <Column lg={8} md={4} sm={2}>
                                <TextInput 
                                  id="end-date" 
                                  type="date" 
                                  labelText="End Date" 
                                  value={config.end_date}
                                  min={datasetConfigs.static?.start_date}
                                  max={datasetConfigs.static?.end_date}
                                  onChange={(e) => setConfig({...config, end_date: e.target.value})}
                                />
                              </Column>
                            </Grid>
                          )}
                        </Column>

                        {/* Row 2: Right */}
                        <Column lg={8} md={4} sm={4}>
                          <h4 style={{ margin: '0 0 1rem 0' }}>Broker Simulation Settings</h4>
                          <div style={{ marginBottom: '1rem' }}>
                            <TextInput 
                              id="spread" 
                              type="number" 
                              step="0.1"
                              labelText="Spread (Pips)" 
                              value={config.spread_pips}
                              onChange={(e) => setConfig({...config, spread_pips: parseFloat(e.target.value)})}
                            />
                          </div>
                          <div style={{ marginBottom: '1rem' }}>
                            <TextInput 
                              id="slippage" 
                              type="number" 
                              step="0.1"
                              labelText="Slippage (Pips)" 
                              value={config.slippage_pips}
                              onChange={(e) => setConfig({...config, slippage_pips: parseFloat(e.target.value)})}
                            />
                          </div>
                          <div>
                            <TextInput 
                              id="commission" 
                              type="number" 
                              step="0.1"
                              labelText="Commission ($/Lot)" 
                              value={config.commission_per_lot}
                              onChange={(e) => setConfig({...config, commission_per_lot: parseFloat(e.target.value)})}
                            />
                          </div>
                        </Column>
                      </Grid>
                      
                      <Button 
                        type="submit" 
                        style={{ 
                          marginTop: '1rem', 
                          width: '100%', 
                          maxWidth: 'none'
                        }}
                      >
                        Start Backtest
                      </Button>
                    </Form>
                  </Tile>
            )}
            
            {/* Tab 2: Results */}
            {currentTab === 'results' && (
              <>
                <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                  {/* Select Dropdown & Reload Button */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', flexShrink: 0 }}>
                    <div style={{ width: '320px' }}>
                      <Select 
                        id="run-selector" 
                        labelText="Choose Simulation" 
                        value={selectedRunId}
                        onChange={(e) => {
                          setSelectedRunId(e.target.value);
                          router.push(`/simulation?tab=results&run_id=${e.target.value}`);
                        }}
                      >
                        <SelectItem value="" text="Select a run..." />
                        {runs.map(r => (
                          <SelectItem 
                            key={r.id} 
                            value={r.id} 
                            text={`${r.name} (${new Date(r.created_at).toLocaleDateString()}) - ${r.status}`} 
                          />
                        ))}
                      </Select>
                    </div>
                    <Button 
                      kind="ghost" 
                      size="md"
                      hasIconOnly 
                      iconDescription="Reload simulations"
                      renderIcon={Renew}
                      onClick={async () => {
                        try {
                          const res = await fetch(`${API_BASE_URL}/simulation/runs?limit=1000`);
                          if (res.ok) {
                            const data = await res.json();
                            handleSetRuns(data);
                          }
                          if (selectedRunId) {
                            const detailRes = await fetch(`${API_BASE_URL}/simulation/runs/${selectedRunId}`);
                            if (detailRes.ok) {
                              const detailData = await detailRes.json();
                              const tradesRes = await fetch(`${API_BASE_URL}/simulation/runs/${selectedRunId}/trades?limit=10000`);
                              if (tradesRes.ok) {
                                const tradesData = await tradesRes.json();
                                setActiveRunData({ ...detailData, tradeList: tradesData });
                              }
                            }
                          }
                        } catch (err) {
                          console.error("Failed to reload simulation runs", err);
                        }
                      }}
                    />
                  </div>

                  {/* Configuration Summary Card */}
                  {activeRunData && activeRunData.status === 'COMPLETED' && (
                    <Tile style={{ padding: '0.6rem 1rem', backgroundColor: '#353535', border: 'none', marginBottom: 0, marginLeft: 'auto' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, max-content)', gap: '0.5rem 1rem', fontSize: '0.75rem' }}>
                        <div>
                          <div style={{ color: '#a8a8a8', fontSize: '10px', marginBottom: '2px' }}>SL/TP Control</div>
                          <strong style={{ color: '#ffffff' }}>{activeRunData.config?.use_ai_sl_tp ? 'Fully AI Driven' : 'Manual Thresholds'}</strong>
                        </div>
                        <div>
                          <div style={{ color: '#a8a8a8', fontSize: '10px', marginBottom: '2px' }}>Risk Per Trade</div>
                          <strong style={{ color: '#ffffff' }}>{activeRunData.config?.use_custom_risk ? `${activeRunData.config.custom_risk_pct}%` : 'System Default'}</strong>
                        </div>
                        <div>
                          <div style={{ color: '#a8a8a8', fontSize: '10px', marginBottom: '2px' }}>Halt Equity</div>
                          <strong style={{ color: activeRunData.config?.use_equity_kill_switch ? '#ffffff' : '#a8a8a8' }}>{activeRunData.config?.use_equity_kill_switch ? `${activeRunData.config.max_drawdown_equity_pct}%` : 'OFF'}</strong>
                        </div>
                        <div>
                          <div style={{ color: '#a8a8a8', fontSize: '10px', marginBottom: '2px' }}>Halt Daily</div>
                          <strong style={{ color: activeRunData.config?.use_daily_kill_switch ? '#ffffff' : '#a8a8a8' }}>{activeRunData.config?.use_daily_kill_switch ? `${activeRunData.config.max_daily_drawdown_pct}%` : 'OFF'}</strong>
                        </div>
                        <div>
                          <div style={{ color: '#a8a8a8', fontSize: '10px', marginBottom: '2px' }}>Bull Model / Thresh</div>
                          <strong style={{ color: activeRunData.config?.models?.bull_trend ? '#42be65' : '#a8a8a8' }}>
                            {activeRunData.config?.models?.bull_trend || 'NONE'}
                            {activeRunData.config?.models?.bull_trend && activeRunData.config?.thresholds?.ml_conf_bull !== undefined ? ` (>${(activeRunData.config.thresholds.ml_conf_bull * 100).toFixed(0)}%)` : ''}
                          </strong>
                        </div>
                        <div>
                          <div style={{ color: '#a8a8a8', fontSize: '10px', marginBottom: '2px' }}>Bear Model / Thresh</div>
                          <strong style={{ color: activeRunData.config?.models?.bear_trend ? '#ff8389' : '#a8a8a8' }}>
                            {activeRunData.config?.models?.bear_trend || 'NONE'}
                            {activeRunData.config?.models?.bear_trend && activeRunData.config?.thresholds?.ml_conf_bear !== undefined ? ` (>${(activeRunData.config.thresholds.ml_conf_bear * 100).toFixed(0)}%)` : ''}
                          </strong>
                        </div>
                        <div>
                          <div style={{ color: '#a8a8a8', fontSize: '10px', marginBottom: '2px' }}>Mean Rev Model / Thresh</div>
                          <strong style={{ color: activeRunData.config?.models?.mean_reverting ? '#4589ff' : '#a8a8a8' }}>
                            {activeRunData.config?.models?.mean_reverting || 'NONE'}
                            {activeRunData.config?.models?.mean_reverting && activeRunData.config?.thresholds?.ml_conf_mean !== undefined ? ` (>${(activeRunData.config.thresholds.ml_conf_mean * 100).toFixed(0)}%)` : ''}
                          </strong>
                        </div>
                        <div>
                          <div style={{ color: '#a8a8a8', fontSize: '10px', marginBottom: '2px' }}>Spread & Slippage</div>
                          <strong style={{ color: '#ffffff' }}>Sp: {activeRunData.config?.spread_pips} | Sl: {activeRunData.config?.slippage_pips} pips</strong>
                        </div>
                        <div>
                          <div style={{ color: '#a8a8a8', fontSize: '10px', marginBottom: '2px' }}>Commission</div>
                          <strong style={{ color: '#ffffff' }}>${activeRunData.config?.commission_per_lot} / lot</strong>
                        </div>
                      </div>
                    </Tile>
                  )}
                </div>

                {activeRunData && activeRunData.status === 'COMPLETED' ? (
                  <>
                    <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.25rem' }}>
                      <Tile style={{ flex: 1 }}>
                      <h6 style={{ color: '#c6c6c6', marginBottom: '0.5rem' }}>Invested</h6>
                      <h2>${activeRunData.config?.initial_capital?.toLocaleString() || '0'}</h2>
                    </Tile>
                    <Tile style={{ flex: 1 }}>
                      <h6 style={{ color: '#c6c6c6', marginBottom: '0.5rem' }}>Total Equity</h6>
                      <h2 style={{ color: activeRunData.total_pnl >= 0 ? '#24a148' : '#fa4d56' }}>
                        ${((activeRunData.config?.initial_capital || 0) + (activeRunData.total_pnl || 0)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </h2>
                    </Tile>
                    <Tile style={{ flex: 1 }}>
                      <h6 style={{ color: '#c6c6c6', marginBottom: '0.5rem' }}>Net PnL</h6>
                      <h2 style={{ color: activeRunData.total_pnl >= 0 ? '#24a148' : '#fa4d56' }}>
                        {activeRunData.total_pnl >= 0 ? '+' : ''}${(activeRunData.total_pnl || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        <span style={{ fontSize: '1rem', marginLeft: '0.5rem', fontWeight: 'normal', color: activeRunData.total_pnl >= 0 ? '#42be65' : '#ff8389' }}>
                          ({activeRunData.total_pnl >= 0 ? '+' : ''}{(((activeRunData.total_pnl || 0) / (activeRunData.config?.initial_capital || 1)) * 100).toFixed(2)}%)
                        </span>
                      </h2>
                    </Tile>
                    <Tile style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ color: '#c6c6c6', fontSize: '0.75rem' }}>Total Trades</span>
                        <strong style={{ fontSize: '0.875rem' }}>{activeRunData.total_trades || 0}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ color: '#c6c6c6', fontSize: '0.75rem' }}>Win Rate</span>
                        <strong style={{ fontSize: '0.875rem' }}>{((activeRunData.win_rate || 0) * 100).toFixed(1)}%</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ color: '#c6c6c6', fontSize: '0.75rem' }}>Profit Factor</span>
                        <strong style={{ fontSize: '0.875rem' }}>{activeRunData.profit_factor?.toFixed(2) || '0.00'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#c6c6c6', fontSize: '0.75rem' }}>Max Drawdown</span>
                        <strong style={{ color: '#fa4d56', fontSize: '0.875rem' }}>{((activeRunData.max_drawdown || 0) * 100).toFixed(1)}%</strong>
                      </div>
                    </Tile>
                  </div>

                  <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.25rem' }}>
                    <Tile style={isChartFullscreen ? {
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 9999,
                      width: '100vw',
                      height: '100vh',
                      margin: 0,
                      borderRadius: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      backgroundColor: '#262626',
                      padding: '2rem'
                    } : { flex: 2, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h4 style={{ margin: 0 }}>Equity Curve</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <span style={{ fontSize: '0.75rem', color: '#a8a8a8' }}>
                            {activeRunData.config?.start_date ? new Date(activeRunData.config.start_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : 'N/A'} - {activeRunData.config?.end_date ? new Date(activeRunData.config.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : 'N/A'}
                          </span>
                          <Button 
                            kind="ghost" 
                            size="sm" 
                            hasIconOnly 
                            iconDescription={isChartFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                            onClick={() => setIsChartFullscreen(!isChartFullscreen)}
                          >
                            {isChartFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                          </Button>
                        </div>
                      </div>
                      <div style={{ flex: 1, height: isChartFullscreen ? '100%' : '400px', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                            <SimulationChart 
                              equityData={activeRunData.equity_curve || []} 
                              trades={activeRunData.tradeList || []} 
                            />
                          </div>
                        </div>
                      </div>
                    </Tile>

                    <Tile style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <h4 style={{ marginBottom: '1rem' }}>Regime Performance</h4>
                      <div style={{ flex: 1 }}>
                        <RegimeBreakdown 
                          regimeStats={activeRunData.metrics_report?.regime_breakdown || {}} 
                          models={{
                            TREND_BULL: activeRunData.config?.models?.bull_trend || 'NONE',
                            TREND_BEAR: activeRunData.config?.models?.bear_trend || 'NONE',
                            MEAN_REVERTING: activeRunData.config?.models?.mean_reverting || 'NONE',
                            VOLATILE_CHOP: 'NONE'
                          }}
                        />
                      </div>
                    </Tile>
                  </div>

                  <div style={{ marginBottom: '0.25rem' }}>
                    <Tile style={{ display: 'flex', flexDirection: 'column' }}>
                      <h4 style={{ marginBottom: '1rem' }}>Monthly Returns Heatmap</h4>
                      <div style={{ flex: 1 }}>
                        <MonthlyHeatmap data={activeRunData.monthly_returns || []} />
                      </div>
                    </Tile>
                  </div>
                    
                  {/* Trade History Table */}
                  <div style={{ marginBottom: '0.25rem' }}>
                    <Tile style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ flex: 1 }}>
                        <TradeHistoryTable trades={activeRunData.tradeList || []} />
                      </div>
                    </Tile>
                  </div>
                </>
              ) : activeRunData ? (
                <Tile>
                  <p>Simulation is currently {activeRunData.status}.</p>
                </Tile>
              ) : selectedRunId ? (
                <Tile><p>Loading run data...</p></Tile>
              ) : (
                <Tile><p>Select a run from the dropdown above.</p></Tile>
              )}
              </>
            )}
            
            {/* Tab 3: Compare */}
            {currentTab === 'compare' && (
              <Tile>
                <h4>Compare Simulations</h4>
                
                <div style={{ marginBottom: '.5rem', marginTop: '.5rem', maxWidth: '600px' }}>
                  <MultiSelect
                    id="compare-multiselect"
                    label="Select runs to compare"
                    titleText="Simulation Runs"
                    items={runs.filter(r => r.status === 'COMPLETED')}
                    itemToString={(item: any) => (item ? `${item.name} (${new Date(item.created_at).toLocaleDateString()})` : '')}
                    sortItems={(items) => [...items].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())}
                    onChange={({ selectedItems }) => setSelectedCompareRunIds(selectedItems ? selectedItems.map((item: any) => item.id) : [])}
                  />
                </div>

                {compareRunsData.length < 2 ? (
                  <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#262626', marginTop: '1rem' }}>
                    <span style={{ color: '#8d8d8d' }}>Comparison view requires at least 2 completed runs</span>
                  </div>
                ) : (
                  <>
                    <div style={{ height: '400px', marginBottom: '2rem' }}>
                      <ComparisonChart 
                        runs={compareRunsData.map(r => ({
                          id: r.id,
                          name: r.name,
                          initialCapital: r.config?.initial_capital || 10000,
                          equityData: r.equity_curve || []
                        }))} 
                      />
                    </div>
                    
                    <div style={{ overflowX: 'auto', border: '1px solid #393939', borderRadius: '4px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #393939' }}>
                            <th style={{ padding: '1rem', backgroundColor: '#262626', borderRight: '1px solid #393939', width: '200px' }}>Metric</th>
                            {compareRunsData.map(r => (
                              <th key={r.id} style={{ padding: '1rem', backgroundColor: '#262626' }}>{r.name}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr style={{ borderBottom: '1px solid #393939' }}>
                            <td style={{ padding: '1rem', fontWeight: 'bold', borderRight: '1px solid #393939' }}>Net PnL</td>
                            {compareRunsData.map(r => {
                              const pnl = r.total_pnl || 0;
                              return (
                                <td key={r.id} style={{ padding: '1rem', color: pnl >= 0 ? '#24a148' : '#fa4d56' }}>
                                  {pnl >= 0 ? '+' : ''}${pnl.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                </td>
                              );
                            })}
                          </tr>
                          <tr style={{ borderBottom: '1px solid #393939' }}>
                            <td style={{ padding: '1rem', fontWeight: 'bold', borderRight: '1px solid #393939' }}>Win Rate</td>
                            {compareRunsData.map(r => (
                              <td key={r.id} style={{ padding: '1rem' }}>{((r.win_rate || 0) * 100).toFixed(1)}%</td>
                            ))}
                          </tr>
                          <tr style={{ borderBottom: '1px solid #393939' }}>
                            <td style={{ padding: '1rem', fontWeight: 'bold', borderRight: '1px solid #393939' }}>Profit Factor</td>
                            {compareRunsData.map(r => (
                              <td key={r.id} style={{ padding: '1rem' }}>{r.profit_factor?.toFixed(2) || '0.00'}</td>
                            ))}
                          </tr>
                          <tr style={{ borderBottom: '1px solid #393939' }}>
                            <td style={{ padding: '1rem', fontWeight: 'bold', borderRight: '1px solid #393939' }}>Max Drawdown</td>
                            {compareRunsData.map(r => (
                              <td key={r.id} style={{ padding: '1rem', color: '#fa4d56' }}>{((r.max_drawdown || 0) * 100).toFixed(1)}%</td>
                            ))}
                          </tr>
                          <tr>
                            <td style={{ padding: '1rem', fontWeight: 'bold', borderRight: '1px solid #393939' }}>Total Trades</td>
                            {compareRunsData.map(r => (
                              <td key={r.id} style={{ padding: '1rem' }}>{r.total_trades || 0}</td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div style={{ overflowX: 'auto', border: '1px solid #393939', borderRadius: '4px', marginTop: '2rem' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #393939' }}>
                            <th style={{ padding: '1rem', backgroundColor: '#262626', borderRight: '1px solid #393939', width: '200px' }}>Parameter</th>
                            {compareRunsData.map(r => (
                              <th key={r.id} style={{ padding: '1rem', backgroundColor: '#262626' }}>{r.name}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr style={{ borderBottom: '1px solid #393939' }}>
                            <td style={{ padding: '1rem', fontWeight: 'bold', borderRight: '1px solid #393939' }}>Initial Capital</td>
                            {compareRunsData.map(r => (
                              <td key={r.id} style={{ padding: '1rem' }}>${(r.config?.initial_capital || 10000).toLocaleString()}</td>
                            ))}
                          </tr>
                          <tr style={{ borderBottom: '1px solid #393939' }}>
                            <td style={{ padding: '1rem', fontWeight: 'bold', borderRight: '1px solid #393939' }}>SL/TP Control</td>
                            {compareRunsData.map(r => (
                              <td key={r.id} style={{ padding: '1rem' }}>{r.config?.use_ai_sl_tp ? 'Fully AI Driven' : 'Manual Thresholds'}</td>
                            ))}
                          </tr>
                          <tr style={{ borderBottom: '1px solid #393939' }}>
                            <td style={{ padding: '1rem', fontWeight: 'bold', borderRight: '1px solid #393939' }}>Bull Model</td>
                            {compareRunsData.map(r => (
                              <td key={r.id} style={{ padding: '1rem' }}>{r.config?.models?.bull_trend || 'NONE'}</td>
                            ))}
                          </tr>
                          <tr style={{ borderBottom: '1px solid #393939' }}>
                            <td style={{ padding: '1rem', fontWeight: 'bold', borderRight: '1px solid #393939' }}>Bear Model</td>
                            {compareRunsData.map(r => (
                              <td key={r.id} style={{ padding: '1rem' }}>{r.config?.models?.bear_trend || 'NONE'}</td>
                            ))}
                          </tr>
                          <tr style={{ borderBottom: '1px solid #393939' }}>
                            <td style={{ padding: '1rem', fontWeight: 'bold', borderRight: '1px solid #393939' }}>Mean Rev Model</td>
                            {compareRunsData.map(r => (
                              <td key={r.id} style={{ padding: '1rem' }}>{r.config?.models?.mean_reverting || 'NONE'}</td>
                            ))}
                          </tr>
                          <tr style={{ borderBottom: '1px solid #393939' }}>
                            <td style={{ padding: '1rem', fontWeight: 'bold', borderRight: '1px solid #393939' }}>Spread / Slippage</td>
                            {compareRunsData.map(r => (
                              <td key={r.id} style={{ padding: '1rem', color: '#a8a8a8' }}>
                                Spread: {r.config?.spread_pips || 0} pips<br/>
                                Slippage: {r.config?.slippage_pips || 0} pips
                              </td>
                            ))}
                          </tr>
                          <tr>
                            <td style={{ padding: '1rem', fontWeight: 'bold', borderRight: '1px solid #393939' }}>Risk Engine</td>
                            {compareRunsData.map(r => (
                              <td key={r.id} style={{ padding: '1rem', color: '#a8a8a8' }}>
                                Equity Halt: {r.config?.use_equity_kill_switch ? `${r.config.max_drawdown_equity_pct}%` : 'OFF'}<br/>
                                Daily Halt: {r.config?.use_daily_kill_switch ? `${r.config.max_daily_drawdown_pct}%` : 'OFF'}
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </Tile>
            )}

            {/* Tab 4: History */}
            {currentTab === 'history' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.2rem' }}>
                <GlobalTable 
                  title="Completed Simulations"
                  headers={simHeaders}
                  initialData={runs}
                  formatCell={formatSimCell}
                  onReload={async () => {
                    const res = await fetch(`${API_BASE_URL}/simulation/runs?limit=1000`);
                    if (res.ok) {
                      const data = await res.json();
                      handleSetRuns(data);
                    }
                  }}
                />

                <GlobalJobsTable 
                  target="simulation"
                  refreshTrigger={refreshJobsTrigger}
                  openJobDetails={openJobDetails}
                  onJobChange={async () => {
                    const res = await fetch(`${API_BASE_URL}/simulation/runs?limit=1000`);
                    if (res.ok) {
                      const data = await res.json();
                      handleSetRuns(data);
                    }
                  }}
                />
              </div>
            )}

            {/* Tab 5: Settings */}
            {currentTab === 'settings' && (
              <Tile>
                <h5 style={{ marginBottom: '1rem' }}>Simulation Settings</h5>
                
                {datasetConfigs[ingestForm.dataset_type as keyof typeof datasetConfigs] && (
                  <div style={{ marginBottom: '.5rem', padding: '1rem', backgroundColor: '#262626', borderLeft: '4px solid #0f62fe' }}>
                    <p style={{ marginBottom: '0.5rem' }}><strong>Locked Dataset:</strong> {datasetConfigs[ingestForm.dataset_type as keyof typeof datasetConfigs].filename}</p>
                    <p style={{ marginBottom: '0.5rem' }}><strong>Type:</strong> {datasetConfigs[ingestForm.dataset_type as keyof typeof datasetConfigs].dataset_type === 'latest' ? 'Latest (Auto-syncs to T-1)' : 'Static'}</p>
                    <p style={{ margin: 0, color: '#a8a8a8' }}>Data spanning from {datasetConfigs[ingestForm.dataset_type as keyof typeof datasetConfigs].start_date} to {datasetConfigs[ingestForm.dataset_type as keyof typeof datasetConfigs].end_date}. All simulation launches are bounded within this period to prevent data drift.</p>
                  </div>
                )}
                
                <div style={{ padding: '1rem', border: '1px solid #393939', borderRadius: '4px', maxWidth: '600px' }}>
                  {ingestStatus && (
                    <div style={{ marginBottom: '1rem' }}>
                      <InlineNotification 
                        kind={ingestStatus.type} 
                        title={ingestStatus.type === 'success' ? 'Success' : 'Error'} 
                        subtitle={ingestStatus.message}
                        onClose={() => setIngestStatus(null)}
                      />
                    </div>
                  )}

                  <Form onSubmit={handleReingest}>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h5 style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>Dataset Type</h5>
                      <RadioButtonGroup
                        name="ingest-dataset-type"
                        valueSelected={ingestForm.dataset_type}
                        onChange={(newType) => {
                          const typeStr = String(newType);
                          const currentDataset = datasetConfigs[typeStr as keyof typeof datasetConfigs];
                          setIngestForm({
                            ...ingestForm, 
                            dataset_type: typeStr,
                            start_date: currentDataset?.start_date || ingestForm.start_date,
                            end_date: currentDataset?.end_date || ingestForm.end_date
                          });
                        }}
                      >
                        <RadioButton value="latest" id="ingest-latest" labelText="Use latest data (Auto-updates to Yesterday)" />
                        <RadioButton value="static" id="ingest-static" labelText="Static (Fixed End Date)" />
                      </RadioButtonGroup>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                      <div style={{ flex: 1 }}>
                        <TextInput 
                          id="ingest-start-date" 
                          type="date" 
                          labelText="Start Date" 
                          value={ingestForm.start_date}
                          onChange={(e) => setIngestForm({...ingestForm, start_date: e.target.value})}
                          required
                        />
                      </div>
                      {ingestForm.dataset_type === 'static' && (
                        <div style={{ flex: 1 }}>
                          <TextInput 
                            id="ingest-end-date" 
                            type="date" 
                            labelText="End Date" 
                            value={ingestForm.end_date}
                            max={(() => {
                              const d = new Date();
                              d.setDate(d.getDate() - 1);
                              return d.toISOString().split('T')[0];
                            })()}
                            onChange={(e) => setIngestForm({...ingestForm, end_date: e.target.value})}
                            required
                          />
                        </div>
                      )}
                    </div>
                    <Button type="submit" disabled={isIngesting}>
                      {isIngesting ? 'Ingesting from MT5...' : 'Re-ingest Dataset'}
                    </Button>
                  </Form>
                </div>
              </Tile>
            )}
          </div>
        </div>
      </div>
      </Column>
    </Grid>

    <Modal
      open={confirmModalConfig.isOpen}
      modalHeading={confirmModalConfig.title}
      primaryButtonText={confirmLoading ? "Processing..." : "Confirm"}
      secondaryButtonText="Cancel"
      primaryButtonDisabled={confirmLoading}
      onRequestClose={() => !confirmLoading && setConfirmModalConfig(prev => ({ ...prev, isOpen: false }))}
      onRequestSubmit={handleConfirmSubmit}
    >
      {confirmLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 0' }}>
          <Loading withOverlay={false} small />
          <span style={{ fontSize: '0.875rem', color: '#a8a8a8' }}>Please wait...</span>
        </div>
      ) : (
        <p style={{ padding: '1rem 0', fontSize: '0.875rem' }}>{confirmModalConfig.body}</p>
      )}
    </Modal>
    </>
  );
}

export default function SimulationPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem' }}>Loading simulation...</div>}>
      <SimulationPageContent />
    </Suspense>
  );
}
