"use client";

import React, { useState, useEffect } from "react";
import { Button, ToastNotification, Modal } from "@carbon/react";
import { Document, TrashCan, Play } from "@carbon/icons-react";
import GlobalTable from "./GlobalTable";

interface GlobalJobsTableProps {
  target?: string;
  refreshTrigger: number;
  openJobDetails: (id: string) => void;
  onJobChange: () => void;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export default function GlobalJobsTable({ 
  target, 
  refreshTrigger, 
  openJobDetails, 
  onJobChange,
  collapsible = true,
  defaultCollapsed = true
}: GlobalJobsTableProps) {
  const [historyJobs, setHistoryJobs] = useState<any[]>([]);
  const [notification, setNotification] = useState<any>(null);
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

  const fetchHistoryJobs = async () => {
    try {
      const url = target
        ? `http://127.0.0.1:8000/api/jobs/history?target=${target}`
        : `http://127.0.0.1:8000/api/jobs/history`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setHistoryJobs(data.jobs);
      }
    } catch (e) {
      console.error("Failed to fetch history jobs", e);
    }
  };

  useEffect(() => {
    fetchHistoryJobs();
  }, [target, refreshTrigger]);

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
                fetchHistoryJobs();
                onJobChange();
            }
        } catch(e) {}
        setConfirmModalConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleRetryJob = async (jobId: string) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/jobs/retry/${jobId}`, { method: 'POST' });
      if(res.ok) {
        setNotification({ kind: 'success', title: 'Retry Started', subtitle: 'Job has been restarted.' });
        fetchHistoryJobs();
        onJobChange();
      }
    } catch(e) {}
  };

  const headers = [
    { key: "task_id", header: "ID" },
    ...(!target ? [{ key: "target", header: "Type" }] : []),
    { key: "display_name", header: "Name" },
    { key: "created_date", header: "Created Date" },
    { key: "finished_date", header: "Finished Date" },
    { key: "status", header: "Status" },
    { key: "remarks", header: "Remarks" },
    { key: "actions", header: "Actions" },
  ];

  const formatCell = (cellId: string, value: any, row: any) => {
    if (cellId.endsWith(':actions')) {
      const rowId = cellId.split(':')[0];
      const job = historyJobs.find(j => j.task_id === rowId);
      if(!job) return "-";
      return (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button kind="ghost" size="sm" renderIcon={Document} iconDescription="Details" hasIconOnly onClick={() => openJobDetails(job.task_id)} />
              {job.status?.toLowerCase() !== 'done' && job.status?.toLowerCase() !== 'success' && job.status?.toLowerCase() !== 'running' && (
                  <Button kind="ghost" size="sm" renderIcon={Play} iconDescription="Retry" hasIconOnly onClick={() => handleRetryJob(job.task_id)} />
              )}
              {job.status?.toLowerCase() !== 'running' && (
                  <Button kind="danger--ghost" size="sm" renderIcon={TrashCan} iconDescription="Delete" hasIconOnly onClick={() => handleDeleteJob(job.task_id)} />
              )}
          </div>
      );
    }
    if (cellId.endsWith(':target')) {
       return value ? String(value).toUpperCase() : "-";
    }
    if (cellId.endsWith(':display_name')) {
       const rowId = cellId.split(':')[0];
       const job = historyJobs.find(j => j.task_id === rowId);
       return job?.payload?.model_name || job?.payload?.name || job?.payload?.regime || "-";
    }
    if (cellId.endsWith(':created_date') || cellId.endsWith(':finished_date')) {
       if (!value) return "-";
       const dateStr = value.endsWith('Z') || value.includes('+') ? value : value + 'Z';
       const d = new Date(dateStr);
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
    if (cellId.endsWith(':status')) {
       return <span style={{ textTransform: 'uppercase', fontWeight: 600, color: value?.toLowerCase() === 'failed' || value?.toLowerCase() === 'error' ? '#da1e28' : value?.toLowerCase() === 'done' || value?.toLowerCase() === 'success' ? '#24a148' : '#0f62fe' }}>{value}</span>;
    }
    if (cellId.endsWith(':task_id')) {
       return <span style={{ fontFamily: 'monospace' }}>{value.split('-')[0]}...</span>;
    }
    return value;
  };

  const formattedData = historyJobs.map(j => ({ ...j, id: j.task_id, display_name: "" }));

  return (
    <>
      {notification && (
        <div style={{ position: "fixed", top: "4rem", right: "1rem", zIndex: 9999 }}>
          <ToastNotification
            timeout={5000}
            kind={notification.kind}
            title={notification.title}
            subtitle={notification.subtitle}
            caption={new Date().toLocaleTimeString()}
            onClose={() => { setNotification(null); return false; }}
          />
        </div>
      )}
      <GlobalTable 
        headers={headers} 
        initialData={formattedData} 
        title={target ? `History ${target.charAt(0).toUpperCase() + target.slice(1)} Jobs` : "History Jobs"} 
        formatCell={(cellId, value) => formatCell(cellId, value, formattedData)}
        collapsible={collapsible}
        defaultCollapsed={defaultCollapsed}
        onReload={fetchHistoryJobs}
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
    </>
  );
}
