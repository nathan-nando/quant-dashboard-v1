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
  CodeSnippet
} from '@carbon/react';
import { Settings, Notification, Dashboard, SettingsAdjust, Activity, MachineLearningModel, Analytics, User } from '@carbon/icons-react';
import MarketClock from './MarketClock';
import HeaderMetrics from './HeaderMetrics';
import GlobalJobsWidget from './GlobalJobsWidget';
import { useGlobalState } from '@/contexts/GlobalStateContext';

const HeaderAny = Header as any;

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { state } = useGlobalState();

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
      const activeRes = await fetch("http://127.0.0.1:8000/api/jobs/active");
      if (activeRes.ok) {
        const activeData = await activeRes.json();
        isRunning = activeData.jobs.some((j: any) => j.task_id === jobId && j.status === "running");
      }

      if (isRunning) {
        let isFirstLine = true;
        const eventSource = new EventSource(`http://127.0.0.1:8000/api/jobs/stream/${jobId}`);
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
        const res = await fetch(`http://127.0.0.1:8000/api/jobs/logs/${jobId}`);
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
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Icon size={16} /> {label}
      </div>
    </HeaderMenuItem>
  );

  const HeaderAccountBadge = () => {
    if (!state || !state.account_info) return null;
    const acc = state.account_info;
    const isLive = acc.mode === 'LIVE';
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', lineHeight: 1.1 }}>
            <span style={{ fontSize: '0.65rem', color: '#a8a8a8' }}>{acc.login} | {acc.server}</span>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '1px 3px', backgroundColor: isLive ? '#24a148' : '#0f62fe', color: 'white', fontSize: '8px', fontWeight: 600, borderRadius: '2px', lineHeight: 1, height: '12px' }}>
              {acc.mode}
            </div>
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

  return (
    <>
      <Theme theme="g100">
        <HeaderContainer
          render={() => (
            <HeaderAny aria-label="QuantV1" style={{ display: 'flex', alignItems: 'stretch' }}>
              <SkipToContent />

              {/* Brand — in normal flow */}
              <HeaderName
                href="/"
                onClick={(e: React.MouseEvent) => { e.preventDefault(); router.push('/'); }}
                prefix=""
                style={{ fontSize: '1.25rem', fontWeight: 600, letterSpacing: '0.5px', flexShrink: 0 }}
              >
                QuantV1
              </HeaderName>

              {/* Group 1 — starts flush after brand, aligns with page content */}
              <HeaderNavigation aria-label="Main" style={{ border: 'none' }}>
                {navItem('/', 'Dashboard', Dashboard)}
                {navItem('/account', 'Account', User)}
                {navItem('/signals', 'Signals', Activity)}
                {navItem('/thresholds', 'Thresholds', SettingsAdjust)}
              </HeaderNavigation>

              {/* Spacer — pushes Group 2 toward the right */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', height: '100%' }}>
                <MarketClock />
                <HeaderAccountBadge />
              </div>

              {/* Group 2 — sits just before the global action icons */}
              <HeaderNavigation aria-label="Tools" style={{ border: 'none' }}>
                {navItem('/models', 'Models', MachineLearningModel)}
                {navItem('/simulation', 'Simulation', Analytics)}
              </HeaderNavigation>

              {/* Global actions */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <HeaderMetrics />
                <HeaderGlobalBar>
                  <HeaderGlobalAction aria-label="Notifications" tooltipAlignment="end">
                    <Notification size={20} />
                  </HeaderGlobalAction>
                  <HeaderGlobalAction aria-label="Settings" tooltipAlignment="end" onClick={() => router.push('/settings')}>
                    <Settings size={20} />
                  </HeaderGlobalAction>
                </HeaderGlobalBar>
              </div>
            </HeaderAny>
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
