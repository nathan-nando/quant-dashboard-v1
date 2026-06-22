"use client";

import React, { useState, useEffect, useRef } from "react";
import { ProgressBar, Button, ToastNotification, Modal } from "@carbon/react";
import { Document, ChevronUp, ChevronDown, View, Stop, TrashCan, Play } from "@carbon/icons-react";
import { useGlobalState } from "../contexts/GlobalStateContext";

interface GlobalJobsWidgetProps {
  target?: string;
  refreshTrigger?: number; // Kept for interface compatibility
  onJobComplete?: () => void;
  openJobDetails: (id: string) => void;
}

export default function GlobalJobsWidget({ target, onJobComplete, openJobDetails }: GlobalJobsWidgetProps) {
  const { state } = useGlobalState();
  const rawJobs = state?.active_jobs || [];
  
  // Filter jobs by target if provided
  const activeJobs = target ? rawJobs.filter((job: any) => job.target === target) : rawJobs;

  const [isWidgetCollapsed, setIsWidgetCollapsed] = useState(true);
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

  const prevActiveJobsRef = useRef<any[]>([]);

  useEffect(() => {
    // Detect transitions when activeJobs updates from the global stream
    const prevJobs = prevActiveJobsRef.current;
    let jobCompleted = false;
    let completedWithSuccess = false;
    let completedWithFailure = false;

    prevJobs.forEach((prevJob) => {
      const currentJob = activeJobs.find((j: any) => j.task_id === prevJob.task_id);
      const wasRunning = prevJob.status === "running";
      const isFinished = !currentJob || currentJob.status !== "running";

      if (wasRunning && isFinished) {
        jobCompleted = true;
        const finalStatus = currentJob ? currentJob.status : "done";
        if (finalStatus?.toLowerCase() === "failed" || finalStatus?.toLowerCase() === "error") {
          completedWithFailure = true;
        } else {
          completedWithSuccess = true;
        }
      }
    });

    prevActiveJobsRef.current = activeJobs;

    if (jobCompleted) {
      if (onJobComplete) onJobComplete();
      window.dispatchEvent(new CustomEvent('job-complete'));

      if (completedWithFailure) {
        setNotification({
          kind: "error",
          title: "Job Failed",
          subtitle: "One or more tasks failed. Check logs for details."
        });
      } else if (completedWithSuccess) {
        setNotification({
          kind: "success",
          title: "Job Complete",
          subtitle: "Task finished successfully."
        });
      }
      setTimeout(() => setNotification(null), 8000);
    }
  }, [activeJobs, onJobComplete]);

  const handleRetryJob = async (jobId: string) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/jobs/retry/${jobId}`, { method: 'POST' });
      if(res.ok) {
        setNotification({ kind: 'success', title: 'Retry Started', subtitle: 'Job has been restarted.' });
        if (onJobComplete) onJobComplete();
      }
    } catch(e) {}
  };

  const handleCancelJob = async (jobId: string) => {
    try {
        const res = await fetch(`http://127.0.0.1:8000/api/jobs/cancel/${jobId}`, { method: 'POST' });
        if(res.ok) {
             setNotification({ kind: 'info', title: 'Job Cancelled', subtitle: 'Sent cancellation signal.' });
        }
    } catch(e) { }
  };

  const handleDeleteJob = (jobId: string) => {
    setConfirmModalConfig({
      isOpen: true,
      title: "Delete Job Record",
      body: "Are you sure you want to completely delete this job record?",
      onConfirm: async () => {
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/jobs/${jobId}`, { method: 'DELETE' });
            if(res.ok) {
                 setNotification({ kind: 'success', title: 'Job Deleted', subtitle: 'Job has been completely removed.' });
                 if(onJobComplete) onJobComplete();
            }
        } catch(e) { 
            console.error("Failed to delete job", e);
        }
        setConfirmModalConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const widgetJobs = activeJobs.filter((job: any) => job.status?.toLowerCase() !== 'done' && job.status?.toLowerCase() !== 'success');
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
      
      <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', width: '380px', backgroundColor: 'var(--cds-layer-01, #262626)', boxShadow: 'none', zIndex: 9999, border: 'none', display: 'flex', flexDirection: 'column' }}>
        <div style={{ backgroundColor: 'var(--cds-layer-02, #393939)', color: 'var(--cds-text-primary, #f4f4f4)', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setIsWidgetCollapsed(!isWidgetCollapsed)}>
             <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Active Jobs ({widgetJobs.length}){target ? ` - ${target}` : ''}</span>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {isWidgetCollapsed ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
        </div>
        
        {!isWidgetCollapsed && (
        <div style={{ padding: '0', maxHeight: '400px', overflowY: 'auto', overflowX: 'hidden' }}>
            {widgetJobs.map((job: any) => {
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
                                      label={job.latest_log || "Starting..."} 
                                      value={job.progress !== undefined ? job.progress : undefined} 
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
                            {job.status?.toLowerCase() !== 'running' && (
                                <Button kind="ghost" size="sm" renderIcon={Play} hasIconOnly iconDescription="Retry" onClick={() => handleRetryJob(job.task_id)} />
                            )}
                            <Button kind="ghost" size="sm" renderIcon={TrashCan} hasIconOnly iconDescription="Dismiss" onClick={() => handleDeleteJob(job.task_id)} />
                        </>
                    )}
                  </div>
              </div>
            )})}
        </div>
        )}
      </div>

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
    </>
  );
}
