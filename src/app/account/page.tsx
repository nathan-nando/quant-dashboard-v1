"use client";

import React, { Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Grid, Column, Tile, Button, Toggle, TextInput, Select, SelectItem } from '@carbon/react';
import { Wallet, ChartLine, Settings, ArrowUpRight, ArrowDownRight, Information } from '@carbon/icons-react';

function AccountContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const currentTab = searchParams.get('tab') || 'portfolio';

  const handleTabChange = (tabId: string) => {
    router.push(`${pathname}?tab=${tabId}`);
  };

  const navItems = [
    { id: 'portfolio', label: 'Portfolio', icon: Wallet },
    { id: 'performance', label: 'Performance', icon: ChartLine },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <Grid fullWidth>
      <Column lg={16} md={8} sm={4} className="landing-page__banner">
        <h3 style={{ marginBottom: "1rem", fontWeight: 400 }}>Account & Portfolio</h3>
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
                </button>
              );
            })}
          </div>

          {/* Content Panel */}
          <div style={{ flex: 1 }}>
            {currentTab === 'portfolio' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.5rem' }}>
                  <Tile style={{ padding: '1.25rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#a8a8a8', display: 'block', marginBottom: '0.5rem' }}>Total Balance</span>
                    <strong style={{ fontSize: '1.75rem', fontWeight: 600, color: '#ffffff' }}>$124,500.00</strong>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', color: '#24a148', fontSize: '0.875rem' }}>
                      <ArrowUpRight size={16} />
                      <span>+4.2% this week</span>
                    </div>
                  </Tile>
                  <Tile style={{ padding: '1.25rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#a8a8a8', display: 'block', marginBottom: '0.5rem' }}>Net Equity</span>
                    <strong style={{ fontSize: '1.75rem', fontWeight: 600, color: '#ffffff' }}>$128,450.00</strong>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', color: '#24a148', fontSize: '0.875rem' }}>
                      <ArrowUpRight size={16} />
                      <span>+5.1% margin buffer</span>
                    </div>
                  </Tile>
                  <Tile style={{ padding: '1.25rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#a8a8a8', display: 'block', marginBottom: '0.5rem' }}>Free Margin</span>
                    <strong style={{ fontSize: '1.75rem', fontWeight: 600, color: '#ffffff' }}>$98,120.00</strong>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#8d8d8d', marginTop: '10px' }}>76.4% utilization rate</span>
                  </Tile>
                </div>

                <Tile style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.25rem' }}>
                  <h4 style={{ margin: 0, fontWeight: 500 }}>Asset Allocation (Placeholder)</h4>
                  <div style={{ overflowX: 'auto', border: '1px solid #393939', borderRadius: '4px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #393939', backgroundColor: '#262626' }}>
                          <th style={{ padding: '1rem' }}>Asset Class</th>
                          <th style={{ padding: '1rem' }}>Allocation</th>
                          <th style={{ padding: '1rem' }}>Current Value</th>
                          <th style={{ padding: '1rem' }}>Unrealized PnL</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid #393939' }}>
                          <td style={{ padding: '1rem', fontWeight: 500 }}>Gold (XAUUSD)</td>
                          <td style={{ padding: '1rem' }}>65.0%</td>
                          <td style={{ padding: '1rem' }}>$80,925.00</td>
                          <td style={{ padding: '1rem', color: '#24a148' }}>+$3,950.00</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #393939' }}>
                          <td style={{ padding: '1rem', fontWeight: 500 }}>Cash (USD)</td>
                          <td style={{ padding: '1rem' }}>35.0%</td>
                          <td style={{ padding: '1rem' }}>$43,575.00</td>
                          <td style={{ padding: '1rem', color: '#8d8d8d' }}>—</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </Tile>
              </div>
            )}

            {currentTab === 'performance' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
                  <Tile style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#a8a8a8' }}>Win Rate</span>
                    <strong style={{ display: 'block', fontSize: '1.5rem', marginTop: '0.5rem' }}>68.5%</strong>
                  </Tile>
                  <Tile style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#a8a8a8' }}>Profit Factor</span>
                    <strong style={{ display: 'block', fontSize: '1.5rem', marginTop: '0.5rem' }}>1.84</strong>
                  </Tile>
                  <Tile style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#a8a8a8' }}>Sharpe Ratio</span>
                    <strong style={{ display: 'block', fontSize: '1.5rem', marginTop: '0.5rem' }}>2.10</strong>
                  </Tile>
                  <Tile style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#a8a8a8' }}>Max Drawdown</span>
                    <strong style={{ display: 'block', fontSize: '1.5rem', marginTop: '0.5rem', color: '#fa4d56' }}>-4.8%</strong>
                  </Tile>
                </div>

                <Tile style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', backgroundColor: '#262626', gap: '1rem' }}>
                  <Information size={32} style={{ color: '#8d8d8d' }} />
                  <div style={{ textAlign: 'center' }}>
                    <h5 style={{ margin: '0 0 0.5rem 0', fontWeight: 500 }}>Performance History (Placeholder)</h5>
                    <p style={{ color: '#8d8d8d', fontSize: '0.875rem' }}>Interactive performance history visualization and trade distribution graphs will be populated here.</p>
                  </div>
                </Tile>
              </div>
            )}

            {currentTab === 'settings' && (
              <Tile style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h4 style={{ margin: 0, fontWeight: 500 }}>Risk & Account Configuration</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '500px' }}>
                  <TextInput 
                    id="account-label"
                    labelText="Account Alias"
                    placeholder="e.g. Primary Live Trading"
                    defaultValue="Quant-Live-01"
                  />

                  <Select id="leverage-select" labelText="Max Leverage Allowed" defaultValue="1:50">
                    <SelectItem value="1:10" text="1:10" />
                    <SelectItem value="1:20" text="1:20" />
                    <SelectItem value="1:50" text="1:50" />
                    <SelectItem value="1:100" text="1:100" />
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
                    <Toggle 
                      id="toggle-daily-report"
                      labelA="Off"
                      labelB="On"
                      labelText="Receive daily performance email summary"
                    />
                  </div>

                  <div style={{ marginTop: '1rem' }}>
                    <Button size="sm">Save Account Settings</Button>
                  </div>
                </div>
              </Tile>
            )}
          </div>
        </div>
      </Column>
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
