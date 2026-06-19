"use client";

import { Grid, Column, Tile, Form, FormGroup, TextInput, Select, SelectItem, Button, Modal, Tabs, TabList, Tab, TabPanels, TabPanel, ProgressBar, DatePicker, DatePickerInput, NumberInput, CodeSnippet, ToastNotification, Toggle, InlineLoading, Tag } from "@carbon/react";
import { Add, Edit, TrashCan, Play, Save, View, Stop, Document, ChevronDown, ChevronUp, Close, ArrowUpRight, ArrowDownRight, Activity, Lightning } from "@carbon/icons-react";
import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import GlobalTable from "../../components/GlobalTable";
import GlobalDetailTable from "../../components/GlobalDetailTable";

function ModelsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const currentTab = searchParams.get("tab") || "routes";
  const tabIndexMap: Record<string, number> = { "routes": 0, "train": 1, "registry": 2 };
  const indexToTabMap = ["routes", "train", "registry"];

  const handleTabChange = (e: any) => {
    const newTab = indexToTabMap[e.selectedIndex];
    router.push(`${pathname}?tab=${newTab}`);
  };

  const [models, setModels] = useState<any[]>([]);
  const [initialModelRouting, setInitialModelRouting] = useState<any>(null);
  const [modelRouting, setModelRouting] = useState<any>({
    TREND_BULL: { champion: "NONE", challenger: "NONE" },
    TREND_BEAR: { champion: "NONE", challenger: "NONE" },
    MEAN_REVERTING: { champion: "NONE", challenger: "NONE" },
    VOLATILE_CHOP: { champion: "NONE", challenger: "NONE" }
  });
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [savingRouting, setSavingRouting] = useState(false);

  // Modal states
  const [isModelModalOpen, setModelModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<any>(null);
  const [modelForm, setModelForm] = useState({ id: "", name: "", algorithm_type: "", accuracy: "", status: "Inactive" });

  // Delete confirmation state
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [modelToDelete, setModelToDelete] = useState<string | null>(null);

  // Train states
  const initEnd = new Date().toISOString().split('T')[0];
  const d = new Date(); d.setFullYear(d.getFullYear() - 3);
  const initStart = d.toISOString().split('T')[0];

  const [isTrainModalOpen, setTrainModalOpen] = useState(false);
  const [trainRegime, setTrainRegime] = useState<string>("");
  const [trainForm, setTrainForm] = useState({ algorithm: "XGBoost", model_name: "", start_date: initStart, end_date: initEnd, optuna_trials: 10, skip_ingestion: true });
  const [trainProgress, setTrainProgress] = useState<Record<string, {label: string, value: number}>>({});
  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  const [historyJobs, setHistoryJobs] = useState<any[]>([]);
  const activeSSERef = useRef<Record<string, EventSource>>({});

  const [notification, setNotification] = useState<{kind: "success" | "error" | "info", title: string, subtitle: string} | null>(null);

  // Detail Modal for models
  const [detailModel, setDetailModel] = useState<any>(null);

  // Detail Logs Modal for jobs
  const [detailJobId, setDetailJobId] = useState<string | null>(null);
  const detailJobIdRef = useRef<string | null>(null);
  useEffect(() => { detailJobIdRef.current = detailJobId; }, [detailJobId]);
  const [detailLogs, setDetailLogs] = useState<string>("");
  const [isDetailModalOpen, setDetailModalOpen] = useState(false);
  const [isWidgetCollapsed, setIsWidgetCollapsed] = useState(false);

  const fetchData = async () => {
    setIsLoadingData(true);
    try {
      const [modRes, routeRes] = await Promise.all([
        fetch("http://127.0.0.1:8000/api/models"),
        fetch("http://127.0.0.1:8000/api/configurations/model-routing")
      ]);
      const modData = await modRes.json();
      const routeData = await routeRes.json();
      
      const formattedRouting = {...modelRouting};
      for(const k in routeData) {
        if(typeof routeData[k] === 'string') {
          formattedRouting[k] = { champion: routeData[k], challenger: "NONE" };
        } else {
          formattedRouting[k] = { champion: routeData[k]?.champion || "NONE", challenger: routeData[k]?.challenger || "NONE" };
        }
      }
      
      setModels(modData);
      setModelRouting(formattedRouting);
      setInitialModelRouting(formattedRouting);
    } catch (err) {
      console.error("Failed to load models data", err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (currentTab === "train") {
      fetchActiveJobs();
      fetchHistoryJobs();
    }
  }, [currentTab]);

  const fetchHistoryJobs = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/models/train/history");
      if (res.ok) {
        const data = await res.json();
        setHistoryJobs(data.jobs.map((j: any) => ({ ...j, id: j.task_id })));
      }
    } catch (e) {
      console.error("Failed to fetch history jobs", e);
    }
  };

  const fetchActiveJobs = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/models/train/jobs");
      if (res.ok) {
        const data = await res.json();
        setActiveJobs(data.jobs.map((j: any) => ({ ...j, id: j.task_id })));
        data.jobs.forEach((job: any) => {
          if (job.status === "running") {
            connectToSSE(job.task_id, job.regime);
          }
        });
      }
    } catch (e) {
      console.error("Failed to fetch active jobs", e);
    }
  };

  const openModelModal = (model: any = null) => {
    if (model) {
      setEditingModel(model);
      setModelForm(model);
    } else {
      setEditingModel(null);
      setModelForm({ id: "", name: "", algorithm_type: "", accuracy: "", status: "Inactive" });
    }
    setModelModalOpen(true);
  };

  const saveModel = async () => {
    try {
      const { id, ...rest } = modelForm;
      const payload = id ? { id, ...rest } : rest;
      await fetch("http://127.0.0.1:8000/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      fetchData();
    } catch(e) { console.error(e); }
    setModelModalOpen(false);
  };

  const confirmDeleteModel = (id: string) => {
    setModelToDelete(id);
    setDeleteModalOpen(true);
  };

  const deleteModel = async () => {
    if (modelToDelete) {
      try {
        await fetch(`http://127.0.0.1:8000/api/models/${modelToDelete}`, { method: "DELETE" });
        fetchData();
        setNotification({ kind: "success", title: "Model Deleted", subtitle: "Model was successfully deleted." });
      } catch(e) { console.error(e); }
    }
    setDeleteModalOpen(false);
    setModelToDelete(null);
  };

  const handleRouteChange = (regime: string, type: 'champion'|'challenger', val: string) => {
    setModelRouting({
      ...modelRouting,
      [regime]: {
        ...modelRouting[regime],
        [type]: val
      }
    });
  };

  const saveRouting = async () => {
    setSavingRouting(true);
    try {
      await fetch("http://127.0.0.1:8000/api/configurations/model-routing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(modelRouting)
      });
      alert("Model routing saved successfully!");
      setInitialModelRouting(modelRouting);
    } catch(e) { console.error(e); }
    setSavingRouting(false);
  };
  
  const handleRetryJob = async (job: any) => {
      try {
        const payload = {
          task_id: job.id,
          regime: job.regime,
          algorithm: job.algorithm || "XGBoost",
          model_name: job.model_name || "",
          start_date: job.start_date || "2023-01-01",
          end_date: job.end_date || "2024-01-01",
          optuna_trials: job.optuna_trials || 10
        };
        const res = await fetch("http://127.0.0.1:8000/api/models/train", {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify(payload)
        });
        if(res.ok){
          setNotification({ kind: "success", title: "Retry Started", subtitle: "Training queued successfully." });
          fetchActiveJobs();
        }
      } catch(e) {
          setNotification({ kind: "error", title: "Error", subtitle: "Failed to retry job." });
      }
  };

  const handleCancelJob = async (jobId: string) => {
      try {
          const res = await fetch(`http://127.0.0.1:8000/api/models/train/cancel/${jobId}`, { method: 'POST' });
          if(res.ok) {
              setNotification({ kind: 'info', title: 'Job Cancelled', subtitle: 'Sent cancellation signal to backend.' });
              fetchActiveJobs();
          }
      } catch(e) { }
  };

  const handleDeleteJob = async (jobId: string) => {
      if (confirm("Are you sure you want to completely delete this job? This will stop any running processes and remove all logs from Redis and the database.")) {
          try {
              const res = await fetch(`http://127.0.0.1:8000/api/models/train/jobs/${jobId}`, { method: 'DELETE' });
              if(res.ok) {
                  setNotification({ kind: 'success', title: 'Job Deleted', subtitle: 'Job has been completely removed.' });
                  fetchActiveJobs();
                  fetchHistoryJobs();
              }
          } catch(e) { 
              console.error("Failed to delete job", e);
          }
      }
  };

  const openJobDetails = async (jobId: string) => {
      setDetailJobId(jobId);
      setDetailLogs("Loading logs...");
      setDetailModalOpen(true);
      try {
          const res = await fetch(`http://127.0.0.1:8000/api/models/train/logs/${jobId}`);
          if(res.ok) {
              const data = await res.json();
              setDetailLogs(data.logs || "No logs available.");
          } else {
              setDetailLogs("Failed to load logs.");
          }
      } catch(e) {
          setDetailLogs("Failed to load logs.");
      }
  };

  const openTrainModal = (regime: string) => {
    setTrainRegime(regime);
    
    const d = new Date();
    const endStr = d.toISOString().split('T')[0];
    d.setFullYear(d.getFullYear() - 3);
    const startStr = d.toISOString().split('T')[0];

    setTrainForm({ algorithm: "XGBoost", model_name: "", start_date: startStr, end_date: endStr, optuna_trials: 10, skip_ingestion: true });
    setTrainModalOpen(true);
  };

  const startTraining = async () => {
    setTrainModalOpen(false);
    const targetRegime = trainRegime;
    
    setTrainProgress(prev => ({...prev, [targetRegime]: {label: "Starting...", value: 0}}));
    
    try {
      const res = await fetch("http://127.0.0.1:8000/api/models/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regime: targetRegime, ...trainForm })
      });
      if(res.ok) {
        const data = await res.json();
        const taskId = data.task_id;
        
        connectToSSE(taskId, targetRegime);
        fetchActiveJobs();
      } else {
         setNotification({ kind: "error", title: "Request Failed", subtitle: "Server responded with an error." });
         setTimeout(() => setNotification(null), 5000);
          setTrainProgress(prev => {
             const newP = {...prev};
             delete newP[targetRegime];
             return newP;
          });
      }
    } catch(e) { 
      console.error(e); 
      setNotification({ kind: "error", title: "Request Failed", subtitle: "Could not connect to training engine." });
      setTimeout(() => setNotification(null), 5000);
      setTrainProgress(prev => {
         const newP = {...prev};
         delete newP[targetRegime];
         return newP;
      });
    }
  };

  const connectToSSE = (taskId: string, targetRegime: string) => {
    if (activeSSERef.current[targetRegime]) return;

    setTrainProgress(prev => ({...prev, [targetRegime]: prev[targetRegime] || {label: "Reconnecting...", value: 0}}));

    const eventSource = new EventSource(`http://127.0.0.1:8000/api/models/train/stream/${taskId}`);
    activeSSERef.current[targetRegime] = eventSource;
    
    let hasError = false;

    eventSource.onmessage = (event) => {
      const msg = event.data;
      if (detailJobIdRef.current === taskId) {
        setDetailLogs(prev => prev + (prev ? "\n" : "") + msg);
      }
      
      if (msg.includes("ERROR:")) {
         hasError = true;
      }

      if(msg.includes("[DONE]")) {
        eventSource.close();
        delete activeSSERef.current[targetRegime];
        setTrainProgress(prev => {
          const newP = {...prev};
          delete newP[targetRegime];
          return newP;
        });
        fetchData(); // Refresh registry
        fetchActiveJobs(); // Refresh jobs table
        fetchHistoryJobs(); // Refresh history
        setNotification({
           kind: hasError ? "error" : "success",
           title: hasError ? "Training Failed" : "Training Complete",
           subtitle: hasError ? "Check terminal logs for Python traceback." : `Model for ${targetRegime} trained successfully.`
        });
        setTimeout(() => setNotification(null), 8000);
      } else {
        let val = 0;
        const match = msg.match(/PROGRESS:\s*(\d+)%/);
        if(match) val = parseInt(match[1]);
        const cleanedMsg = msg.replace(/PROGRESS:\s*\d+%\s*-\s*/, '');
        const displayMsg = cleanedMsg.length > 45 ? cleanedMsg.substring(0, 45) + '...' : cleanedMsg;
        setTrainProgress(prev => ({...prev, [targetRegime]: {label: displayMsg, value: val || prev[targetRegime]?.value || 0}}));
      }
    };
    eventSource.onerror = (e) => {
        console.error("SSE Error", e);
        eventSource.close();
        delete activeSSERef.current[targetRegime];
        setNotification({ kind: "error", title: "Connection Error", subtitle: "Failed to read progress stream." });
        setTimeout(() => setNotification(null), 5000);
        setTrainProgress(prev => {
           const newP = {...prev};
           delete newP[targetRegime];
           return newP;
        });
    };
  };

  const modelHeaders = [
    { key: "name", header: "Model Name" },
    { key: "algorithm_type", header: "Algorithm Type" },
    { key: "accuracy", header: "Accuracy" },
    { key: "status", header: "Status" },
    { key: "actions", header: "Actions" },
  ];

  const ongoingJobHeaders = [
    { key: "task_id", header: "ID" },
    { key: "regime", header: "Regime" },
    { key: "model_name", header: "Nama Model" },
    { key: "created_date", header: "Created Date" },
    { key: "finished_date", header: "Finished Date" },
    { key: "progress", header: "Progress" },
    { key: "status", header: "Status" },
    { key: "actions", header: "Actions" },
  ];

  const historyJobHeaders = [
    { key: "task_id", header: "ID" },
    { key: "regime", header: "Regime" },
    { key: "model_name", header: "Nama Model" },
    { key: "created_date", header: "Created Date" },
    { key: "finished_date", header: "Finished Date" },
    { key: "status", header: "Status" },
    { key: "actions", header: "Actions" },
  ];

  const formatJobCell = (cellId: string, value: any) => {
    if (cellId.endsWith(':actions')) {
      const rowId = cellId.split(':')[0];
      const job = activeJobs.find(j => j.id === rowId) || historyJobs.find(j => j.id === rowId);
      if(!job) return "-";
      return (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button kind="ghost" size="sm" renderIcon={Document} iconDescription="Details" hasIconOnly onClick={() => openJobDetails(job.id)} />
              {job.status === 'running' ? (
                  <Button kind="danger--ghost" size="sm" renderIcon={Stop} iconDescription="Cancel" hasIconOnly onClick={() => handleCancelJob(job.id)} />
              ) : job.status?.toLowerCase() !== 'done' && job.status?.toLowerCase() !== 'success' ? (
                  <Button kind="ghost" size="sm" renderIcon={Play} iconDescription="Retry" hasIconOnly onClick={() => handleRetryJob(job)} />
              ) : null}
              {job.status?.toLowerCase() !== 'done' && job.status?.toLowerCase() !== 'success' && job.status?.toLowerCase() !== 'running' && (
                  <Button kind="danger--ghost" size="sm" renderIcon={TrashCan} iconDescription="Delete" hasIconOnly onClick={() => handleDeleteJob(job.id)} />
              )}
          </div>
      );
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
    if (cellId.endsWith(':model_name')) {
       return value || "-";
    }
    if (cellId.endsWith(':progress')) {
      const rowId = cellId.split(':')[0];
      const job = activeJobs.find(j => j.id === rowId);
      if (job && job.status === 'running' && trainProgress[job.regime]) {
         return (
             <div style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                 <div style={{ width: '100%', minWidth: '100px' }}>
                     <ProgressBar label={trainProgress[job.regime].label} value={trainProgress[job.regime].value} />
                 </div>
             </div>
         );
      }
      return "-";
    }
    if (cellId.endsWith(':status')) {
       return <span style={{ textTransform: 'uppercase', fontWeight: 600, color: value?.toLowerCase() === 'failed' || value?.toLowerCase() === 'error' ? '#da1e28' : value?.toLowerCase() === 'done' || value?.toLowerCase() === 'success' ? '#24a148' : '#0f62fe' }}>{value}</span>;
    }
    if (cellId.endsWith(':task_id')) {
       return <span style={{ fontFamily: 'monospace' }}>{value.split('-')[0]}...</span>;
    }
    return value;
  };

  const formatModelCell = (cellId: string, value: any) => {
    if (cellId.endsWith(':actions')) {
      const rowId = cellId.split(':')[0];
      const model = models.find(m => m.id === rowId);
      return (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button size="sm" kind="ghost" renderIcon={View} iconDescription="Details" hasIconOnly onClick={() => setDetailModel(model)} />
          <Button size="sm" kind="ghost" renderIcon={Edit} iconDescription="Edit" hasIconOnly onClick={() => openModelModal(model)} />
          <Button size="sm" kind="danger--ghost" renderIcon={TrashCan} iconDescription="Delete" hasIconOnly onClick={() => confirmDeleteModel(rowId)} />
        </div>
      );
    }
    return value;
  };

  return (
    <>
      {notification && (
        <div style={{ position: "fixed", top: "4rem", right: "1rem", zIndex: 9999 }}>
          <ToastNotification
            kind={notification.kind as any}
            title={notification.title}
            subtitle={notification.subtitle}
            caption={new Date().toLocaleTimeString()}
            onClose={() => setNotification(null)}
          />
        </div>
      )}

      <Grid>
      <Column lg={16} md={8} sm={4} className="landing-page__banner">
        <h3 style={{ marginBottom: "1rem", fontWeight: 400 }}>Models & AI Lifecycle</h3>
      </Column>

      <Column lg={16} md={8} sm={4}>
        <Tabs selectedIndex={tabIndexMap[currentTab] || 0} onChange={handleTabChange}>
            <TabList aria-label="Model Configuration Tabs">
              <Tab>Routes</Tab>
              <Tab>Train</Tab>
              <Tab>Registry</Tab>
            </TabList>
            <TabPanels>
              {/* TAB 1: ROUTES */}
              <TabPanel style={{ paddingTop: '1rem' }}>
                <Grid>
                  <Column lg={16} md={8} sm={4}>
                    <Form>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2px', marginBottom: '2rem' }}>
                        {['TREND_BULL', 'TREND_BEAR', 'MEAN_REVERTING', 'VOLATILE_CHOP'].map(regime => (
                          <Tile key={regime} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                 {regime === 'TREND_BULL' && <ArrowUpRight size={20} style={{ color: '#24a148' }} />}
                                 {regime === 'TREND_BEAR' && <ArrowDownRight size={20} style={{ color: '#da1e28' }} />}
                                 {regime === 'MEAN_REVERTING' && <Activity size={20} style={{ color: '#4589ff' }} />}
                                 {regime === 'VOLATILE_CHOP' && <Lightning size={20} style={{ color: '#f1c21b' }} />}
                                 <h4 style={{fontWeight: 400, margin: 0}}>{regime.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}</h4>
                              </div>
                              <Select id={`route_${regime}_champ`} labelText="👑 Champion" value={modelRouting[regime]?.champion || "NONE"} onChange={e => handleRouteChange(regime, 'champion', e.target.value)}>
                                <SelectItem value="NONE" text="-- None (Disable) --" />
                                {models.map(m => <SelectItem key={`${m.id}-champ`} value={m.name} text={m.name} />)}
                              </Select>
                              <Select id={`route_${regime}_chall`} labelText="🔬 Challenger" value={modelRouting[regime]?.challenger || "NONE"} onChange={e => handleRouteChange(regime, 'challenger', e.target.value)}>
                                <SelectItem value="NONE" text="-- None --" />
                                {models.map(m => <SelectItem key={`${m.id}-chall`} value={m.name} text={m.name} />)}
                              </Select>
                          </Tile>
                        ))}
                      </div>
                      <Button type="button" size="sm" renderIcon={Save} onClick={saveRouting} disabled={savingRouting || JSON.stringify(modelRouting) === JSON.stringify(initialModelRouting)}>{savingRouting ? "Saving..." : "Save"}</Button>
                    </Form>
                  </Column>
                </Grid>
              </TabPanel>

              {/* TAB 2: TRAIN */}
              <TabPanel style={{ paddingTop: '1rem' }}>
                 <Grid condensed>
                  <Column lg={16} md={8} sm={4}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2px' }}>
                        {['TREND_BULL', 'TREND_BEAR', 'MEAN_REVERTING', 'VOLATILE_CHOP'].map(regime => (
                          <Tile key={regime}>
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                               <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                 {regime === 'TREND_BULL' && <ArrowUpRight size={24} style={{ color: '#24a148' }} />}
                                 {regime === 'TREND_BEAR' && <ArrowDownRight size={24} style={{ color: '#da1e28' }} />}
                                 {regime === 'MEAN_REVERTING' && <Activity size={24} style={{ color: '#4589ff' }} />}
                                 {regime === 'VOLATILE_CHOP' && <Lightning size={24} style={{ color: '#f1c21b' }} />}
                                 <h4 style={{fontWeight: 400, margin: 0}}>{regime.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}</h4>
                               </div>
                               {trainProgress[regime] ? (
                                   <div style={{ width: '100px' }}>
                                      <ProgressBar label={trainProgress[regime].label} value={trainProgress[regime].value} />
                                   </div>
                               ) : (
                                   <Button 
                                      kind="primary" size="sm" renderIcon={Play} 
                                      onClick={() => openTrainModal(regime)}
                                   >
                                      Train
                                   </Button>
                               )}
                             </div>
                          </Tile>
                        ))}
                    </div>
                  </Column>
                </Grid>
                <Grid condensed style={{ marginTop: '.2rem' }}>
                  <Column lg={16} md={8} sm={4}>
                    <GlobalTable 
                      headers={historyJobHeaders} 
                      initialData={historyJobs} 
                      title="History Model Jobs" 
                      formatCell={formatJobCell}
                    />
                  </Column>
                </Grid>
              </TabPanel>

              {/* TAB 3: REGISTRY */}
              <TabPanel style={{ paddingTop: '1rem' }}>
                <GlobalTable 
                  headers={modelHeaders} 
                  initialData={models} 
                  title="Models Registry" 
                  formatCell={formatModelCell}
                  toolbarActions={
                    <Button renderIcon={Add} onClick={() => openModelModal()} size="sm">
                      Register External Model
                    </Button>
                  }
                />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Column>
      </Grid>

      <Modal open={isModelModalOpen} onRequestClose={() => setModelModalOpen(false)} onRequestSubmit={saveModel} modalHeading={editingModel ? "Edit Model" : "Register External Model"} primaryButtonText="Save" secondaryButtonText="Cancel">
        <FormGroup legendText="">
          <TextInput id="model-name" labelText="Model Name" value={modelForm.name} onChange={e => setModelForm({...modelForm, name: e.target.value})} style={{ marginBottom: "1rem" }} />
          <TextInput id="model-algo" labelText="Algorithm Type" value={modelForm.algorithm_type} onChange={e => setModelForm({...modelForm, algorithm_type: e.target.value})} style={{ marginBottom: "1rem" }} />
          <TextInput id="model-acc" labelText="Accuracy (Optional)" value={modelForm.accuracy} onChange={e => setModelForm({...modelForm, accuracy: e.target.value})} style={{ marginBottom: "1rem" }} />
          <Select id="model-status" labelText="Status" value={modelForm.status} onChange={e => setModelForm({...modelForm, status: e.target.value})}>
            <SelectItem value="Active" text="Active" />
            <SelectItem value="Inactive" text="Inactive" />
            <SelectItem value="Archived" text="Archived" />
          </Select>
        </FormGroup>
      </Modal>

      <Modal 
        open={isDeleteModalOpen} 
        onRequestClose={() => { setDeleteModalOpen(false); setModelToDelete(null); }} 
        onRequestSubmit={deleteModel} 
        modalHeading="Delete Model" 
        primaryButtonText="Delete" 
        secondaryButtonText="Cancel"
        danger
      >
        <p>Are you sure you want to delete this model? This action cannot be undone.</p>
      </Modal>

      {/* TRAIN SETTINGS MODAL */}
      <Modal open={isTrainModalOpen} onRequestClose={() => setTrainModalOpen(false)} onRequestSubmit={startTraining} modalHeading={`Train settings for ${trainRegime.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}`} primaryButtonText="Start Training" secondaryButtonText="Cancel">
        <FormGroup legendText="">
          <Select id="train-algo" labelText="Algorithm" value={trainForm.algorithm} onChange={e => setTrainForm({...trainForm, algorithm: e.target.value})} style={{ marginBottom: "1rem" }}>
             <SelectItem value="XGBoost" text="XGBoost Ensemble" />
          </Select>
          <TextInput id="model-name-train" labelText="Custom Model Name (Optional)" placeholder="e.g. xgboost_bull_v2" value={trainForm.model_name} onChange={e => setTrainForm({...trainForm, model_name: e.target.value})} style={{ marginBottom: "1rem" }} />
          <Toggle id="skip-ingestion-toggle" labelText="Skip Data Ingestion (Use Existing CSV)" toggled={trainForm.skip_ingestion} onToggle={val => setTrainForm({...trainForm, skip_ingestion: val})} style={{ marginBottom: "1rem" }} />
          {!trainForm.skip_ingestion && (
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <TextInput id="start-date" type="date" labelText="Start Date" value={trainForm.start_date} onChange={e => setTrainForm({...trainForm, start_date: e.target.value})} />
                <TextInput id="end-date" type="date" labelText="End Date" value={trainForm.end_date} onChange={e => setTrainForm({...trainForm, end_date: e.target.value})} />
            </div>
          )}
          <NumberInput id="optuna-trials" label="Optuna Tuning Trials" value={trainForm.optuna_trials} onChange={(e, {value}) => setTrainForm({...trainForm, optuna_trials: Number(value)})} min={1} max={500} />
        </FormGroup>
      </Modal>

      {/* MODEL DETAILS MODAL */}
        {detailModel && (
          <GlobalDetailTable 
             type="model"
             dataObj={detailModel} 
             onClose={() => setDetailModel(null)} 
          />
        )}

      {/* FLOATING JOBS WIDGET */}
      {(() => {
         if (currentTab !== "train" && currentTab !== "registry") return null;
         const widgetJobs = activeJobs.filter(job => job.status?.toLowerCase() !== 'done' && job.status?.toLowerCase() !== 'success');
         
         return (
         <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', width: '380px', backgroundColor: 'var(--cds-layer-01, #262626)', boxShadow: 'none', zIndex: 9999, border: '1px solid var(--cds-border-subtle, #393939)', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ backgroundColor: 'var(--cds-layer-02, #393939)', color: 'var(--cds-text-primary, #f4f4f4)', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setIsWidgetCollapsed(!isWidgetCollapsed)}>
               <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Active Training</span>
               <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {isWidgetCollapsed ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
               </div>
            </div>
            
            {/* Body */}
            {!isWidgetCollapsed && (
            <div style={{ padding: '0', maxHeight: '400px', overflowY: 'auto', overflowX: 'hidden' }}>
               {widgetJobs.length > 0 ? widgetJobs.map(job => (
                  <div key={job.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderBottom: '1px solid var(--cds-border-subtle, #393939)' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, overflow: 'hidden' }}>
                        <div style={{ color: 'var(--cds-icon-secondary, #c6c6c6)', display: 'flex', alignItems: 'center' }}>
                           <Document size={24} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                           <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                              <span style={{ fontSize: '0.875rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--cds-text-primary, #f4f4f4)' }}>{job.model_name || job.regime}</span>
                              <span style={{ fontSize: '0.65rem', color: 'var(--cds-text-secondary, #c6c6c6)', textTransform: 'uppercase' }}>{job.algorithm || "XGBoost"}</span>
                           </div>
                           {job.status === 'running' ? (
                               <div style={{ marginTop: '0.5rem', width: '100%', minWidth: 0 }}>
                                   <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '230px' }}>
                                      <ProgressBar 
                                          label={trainProgress[job.regime] ? trainProgress[job.regime].label : "Starting..."} 
                                          value={trainProgress[job.regime] ? trainProgress[job.regime].value : undefined} 
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
                              <Button kind="ghost" size="sm" renderIcon={View} hasIconOnly iconDescription="Logs" onClick={() => openJobDetails(job.id)} />
                              <Button kind="ghost" size="sm" renderIcon={Stop} hasIconOnly iconDescription="Cancel" onClick={() => handleCancelJob(job.id)} />
                            </>
                        ) : (
                            <>
                               <Button kind="ghost" size="sm" renderIcon={View} hasIconOnly iconDescription="Logs" onClick={() => openJobDetails(job.id)} />
                               <Button kind="ghost" size="sm" renderIcon={TrashCan} hasIconOnly iconDescription="Dismiss" onClick={() => handleDeleteJob(job.id)} />
                            </>
                        )}
                     </div>
                  </div>
               )) : (
                  <div style={{ padding: '1rem', color: 'var(--cds-text-secondary, #c6c6c6)', fontSize: '0.875rem', textAlign: 'center' }}>
                     No active training
                  </div>
               )}
            </div>
            )}
         </div>
         );
      })()}

      {/* Logs Modal */}
      <Modal 
          open={isDetailModalOpen} 
          onRequestClose={() => setDetailModalOpen(false)} 
          passiveModal 
          modalHeading="Training Logs" 
      >
         <div style={{ height: "75vh", overflowY: "auto", overflowX: "hidden", display: "flex", flexDirection: "column" }}>
             <div style={{ flexGrow: 1, minHeight: "100%" }}>
                 <CodeSnippet type="multi" feedback="Copied to clipboard" maxCollapsedNumberOfRows={0} maxExpandedNumberOfRows={0}>
                     {detailLogs}
                 </CodeSnippet>
             </div>
         </div>
      </Modal>
    </>
  );
}

export default function ModelsPage() {
  return (
    <Suspense fallback={<div>Loading models...</div>}>
      <ModelsContent />
    </Suspense>
  );
}
