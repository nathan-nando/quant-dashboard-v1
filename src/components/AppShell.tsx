"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Header,
  HeaderContainer,
  HeaderName,
  HeaderNavigation,
  HeaderMenuItem,
  HeaderGlobalBar,
  HeaderGlobalAction,
  SkipToContent,
  Theme,
  Modal,
  CodeSnippet,
  HeaderMenuButton,
  SideNav,
  SideNavItems,
  SideNavLink
} from '@carbon/react';
import { Settings, Notification, Dashboard, SettingsAdjust, Activity, MachineLearningModel, Analytics, User, Terminal, Meter } from '@carbon/icons-react';
import MarketClock from './MarketClock';
import HeaderMetrics from './HeaderMetrics';
import GlobalJobsWidget from './GlobalJobsWidget';
import { useGlobalState } from '@/contexts/GlobalStateContext';
import { API_BASE_URL } from '@/config/env';

const HeaderAny = Header as any;

const HeaderAccountBadge = () => {
  const { state } = useGlobalState();
  if (!state || !state.account_info) return null;
  const acc = state.account_info;
  const isLive = acc.mode === 'LIVE';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '3px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '1px 4px', backgroundColor: isLive ? '#24a148' : '#0f62fe', color: 'white', fontSize: '8px', fontWeight: 600, borderRadius: '2px', lineHeight: 1, height: '12px' }}>
          {acc.mode}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', lineHeight: 1.1 }}>
           <strong style={{ fontSize: '0.875rem', color: '#fff' }}>
             ${(acc.equity || acc.balance || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
           </strong>
           {acc.profit !== undefined && acc.profit !== 0 && (
              <span style={{ fontSize: '0.65rem', color: acc.profit >= 0 ? '#24a148' : '#fa4d56', marginLeft: '4px' }}>
                 ({acc.profit > 0 ? '+' : ''}{acc.profit.toLocaleString(undefined, {minimumFractionDigits: 2})})
              </span>
           )}
        </div>
      </div>
    </div>
  );
};

const MobileAccountBadge = () => {
  const { state } = useGlobalState();
  if (!state || !state.account_info) return null;
  const acc = state.account_info;
  const isLive = acc.mode === 'LIVE';
  const currentPrice = state?.price?.last > 0 ? state?.price?.last : state?.price?.ask;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', height: '100%', padding: '0 0.5rem' }}>
      {/* Column 1: Account Mode & Equity Value */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
        <div style={{ height: '14px', display: 'flex', alignItems: 'center', marginBottom: '2px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '1px 4px', backgroundColor: isLive ? '#24a148' : '#0f62fe', color: 'white', fontSize: '7px', fontWeight: 700, lineHeight: 1, height: '12px' }}>
            {acc.mode}
          </div>
        </div>
        <strong style={{ fontSize: '0.85rem', color: '#fff', lineHeight: 1 }}>
          ${(acc.equity || acc.balance || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
        </strong>
      </div>

      {/* Column 2: XAUUSD Symbol & Price */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
        <div style={{ height: '14px', display: 'flex', alignItems: 'center', marginBottom: '2px' }}>
          <span style={{ fontSize: '0.65rem', color: '#a8a8a8', textTransform: 'uppercase', fontWeight: 500, letterSpacing: '0.2px', lineHeight: 1 }}>XAUUSD</span>
        </div>
        <strong style={{ fontSize: '0.85rem', color: '#f1c21b', fontFamily: 'monospace', lineHeight: 1 }}>
          {currentPrice ? currentPrice.toFixed(2) : '---'}
        </strong>
      </div>
    </div>
  );
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Job Logs Modal States
  const [detailLogs, setDetailLogs] = useState<string>("");
  const [isDetailModalOpen, setDetailModalOpen] = useState(false);
  const [detailJobId, setDetailJobId] = useState<string | null>(null);
  const detailEventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const handleOpenDetails = (e: Event) => {
      const jobId = (e as CustomEvent).detail?.jobId;
      if (jobId) openJobDetails(jobId);
    };
    window.addEventListener('open-job-details', handleOpenDetails);
    return () => {
      window.removeEventListener('open-job-details', handleOpenDetails);
    };
  }, []);

  const openJobDetails = async (jobId: string) => {
    setDetailLogs("Loading logs...");
    setDetailModalOpen(true);
    setDetailJobId(jobId);

    // Clean up any existing connection
    if (detailEventSourceRef.current) {
      detailEventSourceRef.current.close();
      detailEventSourceRef.current = null;
    }

    try {
      // Check if job is currently running
      let isRunning = false;
      const activeRes = await fetch(`${API_BASE_URL}/jobs/active`);
      if (activeRes.ok) {
        const activeData = await activeRes.json();
        isRunning = activeData.jobs.some((j: any) => j.task_id === jobId && j.status === "running");
      }

      if (isRunning) {
        let isFirstLine = true;
        const eventSource = new EventSource(`${API_BASE_URL}/jobs/stream/${jobId}`);
        detailEventSourceRef.current = eventSource;

        eventSource.onmessage = (event) => {
          const msg = event.data;
          if (msg.includes("[DONE]")) {
            eventSource.close();
            if (detailEventSourceRef.current === eventSource) {
              detailEventSourceRef.current = null;
            }
          } else {
            setDetailLogs(prev => {
              if (isFirstLine || prev === "Loading logs..." || prev === "No logs available.") {
                isFirstLine = false;
                return msg;
              }
              return prev + "\n" + msg;
            });
          }
        };

        eventSource.onerror = () => {
          eventSource.close();
          if (detailEventSourceRef.current === eventSource) {
            detailEventSourceRef.current = null;
          }
        };
      } else {
        // Fetch static logs
        const res = await fetch(`${API_BASE_URL}/jobs/logs/${jobId}`);
        if (res.ok) {
          const data = await res.json();
          setDetailLogs(data.logs || "No logs available.");
        } else {
          setDetailLogs("Failed to load logs.");
        }
      }
    } catch (e) {
      setDetailLogs("Failed to load logs.");
    }
  };

  const closeJobDetails = () => {
    setDetailModalOpen(false);
    setDetailJobId(null);
    if (detailEventSourceRef.current) {
      detailEventSourceRef.current.close();
      detailEventSourceRef.current = null;
    }
  };

  const navItem = (href: string, label: string, Icon: any) => (
    <HeaderMenuItem
      href={href}
      onClick={(e: React.MouseEvent) => { e.preventDefault(); router.push(href); }}
      aria-current={pathname === href ? 'page' : undefined}
      className="desktop-nav-item"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Icon size={16} /> {label}
      </div>
    </HeaderMenuItem>
  );

  const sideNavItem = (href: string, label: string, Icon: any, onClickExpand: () => void) => (
    <SideNavLink
      href={href}
      onClick={(e: React.MouseEvent) => { 
        e.preventDefault(); 
        router.push(href);
        if (onClickExpand) onClickExpand();
      }}
      aria-current={pathname === href ? 'page' : undefined}
      renderIcon={() => <Icon size={20} />}
    >
      {label}
    </SideNavLink>
  );



  return (
    <>
      <Theme theme="g100">
        <HeaderContainer
          render={({ isSideNavExpanded, onClickSideNavExpand }: any) => (
            <>
              <HeaderAny aria-label="QuantV1" style={{ display: 'flex', alignItems: 'stretch' }}>
                <SkipToContent />

                <HeaderMenuButton
                  aria-label="Open menu"
                  onClick={onClickSideNavExpand}
                  isActive={isSideNavExpanded}
                />

                {/* Brand — in normal flow */}
                <HeaderName
                  href="/"
                  onClick={(e: React.MouseEvent) => { e.preventDefault(); router.push('/'); }}
                  prefix=""
                  className="hide-on-mobile"
                  style={{ fontSize: '1.25rem', fontWeight: 600, letterSpacing: '0.5px', flexShrink: 0 }}
                >
                  QuantV1
                </HeaderName>
                <div className="show-on-mobile-flex">
                  <MobileAccountBadge />
                </div>
                {/* Group 1 — starts flush after brand, aligns with page content */}
                <HeaderNavigation aria-label="Main" style={{ border: 'none' }} className="desktop-nav">
                  {navItem('/account', 'Account', User)}
                  {navItem('/signals', 'Signals', Activity)}
                  {navItem('/monitoring', 'Monitoring', Meter)}
                </HeaderNavigation>

                {/* Spacer — pushes Group 2 toward the right */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', height: '100%', overflow: 'hidden' }} className="header-spacer hide-on-mobile">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div className="hide-on-mobile">
                      <MarketClock />
                    </div>
                    <HeaderAccountBadge />
                  </div>
                  <HeaderMetrics />
                </div>

                {/* Group 2 — sits just before the global action icons */}
                <HeaderNavigation aria-label="Tools" style={{ border: 'none' }} className="desktop-nav">
                  {navItem('/thresholds', 'Thresholds', SettingsAdjust)}
                  {navItem('/models', 'Models', MachineLearningModel)}
                  {navItem('/simulation', 'Simulation', Analytics)}
                </HeaderNavigation>

                {/* Global actions */}
                <div style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto' }}>
                  <div className="hide-on-mobile">
                    <HeaderGlobalBar>
                      <HeaderGlobalAction aria-label="Notifications" tooltipAlignment="end">
                        <Notification size={20} />
                      </HeaderGlobalAction>
                      <HeaderGlobalAction aria-label="Settings" tooltipAlignment="end" onClick={() => router.push('/settings')}>
                        <Settings size={20} />
                      </HeaderGlobalAction>
                    </HeaderGlobalBar>
                  </div>
                </div>
              </HeaderAny>
              <SideNav
                aria-label="Side navigation"
                expanded={isSideNavExpanded}
                isPersistent={false}
                onOverlayClick={onClickSideNavExpand}
                style={{ display: 'flex', flexDirection: 'column' }}
              >
                {/* Brand title inside sidebar - visible on mobile only */}
                <div className="show-on-mobile" style={{ padding: '1rem 1.5rem', marginBottom: '0.5rem', flexShrink: 0 }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fff' }}>QuantV1</h2>
                </div>

                <SideNavItems>
                  {sideNavItem('/account', 'Account', User, onClickSideNavExpand)}
                  {sideNavItem('/signals', 'Signals', Activity, onClickSideNavExpand)}
                  {sideNavItem('/thresholds', 'Thresholds', SettingsAdjust, onClickSideNavExpand)}
                  {sideNavItem('/monitoring', 'Monitoring', Meter, onClickSideNavExpand)}
                  {sideNavItem('/models', 'Models', MachineLearningModel, onClickSideNavExpand)}
                  {sideNavItem('/simulation', 'Simulation', Analytics, onClickSideNavExpand)}

                  {/* Notifications and Settings inside sidebar - visible on mobile only - pushed to the very bottom as icons only */}
                  <div className="show-on-mobile" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, borderTop: '1px solid #393939', padding: '0.75rem 1.5rem calc(0.75rem + env(safe-area-inset-bottom, 16px)) 1.5rem', backgroundColor: '#161616', zIndex: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      {/* Settings Icon (Gear) on the left */}
                      <button
                        type="button"
                        title="Settings"
                        onClick={(e) => {
                          e.preventDefault();
                          router.push('/settings');
                          onClickSideNavExpand();
                        }}
                        style={{ background: 'none', border: 'none', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Settings size={22} color="#f4f4f4" />
                      </button>

                      {/* Notifications Icon (Bell) on the far right */}
                      <button
                        type="button"
                        title="Notifications"
                        onClick={(e) => {
                          e.preventDefault();
                          onClickSideNavExpand();
                        }}
                        style={{ background: 'none', border: 'none', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Notification size={22} color="#f4f4f4" />
                      </button>
                    </div>
                  </div>
                </SideNavItems>
              </SideNav>
            </>
          )}
        />
      </Theme>
      <Theme theme="g100" className="main-theme-wrapper">
        <main style={{ marginTop: '3rem', padding: '1rem 0', minHeight: 'calc(100vh - 3rem)' }}>
          {children}
        </main>
      </Theme>

      <Theme theme="g100">
        {/* Logs Modal */}
        <Modal 
            open={isDetailModalOpen} 
            onRequestClose={closeJobDetails} 
            passiveModal 
            modalHeading="Job Logs" 
        >
            <div style={{ height: "75vh", overflowY: "auto", overflowX: "hidden", display: "flex", flexDirection: "column" }}>
                <div style={{ flexGrow: 1, minHeight: "100%" }}>
                    <CodeSnippet type="multi" feedback="Copied to clipboard" maxCollapsedNumberOfRows={0} maxExpandedNumberOfRows={0}>
                        {detailLogs}
                    </CodeSnippet>
                </div>
            </div>
        </Modal>

        {/* Global Jobs Widget (monitoring all active dataset & training jobs) */}
        <GlobalJobsWidget openJobDetails={openJobDetails} />
      </Theme>
    </>
  );
}
