"use client";

import React, { useState, useEffect } from 'react';
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
  MultiSelect
} from '@carbon/react';
import { Play, ChartLineData, Compare, Maximize, Minimize, Settings as SettingsIcon } from '@carbon/icons-react';

import SimulationChart from '../../components/SimulationChart';
import MonthlyHeatmap from '../../components/MonthlyHeatmap';
import RegimeBreakdown from '../../components/RegimeBreakdown';
import TradeHistoryTable from '../../components/TradeHistoryTable';
import GlobalTable from '../../components/GlobalTable';
import ComparisonChart from '../../components/ComparisonChart';

export default function SimulationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const runIdParam = searchParams.get('run_id');
  
  const [defaultTabIndex, setDefaultTabIndex] = useState(() => {
    if (tabParam === 'results') return 1;
    if (tabParam === 'compare') return 2;
    if (tabParam === 'settings') return 3;
    return 0;
  });
  const [models, setModels] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isChartFullscreen, setIsChartFullscreen] = useState(false);
  
  const [runs, setRuns] = useState<any[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string>(runIdParam || '');
  const [activeRunData, setActiveRunData] = useState<any>(null);
  
  // Compare State
  const [selectedCompareRunIds, setSelectedCompareRunIds] = useState<string[]>([]);
  const [compareRunsData, setCompareRunsData] = useState<any[]>([]);
  
  const [datasetConfig, setDatasetConfig] = useState<any>(null);

  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestStatus, setIngestStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [ingestForm, setIngestForm] = useState({ 
    start_date: '2015-01-01', 
    end_date: (() => {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      return d.toISOString().split('T')[0];
    })()
  });
  
  const [config, setConfig] = useState({
    mode: "BACKTEST",
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
    max_daily_drawdown_pct: 5.0
  });

  useEffect(() => {
    if (tabParam === 'results') setDefaultTabIndex(1);
    else if (tabParam === 'compare') setDefaultTabIndex(2);
    else if (tabParam === 'settings') setDefaultTabIndex(3);
    else setDefaultTabIndex(0);
  }, [tabParam]);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/models')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setModels(data); })
      .catch(console.error);
      
    fetch('http://127.0.0.1:8000/api/simulation/runs')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setRuns(data); })
      .catch(console.error);
      
    fetch('http://127.0.0.1:8000/api/configurations')
      .then(res => res.json())
      .then(data => { 
        if (Array.isArray(data)) {
          const simConfig = data.find(c => c.key === 'simulation_dataset');
          if (simConfig && simConfig.value) {
             const val = typeof simConfig.value === 'string' ? JSON.parse(simConfig.value) : simConfig.value;
             setDatasetConfig(val);
             setConfig(prev => ({ ...prev, start_date: val.start_date, end_date: val.end_date }));
          }
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedRunId) {
      fetch(`http://127.0.0.1:8000/api/simulation/runs/${selectedRunId}`)
        .then(res => res.json())
        .then(data => {
          // Also fetch trades
          fetch(`http://127.0.0.1:8000/api/simulation/runs/${selectedRunId}/trades`)
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
      fetch(`http://127.0.0.1:8000/api/simulation/runs/${id}`).then(res => res.json())
    );

    Promise.all(fetchPromises)
      .then(results => {
        setCompareRunsData(results);
      })
      .catch(console.error);
  }, [selectedCompareRunIds]);

  const handleTabChange = (index: number) => {
    let tabName = 'launch';
    if (index === 1) tabName = 'results';
    if (index === 2) tabName = 'compare';
    if (index === 3) tabName = 'settings';
    router.push(`/simulation?tab=${tabName}${selectedRunId ? `&run_id=${selectedRunId}` : ''}`);
  };

  const handleReingest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsIngesting(true);
    setIngestStatus(null);
    
    // Validation
    const selectedDate = new Date(ingestForm.end_date);
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() - 1);
    selectedDate.setHours(0,0,0,0);
    maxDate.setHours(0,0,0,0);
    
    if (selectedDate > maxDate) {
      setIngestStatus({ type: 'error', message: 'Validation Error: End date must be at least 1 month in the past.' });
      setIsIngesting(false);
      return;
    }

    try {
      const res = await fetch('http://127.0.0.1:8000/api/simulation/dataset/reingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ingestForm)
      });
      const data = await res.json();
      if (res.ok) {
        setIngestStatus({ type: 'success', message: data.message });
        setDatasetConfig({
          start_date: ingestForm.start_date,
          end_date: ingestForm.end_date,
          filename: `SIMULATION_${ingestForm.start_date.replace(/-/g, '')}_${ingestForm.end_date.replace(/-/g, '')}.csv`
        });
        setConfig(prev => ({ ...prev, start_date: ingestForm.start_date, end_date: ingestForm.end_date }));
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
    setIsRunning(true);
    setProgress(0);
    
    try {
      const res = await fetch('http://127.0.0.1:8000/api/simulation/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      
      if (data.run_id) {
        const source = new EventSource(`http://127.0.0.1:8000/api/simulation/stream/${data.run_id}`);
        source.onmessage = (event) => {
          const streamData = JSON.parse(event.data);
          if (streamData.progress !== undefined) setProgress(streamData.progress);
          if (streamData.status === "COMPLETED" || streamData.status === "FAILED") {
            source.close();
            setIsRunning(false);
            if (streamData.status === "COMPLETED") {
              setSelectedRunId(data.run_id);
              router.push(`/simulation?tab=results&run_id=${data.run_id}`);
              // Refresh runs list
              fetch('http://127.0.0.1:8000/api/simulation/runs')
                .then(res => res.json())
                .then(r => { if (Array.isArray(r)) setRuns(r); });
            }
          }
        };
      }
    } catch (err) {
      console.error(err);
      setIsRunning(false);
    }
  };

  return (
    <Grid>
      <Column lg={16} md={8} sm={4}>
        <div style={{ marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 400 }}>Simulation Engine</h3>
        </div>

        <div style={{ position: 'relative' }}>
          {defaultTabIndex === 1 && activeRunData && (
            <div style={{ position: 'absolute', top: '-3.5rem', right: 0, zIndex: 10, backgroundColor: '#262626', padding: '0.75rem 1.25rem', borderRadius: '4px', border: '1px solid #393939', fontSize: '0.75rem', width: 'max-content', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', borderBottom: '1px solid #393939', paddingBottom: '0.5rem' }}>
                <div>
                  <div style={{ color: '#a8a8a8', marginBottom: '2px' }}>SL/TP Control</div>
                  <strong style={{ color: '#ffffff' }}>{activeRunData.config?.use_ai_sl_tp ? 'Fully AI Driven' : 'Manual Thresholds'}</strong>
                </div>
                <div>
                  <div style={{ color: '#a8a8a8', marginBottom: '2px' }}>Risk Per Trade</div>
                  <strong style={{ color: '#ffffff' }}>{activeRunData.config?.use_custom_risk ? `${activeRunData.config.custom_risk_pct}%` : 'System Default'}</strong>
                </div>
                <div>
                  <div style={{ color: '#a8a8a8', marginBottom: '2px' }}>Halt Equity</div>
                  <strong style={{ color: activeRunData.config?.use_equity_kill_switch ? '#ffffff' : '#a8a8a8' }}>{activeRunData.config?.use_equity_kill_switch ? `${activeRunData.config.max_drawdown_equity_pct}%` : 'OFF'}</strong>
                </div>
                <div>
                  <div style={{ color: '#a8a8a8', marginBottom: '2px' }}>Halt Daily</div>
                  <strong style={{ color: activeRunData.config?.use_daily_kill_switch ? '#ffffff' : '#a8a8a8' }}>{activeRunData.config?.use_daily_kill_switch ? `${activeRunData.config.max_daily_drawdown_pct}%` : 'OFF'}</strong>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div>
                    <div style={{ color: '#a8a8a8', marginBottom: '2px' }}>Bull Model</div>
                    <strong style={{ color: '#ffffff' }}>{activeRunData.config?.models?.bull_trend || 'NONE'}</strong>
                  </div>
                  <div>
                    <div style={{ color: '#a8a8a8', marginBottom: '2px' }}>Spread</div>
                    <strong style={{ color: '#ffffff' }}>{activeRunData.config?.spread_pips} pips</strong>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div>
                    <div style={{ color: '#a8a8a8', marginBottom: '2px' }}>Bear Model</div>
                    <strong style={{ color: '#ffffff' }}>{activeRunData.config?.models?.bear_trend || 'NONE'}</strong>
                  </div>
                  <div>
                    <div style={{ color: '#a8a8a8', marginBottom: '2px' }}>Slippage</div>
                    <strong style={{ color: '#ffffff' }}>{activeRunData.config?.slippage_pips} pips</strong>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div>
                    <div style={{ color: '#a8a8a8', marginBottom: '2px' }}>Mean Rev Model</div>
                    <strong style={{ color: '#ffffff' }}>{activeRunData.config?.models?.mean_reverting || 'NONE'}</strong>
                  </div>
                  <div>
                    <div style={{ color: '#a8a8a8', marginBottom: '2px' }}>Commission</div>
                    <strong style={{ color: '#ffffff' }}>${activeRunData.config?.commission_per_lot} / lot</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Tabs selectedIndex={defaultTabIndex} onChange={(e) => handleTabChange(e.selectedIndex)}>
            <TabList aria-label="Simulation Tabs">
              <Tab><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Play size={16} /> Launch</div></Tab>
              <Tab><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ChartLineData size={16} /> Results</div></Tab>
              <Tab><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Compare size={16} /> Compare</div></Tab>
              <Tab><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><SettingsIcon size={16} /> Settings</div></Tab>
            </TabList>
          
          <TabPanels>
            {/* Tab 1: Launch */}
            <TabPanel style={{ padding: '1rem 0' }}>
              <Grid>
                <Column lg={16} md={8} sm={4}>
                  <Tile style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Configure Simulation</h3>
                    <Form onSubmit={handleLaunch}>
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
                              {models.map(m => (
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
                              {models.map(m => (
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
                              {models.map(m => (
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

                      <Grid style={{ padding: 0, marginLeft: '-1rem', marginRight: '-1rem', marginBottom: '1.5rem' }}>
                        {/* Row 2: Left */}
                        <Column lg={8} md={4} sm={4}>
                          <h4 style={{ margin: '0 0 1rem 0' }}>Simulation Period</h4>
                          <Grid style={{ padding: 0, marginLeft: '-1rem', marginRight: '-1rem' }}>
                            <Column lg={8} md={4} sm={2}>
                              <TextInput 
                                id="start-date" 
                                type="date" 
                                labelText="Start Date" 
                                value={config.start_date}
                                min={datasetConfig?.start_date}
                                max={datasetConfig?.end_date}
                                onChange={(e) => setConfig({...config, start_date: e.target.value})}
                              />
                            </Column>
                            <Column lg={8} md={4} sm={2}>
                              <TextInput 
                                id="end-date" 
                                type="date" 
                                labelText="End Date" 
                                value={config.end_date}
                                min={datasetConfig?.start_date}
                                max={datasetConfig?.end_date}
                                onChange={(e) => setConfig({...config, end_date: e.target.value})}
                              />
                            </Column>
                          </Grid>
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
                        disabled={isRunning} 
                        style={{ 
                          marginTop: '1rem', 
                          width: '100%', 
                          maxWidth: 'none',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        {isRunning && (
                          <div 
                            style={{ 
                              position: 'absolute', 
                              left: 0, 
                              top: 0, 
                              bottom: 0, 
                              width: `${progress}%`, 
                              backgroundColor: 'rgba(255, 255, 255, 0.2)',
                              transition: 'width 0.3s ease-out'
                            }} 
                          />
                        )}
                        <span style={{ position: 'relative', zIndex: 1 }}>
                          {isRunning ? `Simulation Progress: ${progress.toFixed(1)}%` : `Start Backtest`}
                        </span>
                      </Button>
                    </Form>
                  </Tile>
                </Column>
              </Grid>
            </TabPanel>
            
            {/* Tab 2: Results */}
            <TabPanel style={{ padding: '1rem 0' }}>
              <div style={{ marginBottom: '1.5rem', width: 'max-content' }}>
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
                      backgroundColor: '#161616',
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
                        <RegimeBreakdown regimeStats={activeRunData.metrics_report?.regime_breakdown || {}} />
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
            </TabPanel>
            
            {/* Tab 3: Compare */}
            <TabPanel style={{ padding: '1rem 0' }}>
              <Tile>
                <h4>Compare Simulations</h4>
                <p style={{ marginBottom: '1rem' }}>Select multiple simulation runs to compare metrics side-by-side.</p>
                
                <div style={{ marginBottom: '2rem', maxWidth: '600px' }}>
                  <MultiSelect
                    id="compare-multiselect"
                    label="Select runs to compare"
                    titleText="Simulation Runs"
                    items={runs.filter(r => r.status === 'COMPLETED').map(r => ({ id: r.id, text: `${r.name} (${new Date(r.created_at).toLocaleDateString()})` }))}
                    itemToString={(item: any) => (item ? item.text : '')}
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
            </TabPanel>

            {/* Tab 4: Settings */}
            <TabPanel style={{ padding: '1rem 0' }}>
              <Tile>
                <h3 style={{ marginBottom: '0.5rem' }}>Simulation Settings</h3>
                <p style={{ marginBottom: '2rem', color: '#a8a8a8' }}>Manage global simulation configurations and base datasets.</p>
                
                <h4 style={{ marginBottom: '1rem' }}>Historical Dataset</h4>
                {datasetConfig && (
                  <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#262626', borderLeft: '4px solid #0f62fe' }}>
                    <p style={{ marginBottom: '0.5rem' }}><strong>Locked Dataset:</strong> {datasetConfig.filename}</p>
                    <p style={{ margin: 0, color: '#a8a8a8' }}>Data spanning from {datasetConfig.start_date} to {datasetConfig.end_date}. All simulation launches are bounded within this period to prevent data drift.</p>
                  </div>
                )}
                
                <div style={{ padding: '1rem', border: '1px solid #393939', borderRadius: '4px', maxWidth: '600px' }}>
                  <h5 style={{ marginBottom: '1rem' }}>Ingest / Update Simulation Data</h5>
                  <p style={{ marginBottom: '1.5rem', fontSize: '0.875rem', color: '#a8a8a8' }}>
                    Pull fresh historical data from MetaTrader 5 and recalculate features. This process takes a while and will lock the dataset for all future simulations.
                  </p>
                  
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
                      <div style={{ flex: 1 }}>
                        <TextInput 
                          id="ingest-end-date" 
                          type="date" 
                          labelText="End Date" 
                          value={ingestForm.end_date}
                          max={(() => {
                            const d = new Date();
                            d.setMonth(d.getMonth() - 1);
                            return d.toISOString().split('T')[0];
                          })()}
                          onChange={(e) => setIngestForm({...ingestForm, end_date: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <Button type="submit" disabled={isIngesting}>
                      {isIngesting ? 'Ingesting from MT5...' : 'Re-ingest Dataset'}
                    </Button>
                  </Form>
                </div>
              </Tile>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>
      </Column>
    </Grid>
  );
}
