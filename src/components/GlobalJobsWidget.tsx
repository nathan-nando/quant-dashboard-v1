"use client";

import React, { useState, useEffect, useRef } from "react";
import { ProgressBar, Button, ToastNotification } from "@carbon/react";
import { Document, ChevronUp, ChevronDown, View, Stop, TrashCan } from "@carbon/icons-react";

interface GlobalJobsWidgetProps {
  target: string;
  refreshTrigger?: number;
  onJobComplete?: () => void;
  openJobDetails: (id: string) => void;
  onLogLine?: (taskId: string, line: string) => void;
}

export default function GlobalJobsWidget({ target, refreshTrigger, onJobComplete, openJobDetails, onLogLine }: GlobalJobsWidgetProps) {
  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  const [isWidgetCollapsed, setIsWidgetCollapsed] = useState(false);
  const [progressData, setProgressData] = useState<Record<string, { label: string, value: number }>>({});
  const activeSSERef = useRef<Record<string, EventSource>>({});
  const [notification, setNotification] = useState<{kind: "success" | "error" | "info", title: string, subtitle: string} | null>(null);

  const fetchActiveJobs = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/jobs/active?target=${target}`);
      if (res.ok) {
        const data = await res.json();
        setActiveJobs(data.jobs);
        data.jobs.forEach((job: any) => {
          if (job.status === "running") {
            connectToSSE(job.task_id);
          }
        });
      }
    } catch (e) {
      console.error("Failed to fetch active jobs", e);
    }
  };

  useEffect(() => {
    fetchActiveJobs();
    const interval = setInterval(fetchActiveJobs, 15000);
    return () => {
      clearInterval(interval);
      Object.values(activeSSERef.current).forEach(source => source.close());
    };
  }, [target, refreshTrigger]);

  const connectToSSE = (taskId: string) => {
    if (activeSSERef.current[taskId]) return;

    setProgressData(prev => ({ ...prev, [taskId]: prev[taskId] || { label: "Connecting...", value: 0 } }));

    const eventSource = new EventSource(`http://127.0.0.1:8000/api/jobs/stream/${taskId}`);
    activeSSERef.current[taskId] = eventSource;

    let hasError = false;

    eventSource.onmessage = (event) => {
      const msg = event.data;
      
      if (onLogLine) {
        onLogLine(taskId, msg);
      }
      
      if (msg.includes("ERROR:")) {
         hasError = true;
      }

      if (msg.includes("[DONE]")) {
        eventSource.close();
        delete activeSSERef.current[taskId];
        setProgressData(prev => {
          const newP = { ...prev };
          delete newP[taskId];
          return newP;
        });
        
        fetchActiveJobs();
        if (onJobComplete) onJobComplete();
        
        setNotification({
           kind: hasError ? "error" : "success",
           title: hasError ? "Job Failed" : "Job Complete",
           subtitle: hasError ? "Check logs for details." : `Job finished successfully.`
        });
        setTimeout(() => setNotification(null), 8000);
      } else {
        let val = 0;
        const match = msg.match(/PROGRESS:\s*(\d+)%/);
        if (match) val = parseInt(match[1]);
        const cleanedMsg = msg.replace(/PROGRESS:\s*\d+%\s*-\s*/, '');
        const displayMsg = cleanedMsg.length > 45 ? cleanedMsg.substring(0, 45) + '...' : cleanedMsg;
        setProgressData(prev => ({ ...prev, [taskId]: { label: displayMsg, value: val || prev[taskId]?.value || 0 } }));
      }
    };

    eventSource.onerror = (e) => {
        console.error("SSE Error", e);
        eventSource.close();
        delete activeSSERef.current[taskId];
        fetchActiveJobs();
    };
  };

  const handleCancelJob = async (jobId: string) => {
    try {
        const res = await fetch(`http://127.0.0.1:8000/api/jobs/cancel/${jobId}`, { method: 'POST' });
        if(res.ok) {
            setNotification({ kind: 'info', title: 'Job Cancelled', subtitle: 'Sent cancellation signal.' });
            fetchActiveJobs();
        }
    } catch(e) { }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (confirm("Are you sure you want to completely delete this job record?")) {
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/jobs/${jobId}`, { method: 'DELETE' });
            if(res.ok) {
                setNotification({ kind: 'success', title: 'Job Deleted', subtitle: 'Job has been completely removed.' });
                fetchActiveJobs();
                if(onJobComplete) onJobComplete();
            }
        } catch(e) { 
            console.error("Failed to delete job", e);
        }
    }
  };

  const widgetJobs = activeJobs.filter(job => job.status?.toLowerCase() !== 'done' && job.status?.toLowerCase() !== 'success');
  if (widgetJobs.length === 0) return null;

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
      
      <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', width: '380px', backgroundColor: 'var(--cds-layer-01, #262626)', boxShadow: '0 4px 8px rgba(0,0,0,0.5)', zIndex: 9999, border: '1px solid var(--cds-border-subtle, #393939)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ backgroundColor: 'var(--cds-layer-02, #393939)', color: 'var(--cds-text-primary, #f4f4f4)', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setIsWidgetCollapsed(!isWidgetCollapsed)}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Active Jobs ({target})</span>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {isWidgetCollapsed ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
        </div>
        
        {!isWidgetCollapsed && (
        <div style={{ padding: '0', maxHeight: '400px', overflowY: 'auto', overflowX: 'hidden' }}>
            {widgetJobs.map(job => {
              const displayName = job.payload?.model_name || job.payload?.name || job.payload?.regime || "Unknown Task";
              return (
              <div key={job.task_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderBottom: '1px solid var(--cds-border-subtle, #393939)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, overflow: 'hidden' }}>
                    <div style={{ color: 'var(--cds-icon-secondary, #c6c6c6)', display: 'flex', alignItems: 'center' }}>
                        <Document size={24} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.875rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--cds-text-primary, #f4f4f4)' }}>{displayName}</span>
                        </div>
                        {job.status === 'running' ? (
                            <div style={{ marginTop: '0.5rem', width: '100%', minWidth: 0 }}>
                                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '230px' }}>
                                  <ProgressBar 
                                      label={progressData[job.task_id] ? progressData[job.task_id].label : "Starting..."} 
                                      value={progressData[job.task_id] ? progressData[job.task_id].value : undefined} 
                                  />
                                </div>
                            </div>
                        ) : (
                            <span style={{ fontSize: '0.75rem', color: job.status?.toLowerCase() === 'failed' || job.status?.toLowerCase() === 'error' ? '#da1e28' : '#24a148' }}>
                                {job.status}
                            </span>
                        )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', paddingLeft: '0.5rem' }}>
                    {job.status === 'running' ? (
                        <>
                          <Button kind="ghost" size="sm" renderIcon={View} hasIconOnly iconDescription="Logs" onClick={() => openJobDetails(job.task_id)} />
                          <Button kind="ghost" size="sm" renderIcon={Stop} hasIconOnly iconDescription="Cancel" onClick={() => handleCancelJob(job.task_id)} />
                        </>
                    ) : (
                        <>
                            <Button kind="ghost" size="sm" renderIcon={View} hasIconOnly iconDescription="Logs" onClick={() => openJobDetails(job.task_id)} />
                            <Button kind="ghost" size="sm" renderIcon={TrashCan} hasIconOnly iconDescription="Dismiss" onClick={() => handleDeleteJob(job.task_id)} />
                        </>
                    )}
                  </div>
              </div>
            )})}
        </div>
        )}
      </div>
    </>
  );
}
