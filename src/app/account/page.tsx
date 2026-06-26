"use client";

import React, { Suspense, useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Grid, Column, Tile, Button, Toggle, TextInput, Select, SelectItem, Dropdown, Modal, ToastNotification } from '@carbon/react';
import { Wallet, Settings, ArrowUpRight, ArrowDownRight, Information, Activity, DataBase } from '@carbon/icons-react';
import TradeHistoryTable from '@/components/TradeHistoryTable';
import PnLChart from '@/components/PnLChart';
import GlobalDetailTable from '@/components/GlobalDetailTable';
import { API_BASE_URL } from '@/config/env';

function AccountContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const currentTab = searchParams.get('tab') || 'portfolio';

  const [accountData, setAccountData] = useState<any>(null);
  const [positions, setPositions] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [selectedSignalId, setSelectedSignalId] = useState<number | null>(null);

  const [accounts, setAccounts] = useState<any[]>([]);
  const [notification, setNotification] = useState<{kind: "success" | "error" | "info", title: string, subtitle: string} | null>(null);
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

  const switchAccount = async (accountId: number) => {
    try {
      setNotification({ kind: "info", title: "Switching Account", subtitle: "Connecting to MT5..." });
      const res = await fetch(`${API_BASE_URL}/account/switch/${accountId}`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setNotification({ kind: "success", title: "Success", subtitle: data.message });
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setNotification({ kind: "error", title: "Failed", subtitle: data.detail || "Failed to switch account" });
      }
    } catch (e) {
      setNotification({ kind: "error", title: "Error", subtitle: "Could not connect to engine" });
    }
  };

  const handleAccountChange = (data: any) => {
    const selectedItem = data.selectedItem;
    if (!selectedItem || selectedItem.id === accountData?.metadata?.id) return;
    
    setConfirmModalConfig({
      isOpen: true,
      title: "Confirm Account Switch",
      body: `Are you sure you want to switch to account ${selectedItem.name} (${selectedItem.mode})? Engine will try to reconnect.`,
      onConfirm: async () => {
        setConfirmModalConfig(prev => ({ ...prev, isOpen: false }));
        await switchAccount(selectedItem.id);
      }
    });
  };

  const fetchTrades = useCallback(() => {
    return fetch(`${API_BASE_URL}/dashboard/trades`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.data)) setTrades(data.data);
        else if (data.items) setTrades(data.items);
        else if (Array.isArray(data)) setTrades(data);
        else setTrades([]);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    setMounted(true);
    // Fetch Metadata once
    fetch(`${API_BASE_URL}/account/info`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setAccountData(data);
        }
      })
      .catch(console.error);

    // Fetch account list for dropdown
    fetch(`${API_BASE_URL}/account/list`)
      .then(res => res.json())
      .then(data => {
         if (data.status === 'success') {
             setAccounts(data.data);
         }
      })
      .catch(console.error);

    // Subscribe to Dedicated Account SSE Stream
    const eventSource = new EventSource(`${API_BASE_URL}/account/stream`);
    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.account_info) {
          setAccountData((prev: any) => ({
            ...prev,
            live_metrics: payload.account_info
          }));
        }
        if (payload.positions) {
          setPositions(payload.positions);
        }
      } catch (err) {
        console.error("SSE parse error", err);
      }
    };

    fetchTrades();

    // Fetch Analytics
    fetch(`${API_BASE_URL}/dashboard/analytics`)
      .then(res => res.json())
      .then(data => {
        setAnalytics(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    return () => {
      eventSource.close();
    };
  }, []);

  const handleTabChange = (tabId: string) => {
    router.push(`${pathname}?tab=${tabId}`);
  };

  const navItems = [
    { id: 'portfolio', label: 'Portfolio', icon: Wallet },
    { id: 'trades', label: 'Trades', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];



  if (!mounted) {
    return <div style={{ padding: '2rem' }}>Loading Account Workspace...</div>;
  }

  const accountDropdownItems = accounts.map(a => ({
      id: a.id,
      name: a.name,
      mode: a.mode,
      label: `${a.name} (${a.mode})`
  }));
  const activeAccountItem = accountDropdownItems.find(i => i.id === accountData?.metadata?.id) || accountDropdownItems[0];

  return (
    <Grid fullWidth>
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
      <Column lg={16} md={8} sm={4} className="landing-page__banner">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontWeight: 400 }}>Account</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '250px' }}>
              <Dropdown
                id="account-page-switcher"
                titleText="Switch Account"
                label="Switch Account"
                items={accountDropdownItems}
                itemToString={(item) => (item ? item.label : '')}
                selectedItem={activeAccountItem}
                onChange={handleAccountChange}
                size="sm"
              />
            </div>
            {accountData && accountData.metadata && (
              <div style={{ display: 'flex', gap: '0.2rem' }}>
                <span style={{ padding: '4px 8px', backgroundColor: accountData.metadata.mode === 'LIVE' ? '#24a148' : '#0f62fe', color: 'white', fontSize: '12px', fontWeight: 600 }}>
                  {accountData.metadata.mode}
                </span>
                <span style={{ padding: '4px 8px', backgroundColor: '#393939', color: '#c6c6c6', fontSize: '12px' }}>
                  {accountData.metadata.broker}
                </span>
              </div>
            )}
          </div>
        </div>
      </Column>

      <Column lg={16} md={8} sm={4}>
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
                  {item.id === 'trades' && positions.length > 0 && (
                    <span style={{ marginLeft: 'auto', backgroundColor: '#24a148', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '8px' }}>
                      {positions.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Content Panel */}
          <div style={{ flex: 1 }}>

            {/* PORTFOLIO TAB */}
            {currentTab === 'portfolio' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                {/* Balance Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.2rem' }}>
                  <Tile style={{ padding: '1.25rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#a8a8a8', display: 'block', marginBottom: '0.5rem' }}>Total Balance</span>
                    <strong style={{ fontSize: '1.75rem', fontWeight: 600, color: '#ffffff' }}>
                      {loading ? '...' : `$${accountData?.live_metrics?.balance?.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                    </strong>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', color: '#8d8d8d', fontSize: '0.875rem' }}>
                      <span>{accountData?.metadata?.currency || 'USD'}</span>
                    </div>
                  </Tile>
                  <Tile style={{ padding: '1.25rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#a8a8a8', display: 'block', marginBottom: '0.5rem' }}>Net Equity</span>
                    <strong style={{ fontSize: '1.75rem', fontWeight: 600, color: '#ffffff' }}>
                      {loading ? '...' : `$${accountData?.live_metrics?.equity?.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                    </strong>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', color: accountData?.live_metrics?.profit >= 0 ? '#24a148' : '#fa4d56', fontSize: '0.875rem' }}>
                      {accountData?.live_metrics?.profit >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                      <span>Floating PnL: ${accountData?.live_metrics?.profit?.toFixed(2)}</span>
                    </div>
                  </Tile>
                  <Tile style={{ padding: '1.25rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#a8a8a8', display: 'block', marginBottom: '0.5rem' }}>Free Margin</span>
                    <strong style={{ fontSize: '1.75rem', fontWeight: 600, color: '#ffffff' }}>
                      {loading ? '...' : `$${accountData?.live_metrics?.free_margin?.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                    </strong>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#8d8d8d', marginTop: '10px' }}>
                      Margin Level: {loading ? '...' : `${accountData?.live_metrics?.margin_level?.toFixed(2)}%`}
                    </span>
                  </Tile>
                </div>

                {/* Performance Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.2rem' }}>
                  <Tile style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#a8a8a8' }}>Win Rate</span>
                    <strong style={{ display: 'block', fontSize: '1.5rem', marginTop: '0.5rem' }}>
                      {analytics ? `${analytics.win_rate}%` : '...'}
                    </strong>
                  </Tile>
                  <Tile style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#a8a8a8' }}>Profit Factor</span>
                    <strong style={{ display: 'block', fontSize: '1.5rem', marginTop: '0.5rem' }}>
                      {analytics ? analytics.profit_factor : '...'}
                    </strong>
                  </Tile>
                  <Tile style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#a8a8a8' }}>Total Trades</span>
                    <strong style={{ display: 'block', fontSize: '1.5rem', marginTop: '0.5rem' }}>
                      {analytics ? analytics.total_trades : '...'}
                    </strong>
                  </Tile>
                  <Tile style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#a8a8a8' }}>Total PnL (Closed)</span>
                    <strong style={{ display: 'block', fontSize: '1.5rem', marginTop: '0.5rem', color: analytics?.total_pnl >= 0 ? '#24a148' : '#fa4d56' }}>
                      {analytics ? `$${analytics.total_pnl}` : '...'}
                    </strong>
                  </Tile>
                  <Tile style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#a8a8a8' }}>Max Drawdown</span>
                    <strong style={{ display: 'block', fontSize: '1.5rem', marginTop: '0.5rem', color: '#fa4d56' }}>
                      {analytics ? `-${analytics.max_drawdown}%` : '...'}
                    </strong>
                  </Tile>
                </div>

                {/* Equity Curve Chart */}
                <div>
                  <Tile style={{ padding: '0.5rem', backgroundColor: '#262626' }}>
                    <PnLChart trades={trades} />
                  </Tile>
                </div>


              </div>
            )}

            {/* TRADES TAB */}
            {currentTab === 'trades' && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <Tile style={{ padding: '1.5rem', marginBottom: '0.2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0, fontWeight: 500 }}>Active MT5 Positions</h4>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 'bold' }}>
                      <svg width="12" height="12" viewBox="0 0 32 32" style={{ fill: '#11a3c6', flexShrink: 0 }}>
                        <path d="M12 10H6.78A11 11 0 114 16h2a9 9 0 102.26-6H12v2H6V6h2zm13.22 12A11 11 0 0128 16h-2a9 9 0 10-2.26 6H20v-2h6v6h-2z" />
                      </svg>
                      <span style={{ color: '#11a3c6', whiteSpace: 'nowrap' }}>Live Sync</span>
                    </div>
                  </div>

                  {positions.length > 0 ? (
                    <div style={{ overflowX: 'auto', border: '1px solid #393939', borderRadius: '4px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #393939', backgroundColor: '#262626' }}>
                            <th style={{ padding: '1rem' }}>Ticket</th>
                            <th style={{ padding: '1rem' }}>Symbol</th>
                            <th style={{ padding: '1rem' }}>Type</th>
                            <th style={{ padding: '1rem' }}>Volume</th>
                            <th style={{ padding: '1rem' }}>Open Price</th>
                            <th style={{ padding: '1rem' }}>Current Price</th>
                            <th style={{ padding: '1rem' }}>SL / TP</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Profit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {positions.map((p, idx) => {
                            const isBuy = p.type === 0; // MT5 standard: 0=Buy, 1=Sell
                            return (
                              <tr key={idx} style={{ borderBottom: '1px solid #393939' }}>
                                <td style={{ padding: '1rem', fontFamily: 'monospace' }}>
                                  #{p.ticket}
                                  {p.signal_id && (
                                    <div style={{ marginTop: '6px' }}>
                                      <span
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                          color: '#a56eff',
                                          cursor: 'pointer',
                                          fontSize: '11px',
                                          fontWeight: 'bold',
                                          textDecoration: 'underline'
                                        }}
                                        onClick={() => setSelectedSignalId(p.signal_id)}
                                      >
                                        <svg width="10" height="10" viewBox="0 0 32 32" style={{ fill: '#a56eff', flexShrink: 0 }}>
                                          <path d="M22.41 2H9.59A2.59 2.59 0 007 4.59v22.82A2.59 2.59 0 009.59 30h12.82A2.59 2.59 0 0025 27.41V4.59A2.59 2.59 0 0022.41 2zM9 4.59C9 4.26 9.26 4 9.59 4h12.82c.33 0 .59.26.59.59V8H9zm14 22.82c0 .33-.26.59-.59.59H9.59A.59.59 0 019 27.41V10h14z" />
                                        </svg>
                                        Signal #{p.signal_id}
                                      </span>
                                    </div>
                                  )}
                                </td>
                                <td style={{ padding: '1rem', fontWeight: 600 }}>{p.symbol}</td>
                                <td style={{ padding: '1rem' }}>
                                  <span style={{ color: isBuy ? '#24a148' : '#fa4d56', fontWeight: 500 }}>
                                    {isBuy ? 'BUY' : 'SELL'}
                                  </span>
                                </td>
                                <td style={{ padding: '1rem' }}>{p.volume}</td>
                                <td style={{ padding: '1rem' }}>{p.price_open?.toFixed(3)}</td>
                                <td style={{ padding: '1rem' }}>{p.price_current?.toFixed(3)}</td>
                                <td style={{ padding: '1rem', color: '#a8a8a8' }}>
                                  {p.sl > 0 ? p.sl : '-'} / {p.tp > 0 ? p.tp : '-'}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, color: p.profit >= 0 ? '#24a148' : '#fa4d56' }}>
                                  ${p.profit?.toFixed(2)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ padding: '4rem', textAlign: 'center', backgroundColor: '#262626', color: '#8d8d8d', borderRadius: '4px' }}>
                      <DataBase size={32} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                      <p>No open positions in MT5.</p>
                    </div>
                  )}
                </Tile>

                <div style={{ marginTop: 0 }}>
                  <TradeHistoryTable trades={trades} title="Trade History" onReload={fetchTrades} />
                </div>
              </div>
            )}



            {/* SETTINGS TAB */}
            {currentTab === 'settings' && (
              <Tile style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h4 style={{ margin: 0, fontWeight: 500 }}>Risk & Account Configuration</h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '500px' }}>
                  <TextInput
                    id="account-label"
                    labelText="Account Alias"
                    placeholder="e.g. Primary Live Trading"
                    defaultValue={accountData?.metadata?.name || "Quant Engine Account"}
                    disabled
                  />

                  <Select id="leverage-select" labelText="Account Leverage (From Broker)" defaultValue="1:50" disabled>
                    <SelectItem value="1:50" text={`1:${accountData?.live_metrics?.leverage || 50}`} />
                  </Select>

                  <TextInput
                    id="max-risk-per-trade"
                    labelText="Max Risk Per Trade (%)"
                    type="number"
                    defaultValue="1.5"
                  />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#c6c6c6', fontWeight: 500 }}>Notifications</span>
                    <Toggle
                      id="toggle-margin-call"
                      labelA="Off"
                      labelB="On"
                      labelText="Margin level alerts (< 150%)"
                      defaultToggled
                    />
                  </div>

                  <div style={{ marginTop: '1rem' }}>
                    <Button size="sm">Save Local Settings</Button>
                  </div>
                </div>
              </Tile>
            )}
          </div>
        </div>
      </Column>

      <GlobalDetailTable
        id={selectedSignalId}
        type="signal"
        onClose={() => setSelectedSignalId(null)}
      />

      <Modal
        open={confirmModalConfig.isOpen}
        modalHeading={confirmModalConfig.title}
        primaryButtonText="Confirm"
        secondaryButtonText="Cancel"
        onRequestClose={() => setConfirmModalConfig(prev => ({ ...prev, isOpen: false }))}
        onRequestSubmit={confirmModalConfig.onConfirm}
      >
        <p style={{ padding: '1rem 0', fontSize: '0.875rem' }}>{confirmModalConfig.body}</p>
      </Modal>
    </Grid>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem' }}>Loading Account...</div>}>
      <AccountContent />
    </Suspense>
  );
}
