"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Column, Grid, Modal, CodeSnippet, Tag } from '@carbon/react';
import { Terminal, Activity, Task } from '@carbon/icons-react';
import DashboardPanel from '@/components/DashboardPanel';
import GlobalTable from '@/components/GlobalTable';
import GlobalHealthWidget from '@/components/GlobalHealthWidget';
import GlobalJobsTable from '@/components/GlobalJobsTable';
import DriftMetricsWidget from '@/components/DriftMetricsWidget';
import { API_BASE_URL } from '@/config/env';

function MonitoringPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'health';

  const navItems = [
    { id: 'health', label: 'Model Health', icon: Activity },
    { id: 'logs', label: 'Audit Logs', icon: Terminal },
    { id: 'jobs', label: 'Background Jobs', icon: Task }
  ];

  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
  const [logDetail, setLogDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [models, setModels] = useState<any[]>([]);
  const [refreshJobsTrigger, setRefreshJobsTrigger] = useState(0);

  const handleTabChange = (tabId: string) => {
    router.push(`${pathname}?tab=${tabId}`);
  };

  const handleJobChange = () => {
    setRefreshJobsTrigger(prev => prev + 1);
  };

  const openJobDetails = (jobId: string) => {
    window.dispatchEvent(new CustomEvent('open-job-details', { detail: { jobId } }));
  };

  // Fetch log detail
  useEffect(() => {
    if (selectedLogId !== null) {
      setDetailLoading(true);
      fetch(`${API_BASE_URL}/dashboard/audit-logs/${selectedLogId}`)
        .then(res => res.json())
        .then(data => {
          setLogDetail(data);
          setDetailLoading(false);
        })
        .catch(e => {
          console.error(e);
          setDetailLoading(false);
        });
    } else {
      setLogDetail(null);
    }
  }, [selectedLogId]);

  // Fetch models for health widget
  useEffect(() => {
    fetch(`${API_BASE_URL}/models`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setModels(data);
        }
      })
      .catch(console.error);
  }, []);

  const headers = [
    { key: "timestamp", header: "Time" },
    { key: "category", header: "Category" },
    { key: "event", header: "Event" }
  ];

  const formatCell = (cellId: string, value: any) => {
    const col = cellId.split('__')[1] || cellId.split(':').pop() || '';
    if (col === 'category') {
      let color = '#a8a8a8';
      if (value === 'ANOMALY') color = '#da1e28';
      else if (value === 'SIGNAL') color = '#0f62fe';
      else if (value === 'EXECUTION') color = '#24a148';
      return (
        <span style={{ textTransform: 'uppercase', fontWeight: 600, color }}>
          {value}
        </span>
      );
    }
    if (col === 'timestamp') {
      if (!value) return "-";
      const d = new Date(value);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
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
    return value;
  };

  return (
    <>
      <Grid fullWidth>
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

            {/* Tab Content Panels */}
            <div style={{ flex: 1 }}>
              {/* Tab 1: Audit Logs */}
              {currentTab === 'logs' && (
                <DashboardPanel title="Audit Logs History" tooltipInfo="List of all system audit logs.">
                  <GlobalTable 
                    title=""
                    headers={headers}
                    fetchUrl={`${API_BASE_URL}/dashboard/audit-logs`}
                    formatCell={formatCell}
                    onViewDetails={(id) => setSelectedLogId(Number(id))}
                  />
                </DashboardPanel>
              )}

              {/* Tab 2: Model Health */}
              {currentTab === 'health' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <GlobalHealthWidget models={models} />
                  <DriftMetricsWidget models={models} />
                </div>
              )}

              {/* Tab 3: Background Jobs */}
              {currentTab === 'jobs' && (
                <DashboardPanel title="Background Jobs History" tooltipInfo="List of all dataset ingestion and model training background jobs.">
                  <GlobalJobsTable 
                    refreshTrigger={refreshJobsTrigger} 
                    openJobDetails={openJobDetails} 
                    onJobChange={handleJobChange} 
                    collapsible={false}
                    defaultCollapsed={false}
                  />
                </DashboardPanel>
              )}
            </div>
          </div>
        </Column>
      </Grid>

      {/* Audit Log Detail Modal */}
      <Modal
        open={selectedLogId !== null}
        modalHeading={logDetail ? `Audit Log Details: ${logDetail.category}` : "Loading..."}
        primaryButtonText="Close"
        onRequestClose={() => setSelectedLogId(null)}
        onRequestSubmit={() => setSelectedLogId(null)}
        size="lg"
      >
        {detailLoading ? (
          <p>Loading details...</p>
        ) : logDetail ? (
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Time: </strong> {new Date(logDetail.timestamp).toLocaleString()}<br/>
              <strong>Event: </strong> {logDetail.event}
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <h5 style={{ marginBottom: '0.5rem' }}>Context / Details</h5>
                <CodeSnippet type="multi" light>
                  {JSON.stringify(logDetail.context, null, 2)}
                </CodeSnippet>
              </div>

              {logDetail.request_data && (
                <div style={{ flex: 1 }}>
                  <h5 style={{ marginBottom: '0.5rem' }}>Request Data</h5>
                  <CodeSnippet type="multi" light>
                    {JSON.stringify(logDetail.request_data, null, 2)}
                  </CodeSnippet>
                </div>
              )}

              {logDetail.response_data && (
                <div style={{ flex: 1 }}>
                  <h5 style={{ marginBottom: '0.5rem' }}>Response Data</h5>
                  <CodeSnippet type="multi" light>
                    {JSON.stringify(logDetail.response_data, null, 2)}
                  </CodeSnippet>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p>Failed to load log details.</p>
        )}
      </Modal>
    </>
  );
}

export default function MonitoringPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem' }}>Loading monitoring...</div>}>
      <MonitoringPageContent />
    </Suspense>
  );
}
