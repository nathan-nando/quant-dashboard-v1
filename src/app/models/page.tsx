"use client";

import { Grid, Column, Tile, Form, FormGroup, TextInput, Select, SelectItem, Button, Modal, Tabs, TabList, Tab, TabPanels, TabPanel, ProgressBar, NumberInput, CodeSnippet, ToastNotification, Toggle } from "@carbon/react";
import { Add, Edit, TrashCan, Play, Save, View, ArrowUpRight, ArrowDownRight, Activity, Lightning, Information, Close } from "@carbon/icons-react";
import { useState, useEffect, Suspense, useRef, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import GlobalTable from "../../components/GlobalTable";
import GlobalDetailTable from "../../components/GlobalDetailTable";
import GlobalJobsWidget from "../../components/GlobalJobsWidget";
import GlobalJobsTable from "../../components/GlobalJobsTable";

function ModelsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const currentTab = searchParams.get("tab") || "routes";
  const tabIndexMap: Record<string, number> = { "routes": 0, "train": 1, "registry": 2, "datasets": 3 };
  const indexToTabMap = ["routes", "train", "registry", "datasets"];

  const handleTabChange = (e: any) => {
    const newTab = indexToTabMap[e.selectedIndex];
    router.push(`${pathname}?tab=${newTab}`);
  };

  const [models, setModels] = useState<any[]>([]);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [initialModelRouting, setInitialModelRouting] = useState<any>(null);
  const [modelRouting, setModelRouting] = useState<any>({
    TREND_BULL: { champion: "NONE", challenger: "NONE" },
    TREND_BEAR: { champion: "NONE", challenger: "NONE" },
    MEAN_REVERTING: { champion: "NONE", challenger: "NONE" },
    VOLATILE_CHOP: { champion: "NONE", challenger: "NONE" }
  });
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [savingRouting, setSavingRouting] = useState(false);
  const [refreshJobsTrigger, setRefreshJobsTrigger] = useState(0);

  // Modal states
  const [isModelModalOpen, setModelModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<any>(null);
  const [modelForm, setModelForm] = useState({ id: "", name: "", algorithm_type: "", accuracy: "", status: "Inactive" });

  const [isDatasetModalOpen, setDatasetModalOpen] = useState(false);
  const [isEditDatasetModalOpen, setEditDatasetModalOpen] = useState(false);
  const [editingDataset, setEditingDataset] = useState<any>(null);
  const [datasetForm, setDatasetForm] = useState({ id: "", name: "", description: "", timeframe: "H1", count: 10000, start_date: "", end_date: "", file_name: "" });
  const [datasetMode, setDatasetMode] = useState("count"); // count or date

  // Train states
  const initEnd = new Date().toISOString().split('T')[0];
  const d = new Date(); d.setFullYear(d.getFullYear() - 3);
  const initStart = d.toISOString().split('T')[0];

  const [isTrainModalOpen, setTrainModalOpen] = useState(false);
  const [trainRegime, setTrainRegime] = useState<string>("");
  const [trainForm, setTrainForm] = useState({ algorithm: "XGBoost", model_name: "", optuna_trials: 10, skip_ingestion: true, dataset_id: "" });
  const [showDatasetInfo, setShowDatasetInfo] = useState(false);
  
  const [notification, setNotification] = useState<{kind: "success" | "error" | "info", title: string, subtitle: string} | null>(null);

  // Detail Modal
  const [detailModel, setDetailModel] = useState<any>(null);
  const [detailDataset, setDetailDataset] = useState<any>(null);

  // Detail Logs Modal for jobs
  const [detailJobId, setDetailJobId] = useState<string | null>(null);
  const detailJobIdRef = useRef<string | null>(null);
  useEffect(() => { detailJobIdRef.current = detailJobId; }, [detailJobId]);
  const [detailLogs, setDetailLogs] = useState<string>("");
  const [isDetailModalOpen, setDetailModalOpen] = useState(false);

  const handleLogLine = useCallback((taskId: string, line: string) => {
      if (taskId === detailJobIdRef.current) {
          setDetailLogs(prev => {
              if (!prev || prev === "Loading logs..." || prev === "No logs available.") return line;
              if (prev.endsWith(line)) return prev;
              return prev + "\n" + line;
          });
      }
  }, []);

  const fetchData = async () => {
    setIsLoadingData(true);
    try {
      const [modRes, routeRes, dsRes] = await Promise.all([
        fetch("http://127.0.0.1:8000/api/models"),
        fetch("http://127.0.0.1:8000/api/configurations/model-routing"),
        fetch("http://127.0.0.1:8000/api/datasets")
      ]);
      const modData = await modRes.json();
      const routeData = await routeRes.json();
      const dsData = await dsRes.json();
      
      const formattedRouting = {...modelRouting};
      for(const k in routeData) {
        if(typeof routeData[k] === 'string') {
          formattedRouting[k] = { champion: routeData[k], challenger: "NONE" };
        } else {
          formattedRouting[k] = { champion: routeData[k]?.champion || "NONE", challenger: routeData[k]?.challenger || "NONE" };
        }
      }
      
      setModels(modData);
      setDatasets(dsData);
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

  const deleteModel = async (id: string) => {
    if (confirm("Are you sure you want to delete this model?")) {
      try {
        await fetch(`http://127.0.0.1:8000/api/models/${id}`, { method: "DELETE" });
        fetchData();
        setNotification({ kind: "success", title: "Model Deleted", subtitle: "Model was successfully deleted." });
      } catch(e) { console.error(e); }
    }
  };

  const openDatasetModal = () => {
    setDatasetForm({ id: "", name: "", description: "", timeframe: "H1", count: 10000, start_date: initStart, end_date: initEnd, file_name: "" });
    setDatasetModalOpen(true);
  };

  const openEditDatasetModal = (dataset: any) => {
    setEditingDataset(dataset);
    setDatasetForm({ id: dataset.id, name: dataset.name, description: dataset.description, timeframe: dataset.timeframe, count: 10000, start_date: initStart, end_date: initEnd, file_name: dataset.file_name || "" });
    setEditDatasetModalOpen(true);
  };

  const startIngest = async () => {
    setDatasetModalOpen(false);
    try {
      const payload: any = {
        name: datasetForm.name,
        description: datasetForm.description,
        timeframe: datasetForm.timeframe,
        file_name: datasetForm.file_name
      };
      if (datasetMode === "count") {
        payload.count = datasetForm.count;
      } else {
        payload.start_date = datasetForm.start_date;
        payload.end_date = datasetForm.end_date;
      }
      
      const res = await fetch("http://127.0.0.1:8000/api/datasets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if(res.ok) {
        setNotification({ kind: "info", title: "Ingestion Started", subtitle: "Dataset ingestion job has been queued." });
        setRefreshJobsTrigger(prev => prev + 1);
      }
    } catch(e) { console.error(e); }
  };

  const updateDataset = async () => {
    try {
      await fetch(`http://127.0.0.1:8000/api/datasets/${datasetForm.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: datasetForm.name, description: datasetForm.description })
      });
      fetchData();
      setEditDatasetModalOpen(false);
      setNotification({ kind: "success", title: "Dataset Updated", subtitle: "Dataset metadata was successfully updated." });
    } catch(e) { console.error(e); }
  };

  const deleteDataset = async (id: string) => {
    if (confirm("Are you sure you want to delete this dataset? Physical file will also be deleted.")) {
      try {
        await fetch(`http://127.0.0.1:8000/api/datasets/${id}`, { method: "DELETE" });
        fetchData();
        setNotification({ kind: "success", title: "Dataset Deleted", subtitle: "Dataset was successfully deleted." });
      } catch(e) { console.error(e); }
    }
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

  const openJobDetails = async (jobId: string) => {
      setDetailLogs("Loading logs...");
      setDetailModalOpen(true);
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/jobs/logs/${jobId}`);
        if(res.ok) {
            const data = await res.json();
            setDetailLogs(data.logs || "No logs available.");
            setDetailJobId(jobId);
        } else {
            setDetailLogs("Failed to load logs.");
        }
      } catch(e) {
          setDetailLogs("Failed to load logs.");
      }
  };

  const openTrainModal = (regime: string) => {
    setTrainRegime(regime);
    setTrainForm({ algorithm: "XGBoost", model_name: "", optuna_trials: 10, skip_ingestion: true, dataset_id: datasets.length > 0 ? datasets[0].id : "" });
    setShowDatasetInfo(false);
    setTrainModalOpen(true);
  };

  const startTraining = async () => {
    setTrainModalOpen(false);
    
    try {
      const res = await fetch("http://127.0.0.1:8000/api/models/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regime: trainRegime, ...trainForm })
      });
      if(res.ok) {
        setNotification({ kind: "info", title: "Training Started", subtitle: "Training job queued." });
        setRefreshJobsTrigger(prev => prev + 1);
      } else {
         setNotification({ kind: "error", title: "Request Failed", subtitle: "Server responded with an error." });
      }
    } catch(e) { 
      setNotification({ kind: "error", title: "Request Failed", subtitle: "Could not connect to engine." });
    }
  };

  const modelHeaders = [
    { key: "name", header: "Model Name" },
    { key: "algorithm_type", header: "Algorithm Type" },
    { key: "accuracy", header: "Accuracy" },
    { key: "status", header: "Status" },
    { key: "actions", header: "Actions" },
  ];

  const datasetHeaders = [
    { key: "name", header: "Dataset Name" },
    { key: "timeframe", header: "Timeframe" },
    { key: "file_name", header: "File Name" },
    { key: "total_rows", header: "Total Rows" },
    { key: "status", header: "Status" },
    { key: "actions", header: "Actions" },
  ];

  const formatModelCell = (cellId: string, value: any) => {
    if (cellId.endsWith(':actions')) {
      const rowId = cellId.split(':')[0];
      const model = models.find(m => m.id === rowId);
      return (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button size="sm" kind="ghost" renderIcon={View} iconDescription="Details" hasIconOnly onClick={() => setDetailModel(model)} />
          <Button size="sm" kind="ghost" renderIcon={Edit} iconDescription="Edit" hasIconOnly onClick={() => openModelModal(model)} />
          <Button size="sm" kind="danger--ghost" renderIcon={TrashCan} iconDescription="Delete" hasIconOnly onClick={() => deleteModel(rowId)} />
        </div>
      );
    }
    return value;
  };

  const formatDatasetCell = (cellId: string, value: any) => {
    if (cellId.endsWith(':actions')) {
      const rowId = cellId.split(':')[0];
      const dataset = datasets.find(d => d.id === rowId);
      return (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button size="sm" kind="ghost" renderIcon={View} iconDescription="Details" hasIconOnly onClick={() => setDetailDataset(dataset)} />
          <Button size="sm" kind="ghost" renderIcon={Edit} iconDescription="Edit" hasIconOnly onClick={() => openEditDatasetModal(dataset)} />
          <Button size="sm" kind="danger--ghost" renderIcon={TrashCan} iconDescription="Delete" hasIconOnly onClick={() => deleteDataset(rowId)} />
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
            timeout={5000}
            kind={notification.kind as any}
            title={notification.title}
            subtitle={notification.subtitle}
            caption={new Date().toLocaleTimeString()}
            onClose={() => { setNotification(null); return false; }}
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
              <Tab>Datasets</Tab>
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
                               <Button kind="primary" size="sm" renderIcon={Play} onClick={() => openTrainModal(regime)}>
                                  Train
                               </Button>
                             </div>
                          </Tile>
                        ))}
                    </div>
                  </Column>
                </Grid>
                <Grid condensed style={{ marginTop: '.2rem' }}>
                  <Column lg={16} md={8} sm={4}>
                    <GlobalJobsTable target="model" refreshTrigger={refreshJobsTrigger} openJobDetails={openJobDetails} onJobChange={fetchData} />
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
              
              {/* TAB 4: DATASETS */}
              <TabPanel style={{ paddingTop: '1rem' }}>
                <GlobalTable 
                  headers={datasetHeaders} 
                  initialData={datasets} 
                  title="Datasets" 
                  formatCell={formatDatasetCell}
                  toolbarActions={
                    <Button renderIcon={Add} onClick={() => openDatasetModal()} size="sm">
                      Ingest New Dataset
                    </Button>
                  }
                />
                
                <div style={{ marginTop: '.2rem' }}>
                    <GlobalJobsTable target="dataset" refreshTrigger={refreshJobsTrigger} openJobDetails={openJobDetails} onJobChange={fetchData} />
                </div>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Column>
      </Grid>

      {/* MODALS */}
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

      <Modal open={isDatasetModalOpen} onRequestClose={() => setDatasetModalOpen(false)} onRequestSubmit={startIngest} modalHeading="Ingest New Dataset" primaryButtonText="Start Ingestion" secondaryButtonText="Cancel">
        <FormGroup legendText="">
          <TextInput id="ds-name" labelText="Dataset Name (Mandatory)" placeholder="e.g. XAUUSD_H1_2023" value={datasetForm.name} onChange={e => setDatasetForm({...datasetForm, name: e.target.value})} style={{ marginBottom: "1rem" }} />
          <TextInput id="ds-desc" labelText="Description (Optional)" value={datasetForm.description} onChange={e => setDatasetForm({...datasetForm, description: e.target.value})} style={{ marginBottom: "1rem" }} />
          <TextInput id="ds-file" labelText="File Name (Optional)" placeholder="Auto-generated if left blank" value={datasetForm.file_name} onChange={e => setDatasetForm({...datasetForm, file_name: e.target.value})} style={{ marginBottom: "1rem" }} />
          <Select id="ds-tf" labelText="Timeframe" value={datasetForm.timeframe} onChange={e => setDatasetForm({...datasetForm, timeframe: e.target.value})} style={{ marginBottom: "1rem" }}>
            <SelectItem value="M15" text="15 Minutes" />
            <SelectItem value="H1" text="1 Hour" />
            <SelectItem value="H4" text="4 Hours" />
            <SelectItem value="D1" text="Daily" />
          </Select>
          
          <Toggle id="ds-mode" labelText="Ingestion Method" labelA="By Date Range" labelB="By Row Count" toggled={datasetMode === "count"} onToggle={(toggled) => setDatasetMode(toggled ? "count" : "date")} style={{ marginBottom: "1rem" }} />
          
          {datasetMode === "count" ? (
             <NumberInput id="ds-count" label="Total Rows to Pull" value={datasetForm.count} onChange={(e, {value}) => setDatasetForm({...datasetForm, count: Number(value)})} min={100} max={1000000} />
          ) : (
             <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <TextInput id="ds-start" type="date" labelText="Start Date" value={datasetForm.start_date} onChange={e => setDatasetForm({...datasetForm, start_date: e.target.value})} />
                <TextInput id="ds-end" type="date" labelText="End Date" value={datasetForm.end_date} onChange={e => setDatasetForm({...datasetForm, end_date: e.target.value})} />
             </div>
          )}
        </FormGroup>
      </Modal>

      <Modal open={isEditDatasetModalOpen} onRequestClose={() => setEditDatasetModalOpen(false)} onRequestSubmit={updateDataset} modalHeading="Edit Dataset" primaryButtonText="Save" secondaryButtonText="Cancel">
        <FormGroup legendText="">
          <TextInput id="edit-ds-name" labelText="Dataset Name" value={datasetForm.name} onChange={e => setDatasetForm({...datasetForm, name: e.target.value})} style={{ marginBottom: "1rem" }} />
          <TextInput id="edit-ds-desc" labelText="Description" value={datasetForm.description} onChange={e => setDatasetForm({...datasetForm, description: e.target.value})} style={{ marginBottom: "1rem" }} />
          <TextInput id="edit-ds-file" labelText="File Name" value={datasetForm.file_name} readOnly style={{ marginBottom: "1rem" }} />
        </FormGroup>
      </Modal>

      {/* TRAIN SETTINGS MODAL */}
      <Modal open={isTrainModalOpen} onRequestClose={() => setTrainModalOpen(false)} onRequestSubmit={startTraining} modalHeading={`Train settings for ${trainRegime.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}`} primaryButtonText="Start Training" secondaryButtonText="Cancel">
        <FormGroup legendText="">
          <Select id="train-algo" labelText="Algorithm" value={trainForm.algorithm} onChange={e => setTrainForm({...trainForm, algorithm: e.target.value})} style={{ marginBottom: "1rem" }}>
             <SelectItem value="XGBoost" text="XGBoost Ensemble" />
          </Select>
          <TextInput id="model-name-train" labelText="Custom Model Name (Optional)" placeholder="e.g. xgboost_bull_v2" value={trainForm.model_name} onChange={e => setTrainForm({...trainForm, model_name: e.target.value})} style={{ marginBottom: "1rem" }} />
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: "1rem" }}>
              <div style={{ flex: 1 }}>
                  <Select id="train-dataset" labelText="Dataset" value={trainForm.dataset_id} onChange={e => setTrainForm({...trainForm, dataset_id: e.target.value})}>
                     {datasets.length === 0 ? <SelectItem value="" text="No datasets available" disabled /> : null}
                     {datasets.map(ds => <SelectItem key={ds.id} value={ds.id} text={`${ds.name} (${ds.total_rows} rows)`} />)}
                  </Select>
              </div>
              {trainForm.dataset_id && (
                  <div style={{ position: 'relative' }}>
                      <Button
                        size="sm"
                        kind="ghost"
                        renderIcon={Information}
                        iconDescription="Dataset Info"
                        tooltipPosition="left"
                        hasIconOnly
                        onClick={() => setShowDatasetInfo(!showDatasetInfo)}
                      />
                      {showDatasetInfo && (
                          <div style={{ position: 'absolute', bottom: '100%', right: 0, marginBottom: '0.5rem', backgroundColor: 'var(--cds-layer-02, #393939)', padding: '1rem', zIndex: 10000, width: '280px', color: 'var(--cds-text-primary, #f4f4f4)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                 <strong style={{ fontSize: '0.875rem' }}>Dataset Info</strong>
                                 <Button kind="ghost" size="sm" hasIconOnly renderIcon={Close} iconDescription="Close" onClick={() => setShowDatasetInfo(false)} style={{ minHeight: 'auto', padding: 0, width: '24px', height: '24px' }} />
                              </div>
                              {(() => {
                                  const ds = datasets.find(d => d.id === trainForm.dataset_id);
                                  if (!ds) return <p>No data</p>;
                                  return (
                                      <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                          <div><span style={{ color: 'var(--cds-text-secondary, #c6c6c6)' }}>Name:</span><br/>{ds.name}</div>
                                          <div><span style={{ color: 'var(--cds-text-secondary, #c6c6c6)' }}>Total Rows:</span><br/>{ds.total_rows}</div>
                                          <div><span style={{ color: 'var(--cds-text-secondary, #c6c6c6)' }}>Timeframe:</span><br/>{ds.timeframe}</div>
                                          <div><span style={{ color: 'var(--cds-text-secondary, #c6c6c6)' }}>Description:</span><br/>{ds.description || '-'}</div>
                                          <div><span style={{ color: 'var(--cds-text-secondary, #c6c6c6)' }}>File:</span><br/>{ds.file_name}</div>
                                      </div>
                                  );
                              })()}
                          </div>
                      )}
                  </div>
              )}
          </div>
          
          <NumberInput id="optuna-trials" label="Optuna Tuning Trials" value={trainForm.optuna_trials} onChange={(e, {value}) => setTrainForm({...trainForm, optuna_trials: Number(value)})} min={1} max={500} />
        </FormGroup>
      </Modal>

      {detailModel && (
          <GlobalDetailTable 
             type="model"
             dataObj={detailModel} 
             onClose={() => setDetailModel(null)} 
          />
      )}

      {detailDataset && (
          <GlobalDetailTable 
             type="dataset"
             dataObj={detailDataset} 
             onClose={() => setDetailDataset(null)} 
          />
      )}

      {/* Logs Modal */}
      <Modal 
          open={isDetailModalOpen} 
          onRequestClose={() => { setDetailModalOpen(false); setDetailJobId(null); }} 
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
      
      <GlobalJobsWidget target={currentTab === "datasets" ? "dataset" : "model"} refreshTrigger={refreshJobsTrigger} onJobComplete={() => { fetchData(); setRefreshJobsTrigger(prev => prev + 1); }} openJobDetails={openJobDetails} onLogLine={handleLogLine} />
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
