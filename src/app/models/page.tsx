"use client";

import { Grid, Column, Tile, Form, FormGroup, TextInput, Select, SelectItem, Button, Modal, Tabs, TabList, Tab, TabPanels, TabPanel, ProgressBar, NumberInput, CodeSnippet, ToastNotification, Toggle, Loading, RadioButtonGroup, RadioButton } from "@carbon/react";
import { Add, Edit, TrashCan, Play, Save, View, ArrowUpRight, ArrowDownRight, Activity, Lightning, Information, Close, Fork, DataSet, MachineLearningModel } from "@carbon/icons-react";
import { useState, useEffect, Suspense, useRef, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import GlobalTable from "../../components/GlobalTable";
import GlobalDetailTable from "../../components/GlobalDetailTable";
import GlobalJobsWidget from "../../components/GlobalJobsWidget";
import GlobalJobsTable from "../../components/GlobalJobsTable";
import SubPageSidebar from "@/components/SubPageSidebar";
import { API_BASE_URL } from '@/config/env';

const getRegimeFormat = (regime: string) => {
  if (!regime) return { text: 'UNKNOWN', color: '#f4f4f4' };
  if (regime === 'MOE_ENSEMBLE' || regime === 'MoE' || regime === 'Ensemble' || regime === 'MOE') return { text: 'MoE Gating Network & Meta', color: '#0f62fe' };
  if (regime === 'HMM' || regime === 'HMM_REGIME') return { text: 'HMM Regime Detector', color: '#8a3ffc' };
  if (regime === 'TREND_EXPERT' || regime === 'trend') return { text: 'MoE Trend Expert', color: '#24a148' };
  if (regime === 'MEANREV_EXPERT' || regime === 'meanrev') return { text: 'MoE MeanRev Expert', color: '#4589ff' };
  if (regime === 'MACRO_EXPERT' || regime === 'macro') return { text: 'MoE Macro Expert', color: '#f1c21b' };
  return { text: regime, color: '#f4f4f4' };
};

function ModelsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const currentTab = searchParams.get("tab") || "train";

  const handleTabChange = (tabId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tabId);
    router.push(`${pathname}?${params.toString()}`);
  };

  const navItems = [
    { id: 'train', label: 'Train', icon: Play },
    { id: 'registry', label: 'Registry', icon: MachineLearningModel },
    { id: 'routing', label: 'Model Routing', icon: Fork },
    { id: 'datasets', label: 'Datasets', icon: DataSet }
  ];

  const [models, setModels] = useState<any[]>([]);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [initialModelRouting, setInitialModelRouting] = useState<any>(null);
  const [modelRouting, setModelRouting] = useState<any>({
    MOE_ENSEMBLE: { champion: "NONE", challenger: "NONE" },
    TREND_EXPERT: { champion: "NONE", challenger: "NONE" },
    MEANREV_EXPERT: { champion: "NONE", challenger: "NONE" },
    MACRO_EXPERT: { champion: "NONE", challenger: "NONE" },
    HMM: { champion: "NONE", challenger: "NONE" }
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
  const [datasetForm, setDatasetForm] = useState({ id: "", name: "", description: "", timeframe: "H1", count: 10000, start_date: "", end_date: "", file_name: "", source_type: "technical" });
  const [datasetMode, setDatasetMode] = useState("date"); // count or date

  // Train states
  const initEnd = new Date().toISOString().split('T')[0];
  const d = new Date(); d.setFullYear(d.getFullYear() - 3);
  const initStart = d.toISOString().split('T')[0];

  const [isTrainModalOpen, setTrainModalOpen] = useState(false);
  const [trainRegime, setTrainRegime] = useState<string>("");
  const [trainForm, setTrainForm] = useState({ algorithm: "XGBoost", model_name: "", optuna_trials: 50, skip_ingestion: true, dataset_id: "", macro_dataset_id: "", use_meta_labeling: false, device: "cpu" });
  const [showDatasetInfo, setShowDatasetInfo] = useState(false);
  
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
  const [confirmLoading, setConfirmLoading] = useState(false);

  const handleConfirmSubmit = async () => {
    setConfirmLoading(true);
    try {
      await confirmModalConfig.onConfirm();
    } catch (e) {
      console.error("Confirmation action failed:", e);
    } finally {
      setConfirmLoading(false);
    }
  };

  // Detail Modal
  const [detailModel, setDetailModel] = useState<any>(null);
  const [detailDataset, setDetailDataset] = useState<any>(null);

  const fetchData = async () => {
    setIsLoadingData(true);
    try {
      const [modRes, routeRes, dsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/models`),
        fetch(`${API_BASE_URL}/configurations/model-routing`),
        fetch(`${API_BASE_URL}/datasets`)
      ]);
      const modData = await modRes.json();
      const routeData = await routeRes.json();
      const dsData = await dsRes.json();
      
      const formattedRouting: Record<string, { champion: string; challenger: string }> = {
        MOE_ENSEMBLE: { champion: "NONE", challenger: "NONE" },
        TREND_EXPERT: { champion: "NONE", challenger: "NONE" },
        MEANREV_EXPERT: { champion: "NONE", challenger: "NONE" },
        MACRO_EXPERT: { champion: "NONE", challenger: "NONE" },
        HMM: { champion: "NONE", challenger: "NONE" }
      };
      for(const k in routeData) {
        if (k in formattedRouting) {
          if(typeof routeData[k] === 'string') {
            formattedRouting[k] = { champion: routeData[k], challenger: "NONE" };
          } else {
            formattedRouting[k] = { champion: routeData[k]?.champion || "NONE", challenger: routeData[k]?.challenger || "NONE" };
          }
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

    const handleJobComplete = () => {
      fetchData();
    };
    window.addEventListener('job-complete', handleJobComplete);
    return () => {
      window.removeEventListener('job-complete', handleJobComplete);
    };
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
      await fetch(`${API_BASE_URL}/models`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      fetchData();
    } catch(e) { console.error(e); }
    setModelModalOpen(false);
  };

  const deleteModel = (id: string) => {
    setConfirmModalConfig({
      isOpen: true,
      title: "Delete Model",
      body: "Are you sure you want to delete this model?",
      onConfirm: async () => {
        try {
          await fetch(`${API_BASE_URL}/models/${id}`, { method: "DELETE" });
          fetchData();
          setNotification({ kind: "success", title: "Model Deleted", subtitle: "Model was successfully deleted." });
        } catch(e) { console.error(e); }
        setConfirmModalConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const toggleModelStatus = async (model: any, checked: any) => {
    console.log("toggleModelStatus clicked:", { modelId: model.id, currentStatus: model.status, checked, checkedType: typeof checked });
    
    let isChecked = false;
    if (typeof checked === 'boolean') {
      isChecked = checked;
    } else if (checked && typeof checked === 'object' && 'target' in checked) {
      isChecked = !!checked.target.checked;
    } else {
      isChecked = model.status !== "Active";
    }

    const newStatus = isChecked ? "Active" : "Inactive";
    const updatedModel = { ...model, status: newStatus };
    console.log("Sending status update:", { modelId: model.id, newStatus, payload: updatedModel });

    try {
      const res = await fetch(`${API_BASE_URL}/models`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedModel)
      });
      if (res.ok) {
        fetchData();
        setNotification({ kind: "success", title: "Status Updated", subtitle: `Model status changed to ${newStatus}.` });
      } else {
        const errText = await res.text();
        console.error("Failed to update status, server responded with:", errText);
        setNotification({ kind: "error", title: "Update Failed", subtitle: "Server rejected model status update." });
      }
    } catch(e) { 
      console.error("Error updating status:", e); 
      setNotification({ kind: "error", title: "Update Failed", subtitle: "Failed to update model status." });
    }
  };

  const openDatasetModal = () => {
    setDatasetForm({ id: "", name: "", description: "", timeframe: "H1", count: 10000, start_date: initStart, end_date: initEnd, file_name: "", source_type: "technical" });
    setDatasetMode("date");
    setDatasetModalOpen(true);
  };

  const openEditDatasetModal = (dataset: any) => {
    setEditingDataset(dataset);
    setDatasetForm({ id: dataset.id, name: dataset.name, description: dataset.description, timeframe: dataset.timeframe, count: 10000, start_date: initStart, end_date: initEnd, file_name: dataset.file_name || "", source_type: dataset.source_type || "technical" });
    setEditDatasetModalOpen(true);
  };

  const startIngest = async () => {
    setDatasetModalOpen(false);
    try {
      const payload: any = {
        name: datasetForm.name,
        description: datasetForm.description,
        timeframe: datasetForm.timeframe,
        file_name: datasetForm.file_name,
        source_type: datasetForm.source_type
      };
      if (datasetMode === "count") {
        payload.count = datasetForm.count;
      } else {
        payload.start_date = datasetForm.start_date;
        payload.end_date = datasetForm.end_date;
      }
      
      const res = await fetch(`${API_BASE_URL}/datasets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if(res.ok) {
        setNotification({ kind: "info", title: "Ingestion Started", subtitle: "Dataset ingestion job has been queued." });
        setRefreshJobsTrigger(prev => prev + 1);
        window.dispatchEvent(new CustomEvent('job-start'));
      }
    } catch(e) { console.error(e); }
  };

  const updateDataset = async () => {
    try {
      await fetch(`${API_BASE_URL}/datasets/${datasetForm.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: datasetForm.name, description: datasetForm.description })
      });
      fetchData();
      setEditDatasetModalOpen(false);
      setNotification({ kind: "success", title: "Dataset Updated", subtitle: "Dataset metadata was successfully updated." });
    } catch(e) { console.error(e); }
  };

  const deleteDataset = (id: string) => {
    setConfirmModalConfig({
      isOpen: true,
      title: "Delete Dataset",
      body: "Are you sure you want to delete this dataset? Physical file will also be deleted.",
      onConfirm: async () => {
        try {
          await fetch(`${API_BASE_URL}/datasets/${id}`, { method: "DELETE" });
          fetchData();
          setNotification({ kind: "success", title: "Dataset Deleted", subtitle: "Dataset was successfully deleted." });
        } catch(e) { console.error(e); }
        setConfirmModalConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
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
      await fetch(`${API_BASE_URL}/configurations/model-routing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(modelRouting)
      });
      setNotification({ kind: "success", title: "Routing Saved", subtitle: "Model routing saved successfully!" });
      setInitialModelRouting(modelRouting);
    } catch(e) { console.error(e); }
    setSavingRouting(false);
  };

  const openJobDetails = (jobId: string) => {
    window.dispatchEvent(new CustomEvent('open-job-details', { detail: { jobId } }));
  };

  const openTrainModal = (regime: string) => {
    setTrainRegime(regime);
    const techDs = datasets.find(ds => ds.source_type === "technical") || datasets[0];
    const macroDs = datasets.find(ds => ds.source_type === "macro") || datasets.find(ds => ds !== techDs) || datasets[0];
    setTrainForm({ 
      algorithm: regime === "HMM" ? "Gaussian HMM" : "XGBoost MoE Ensemble", 
      model_name: "", 
      optuna_trials: 50, 
      skip_ingestion: true, 
      dataset_id: techDs ? techDs.id : "", 
      macro_dataset_id: macroDs ? macroDs.id : "",
      use_meta_labeling: false,
      device: "cpu"
    });
    setShowDatasetInfo(false);
    setTrainModalOpen(true);
  };

  const startTraining = async () => {
    setTrainModalOpen(false);
    
    try {
      const res = await fetch(`${API_BASE_URL}/models/train`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regime: trainRegime, ...trainForm })
      });
      if(res.ok) {
        setNotification({ kind: "info", title: "Training Started", subtitle: "Training job queued." });
        setRefreshJobsTrigger(prev => prev + 1);
        window.dispatchEvent(new CustomEvent('job-start'));
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
    { key: "regime", header: "Role / Regime" },
    { key: "accuracy", header: "Accuracy" },
    { key: "dataset", header: "Dataset" },
    { key: "uses_meta", header: "Meta Labeling" },
    { key: "status", header: "Status" },
    { key: "actions", header: "Actions" },
  ];

  const datasetHeaders = [
    { key: "name", header: "Dataset Name" },
    { key: "timeframe", header: "Timeframe" },
    { key: "source_type", header: "Source Type" },
    { key: "date_range", header: "Date Range" },
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
    if (cellId.endsWith(':uses_meta')) {
      return (
        <span style={{ color: value ? '#24a148' : '#fa4d56', fontWeight: 'bold' }}>
          {value ? "Yes" : "No"}
        </span>
      );
    }
    if (cellId.endsWith(':dataset')) {
      const rowId = cellId.split(':')[0];
      const model = models.find(m => m.id === rowId);
      if (!model || !model.dataset_id) return "-";
      const dataset = datasets.find(d => d.id === model.dataset_id);
      return dataset ? dataset.name : "-";
    }
    if (cellId.endsWith(':status')) {
      const rowId = cellId.split(':')[0];
      const model = models.find(m => m.id === rowId);
      if (!model) return value;
      return (
        <Toggle
          id={`status-toggle-${model.id}`}
          size="sm"
          labelText=""
          labelA=""
          labelB=""
          toggled={model.status === "Active"}
          onToggle={(checked) => toggleModelStatus(model, checked)}
          hideLabel
          style={{ margin: 0 }}
        />
      );
    }
  if (cellId.endsWith(':regime')) {
      const format = getRegimeFormat(value);
      const parts = format.text.split(' ');
      return (
        <span style={{ color: format.color, fontWeight: 'bold', fontSize: '0.85em', display: 'inline-block', lineHeight: '1.1' }}>
          {parts.map((p, i) => <span key={i}>{p}{i < parts.length - 1 && <br/>}</span>)}
        </span>
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
    if (cellId.endsWith(':source_type')) {
      if (value === "macro") return <span style={{ color: '#8a3ffc', fontWeight: 'bold' }}>🏛️ Macro (FRED)</span>;
      return <span style={{ color: '#24a148', fontWeight: 'bold' }}>📈 Technical (MT5)</span>;
    }
    if (cellId.endsWith(':date_range')) {
      const rowId = cellId.split(':')[0];
      const dataset = datasets.find(d => d.id === rowId);
      if (!dataset) return "-";
      
      const formatDate = (val: any) => {
        if (!val) return "-";
        const dateStr = val.endsWith('Z') || val.includes('+') ? val : val + 'Z';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return val;
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const day = d.getDate().toString().padStart(2, '0');
        const month = months[d.getMonth()];
        const year = d.getFullYear().toString().slice(-2);
        return `${day} ${month} ${year}`;
      };
      
      return `${formatDate(dataset.start_date)} - ${formatDate(dataset.end_date)}`;
    }
    if (cellId.endsWith(':status')) {
      const statusUpper = value ? String(value).toUpperCase() : '';
      if (statusUpper === "READY" || statusUpper === "COMPLETED" || statusUpper === "SUCCESS" || statusUpper === "DONE") {
        return (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '11px' }}>
            <svg width="12" height="12" viewBox="0 0 32 32" style={{ fill: '#24a148', flexShrink: 0 }}>
              <path d="M14 21.414l-5.707-5.707-1.414 1.414 7.121 7.121 12-12-1.414-1.414z" />
            </svg>
            <span style={{ color: '#ffffff', whiteSpace: 'nowrap' }}>{statusUpper === 'READY' ? 'Ready' : 'Completed'}</span>
          </div>
        );
      }
      if (statusUpper === "INGESTING" || statusUpper === "RUNNING" || statusUpper === "PENDING" || statusUpper === "STARTED" || statusUpper === "PROCESSING") {
        return (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '11px' }}>
            <svg width="12" height="12" viewBox="0 0 32 32" style={{ fill: '#11a3c6', flexShrink: 0 }}>
              <path d="M16 4C9.383 4 4 9.383 4 16s5.383 12 12 12 12-5.383 12-12S22.617 4 16 4zm0 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S6 21.523 6 16 10.477 6 16 6zm-1 3v8h6v-2h-4v-6h-2z" />
            </svg>
            <span style={{ color: '#11a3c6', whiteSpace: 'nowrap' }}>{statusUpper === 'INGESTING' ? 'Ingesting' : 'Running'}</span>
          </div>
        );
      }
      if (statusUpper === "FAILED" || statusUpper === "ERROR") {
        return (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '11px' }}>
            <svg width="12" height="12" viewBox="0 0 32 32" style={{ fill: '#fa4d56', flexShrink: 0 }}>
              <circle cx="16" cy="16" r="8" />
            </svg>
            <span style={{ color: '#fa4d56', whiteSpace: 'nowrap' }}>Failed</span>
          </div>
        );
      }
      // Fallback
      const readableValue = value ? String(value).split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : 'Unknown';
      return (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '11px' }}>
          <svg width="12" height="12" viewBox="0 0 32 32" style={{ fill: '#6f6f6f', flexShrink: 0 }}>
            <circle cx="16" cy="16" r="8" />
          </svg>
          <span style={{ color: '#a8a8a8', whiteSpace: 'nowrap' }}>{readableValue}</span>
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

      <Grid fullWidth>
      <Column lg={16} md={8} sm={4} className="landing-page__banner">
        <h3 style={{ marginBottom: "1rem", fontWeight: 400 }}>Models AI Lifecycle</h3>
      </Column>

      <Column lg={16} md={8} sm={4}>
        <div className="page-with-sidebar">
          {/* Sidebar Navigation */}
          <SubPageSidebar
            navItems={navItems}
            currentTab={currentTab}
            onTabChange={handleTabChange}
          />

          {/* Tab Content Panels */}
          <div className="page-content">
            {/* TAB: TRAIN */}
            {currentTab === 'train' && (
              <>
                <div className="models-train-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '0.2rem', marginBottom: '0.2rem' }}>
                    <Tile style={{ padding: '1.5rem', background: 'var(--cds-layer-01, #262626)', borderLeft: '4px solid #0f62fe' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                           <MachineLearningModel size={28} style={{ color: '#0f62fe' }} />
                           <div>
                             <h4 style={{ fontWeight: 600, margin: 0, color: '#f4f4f4' }}>MoE Ensemble Pipeline</h4>
                             <p style={{ fontSize: '0.75rem', color: '#a8a8a8', margin: 0, marginTop: '0.25rem' }}>3 Experts (Trend, MeanRev, Macro) + Gating & Meta</p>
                           </div>
                         </div>
                       </div>
                       <p style={{ fontSize: '0.8rem', color: '#c6c6c6', marginBottom: '1.25rem', lineHeight: '1.4' }}>
                         Latih ulang secara serentak ketiga model pakar (XGBoost ONNX), kalibrasi jaringan Gating, dan metamodel penentu probabilitas akhir berdasarkan histori dataset terbaru.
                       </p>
                       <Button kind="primary" size="sm" renderIcon={Play} onClick={() => openTrainModal("MOE_ENSEMBLE")}>
                          Train MoE Ensemble
                       </Button>
                    </Tile>

                    <Tile style={{ padding: '1.5rem', background: 'var(--cds-layer-01, #262626)', borderLeft: '4px solid #8a3ffc' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                           <Activity size={28} style={{ color: '#8a3ffc' }} />
                           <div>
                             <h4 style={{ fontWeight: 600, margin: 0, color: '#f4f4f4' }}>HMM Regime Detector</h4>
                             <p style={{ fontSize: '0.75rem', color: '#a8a8a8', margin: 0, marginTop: '0.25rem' }}>4-State Gaussian Hidden Markov Model</p>
                           </div>
                         </div>
                       </div>
                       <p style={{ fontSize: '0.8rem', color: '#c6c6c6', marginBottom: '1.25rem', lineHeight: '1.4' }}>
                         Latih ulang model pendeteksi cuaca pasar probabilistik (Low Vol Trend, High Vol Trend, Mean Reverting, dan Volatile Chop/Crisis) menggunakan imbal hasil & volatilitas.
                       </p>
                       <Button kind="primary" size="sm" renderIcon={Play} onClick={() => openTrainModal("HMM")}>
                          Train HMM Detector
                       </Button>
                    </Tile>
                </div>
                <div style={{ marginTop: '.2rem' }}>
                  <GlobalJobsTable target="model" refreshTrigger={refreshJobsTrigger} openJobDetails={openJobDetails} onJobChange={fetchData} />
                </div>
              </>
            )}

            {/* TAB 3: REGISTRY */}
            {currentTab === 'registry' && (
              <GlobalTable 
                headers={modelHeaders} 
                initialData={models} 
                title="Models Registry" 
                formatCell={formatModelCell}
                onReload={fetchData}
                toolbarActions={
                  <Button renderIcon={Add} onClick={() => openModelModal()} size="sm">
                    Register External Model
                  </Button>
                }
              />
            )}

            {/* TAB: ROUTING */}
            {currentTab === 'routing' && (
              <div style={{ padding: '0.2rem 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem', background: 'var(--cds-layer-01, #262626)', padding: '1.25rem', borderLeft: '4px solid #0f62fe' }}>
                  <div>
                    <h4 style={{ fontWeight: 600, color: '#f4f4f4', margin: 0 }}>Model Routing Configuration</h4>
                    <p style={{ fontSize: '0.8rem', color: '#a8a8a8', margin: 0, marginTop: '0.25rem' }}>
                      Assign Champion (Active Live Model) and Challenger (Shadow Test Model) for each regime or pipeline.
                    </p>
                  </div>
                  <Button kind="primary" renderIcon={Save} onClick={saveRouting} disabled={savingRouting} size="sm">
                    {savingRouting ? "Saving..." : "Save Routing"}
                  </Button>
                </div>
 
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '0.2rem' }}>
                  {Object.keys(modelRouting).map((key) => {
                    const format = getRegimeFormat(key);
                    const currentConfig = modelRouting[key] || { champion: "NONE", challenger: "NONE" };
                    const champ = currentConfig.champion || "NONE";
                    const chall = currentConfig.challenger || "NONE";
                    
                    // Filter models based on the routing panel key keyword
                    const filteredModels = models.filter((m: any) => {
                      // Always include the currently active routing choices to prevent breaking selects
                      if (m.name === champ || m.name === chall) return true;
                      
                      const k = key.toLowerCase();
                      let keyword = '';
                      if (k.includes('gating') || k.includes('ensemble')) {
                        keyword = 'ensemble';
                      } else if (k.includes('trend')) {
                        keyword = 'trend';
                      } else if (k.includes('meanrev')) {
                        keyword = 'meanrev';
                      } else if (k.includes('macro')) {
                        keyword = 'macro';
                      } else if (k.includes('hmm')) {
                        keyword = 'hmm';
                      }
                      
                      if (!keyword) return true;
                      
                      const name = (m.name || '').toLowerCase();
                      const algo = (m.algorithm_type || '').toLowerCase();
                      const regime = (m.regime || '').toLowerCase();
                      return name.includes(keyword) || algo.includes(keyword) || regime.includes(keyword);
                    });

                    return (
                      <Tile key={key} style={{ padding: '1.25rem', background: 'var(--cds-layer-01, #262626)', borderTop: `3px solid ${format.color}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: format.color, display: 'inline-block' }} />
                          <h5 style={{ fontWeight: 600, color: '#f4f4f4', margin: 0 }}>{format.text}</h5>
                          <span style={{ fontSize: '0.7rem', color: '#6f6f6f', marginLeft: 'auto' }}>{key}</span>
                        </div>

                        <FormGroup legendText="" style={{ marginBottom: '1rem' }}>
                          <Select
                            id={`champion-${key}`}
                            labelText="Champion (Active Live Model)"
                            value={champ}
                            onChange={(e) => handleRouteChange(key, 'champion', e.target.value)}
                            size="md"
                          >
                            <SelectItem value="NONE" text="NONE (Disabled)" />
                            {filteredModels.map((m: any) => (
                              <SelectItem key={m.id || m.name} value={m.name} text={`${m.name} (${m.algorithm_type || m.regime || 'Model'})`} />
                            ))}
                          </Select>
                        </FormGroup>

                        <FormGroup legendText="" style={{ margin: 0 }}>
                          <Select
                            id={`challenger-${key}`}
                            labelText="Challenger (Shadow Test Model)"
                            value={chall}
                            onChange={(e) => handleRouteChange(key, 'challenger', e.target.value)}
                            size="md"
                          >
                            <SelectItem value="NONE" text="NONE (Disabled)" />
                            {filteredModels.map((m: any) => (
                              <SelectItem key={m.id || m.name} value={m.name} text={`${m.name} (${m.algorithm_type || m.regime || 'Model'})`} />
                            ))}
                          </Select>
                        </FormGroup>
                      </Tile>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 4: DATASETS */}
            {currentTab === 'datasets' && (
              <>
                <GlobalTable 
                  headers={datasetHeaders} 
                  initialData={datasets} 
                  title="Datasets" 
                  formatCell={formatDatasetCell}
                  onReload={fetchData}
                  toolbarActions={
                    <Button renderIcon={Add} onClick={() => openDatasetModal()} size="sm">
                      Ingest New Dataset
                    </Button>
                  }
                />
                
                <div style={{ marginTop: '.2rem' }}>
                    <GlobalJobsTable target="dataset" refreshTrigger={refreshJobsTrigger} openJobDetails={openJobDetails} onJobChange={fetchData} />
                </div>
              </>
            )}
          </div>
        </div>
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
          <Select id="ds-source-type" labelText="Dataset Source / Type" value={datasetForm.source_type} onChange={e => setDatasetForm({...datasetForm, source_type: e.target.value})} style={{ marginBottom: "1rem" }}>
            <SelectItem value="technical" text="📈 Technical Only (MT5 OHLCV + Indicators)" />
            <SelectItem value="macro" text="🏛️ Macro Indicators Only (FRED Series)" />
          </Select>
          <Select id="ds-tf" labelText="Timeframe" value={datasetForm.timeframe} onChange={e => setDatasetForm({...datasetForm, timeframe: e.target.value})} style={{ marginBottom: "1rem" }}>
            <SelectItem value="M15" text="15 Minutes" />
            <SelectItem value="H1" text="1 Hour" />
            <SelectItem value="H4" text="4 Hours" />
            <SelectItem value="D1" text="Daily" />
          </Select>
          
          <FormGroup legendText="Ingestion Method" style={{ marginBottom: "1rem" }}>
            <RadioButtonGroup
              legendText=""
              name="dataset-mode-radio"
              defaultSelected="date"
              valueSelected={datasetMode}
              onChange={(value) => setDatasetMode(String(value))}
            >
              <RadioButton value="date" id="radio-date" labelText="By Date Range" />
              <RadioButton value="count" id="radio-count" labelText="By Row Count" />
            </RadioButtonGroup>
          </FormGroup>
          
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
      <Modal open={isTrainModalOpen} onRequestClose={() => setTrainModalOpen(false)} onRequestSubmit={startTraining} modalHeading={`Train settings for ${trainRegime === 'HMM' ? 'HMM Regime Detector' : 'MoE Ensemble Pipeline'}`} primaryButtonText="Start Training" secondaryButtonText="Cancel">
        <FormGroup legendText="">
          <Select id="train-algo" labelText="Algorithm" value={trainForm.algorithm} onChange={e => setTrainForm({...trainForm, algorithm: e.target.value})} style={{ marginBottom: "1rem" }}>
             {trainRegime === "HMM" ? (
               <SelectItem value="Gaussian HMM" text="Gaussian HMM (4-State)" />
             ) : (
               <SelectItem value="XGBoost MoE Ensemble" text="XGBoost MoE Ensemble (3 Experts + Gating + Meta)" />
             )}
          </Select>
          <TextInput id="model-name-train" labelText="Custom Model Name (Optional)" placeholder="e.g. xgboost_bull_v2" value={trainForm.model_name} onChange={e => setTrainForm({...trainForm, model_name: e.target.value})} style={{ marginBottom: "1rem" }} />
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: "1rem" }}>
              <div style={{ flex: 1 }}>
                  <Select id="train-dataset" labelText="Technical Dataset (MT5 OHLCV + Indicators)" value={trainForm.dataset_id} onChange={e => setTrainForm({...trainForm, dataset_id: e.target.value})}>
                     {datasets.filter(d => d.source_type === "technical" || !d.source_type).length === 0 ? <SelectItem value="" text="No technical datasets available" disabled /> : null}
                     {(datasets.filter(d => d.source_type === "technical" || !d.source_type).length > 0 ? datasets.filter(d => d.source_type === "technical" || !d.source_type) : datasets).map(ds => <SelectItem key={ds.id} value={ds.id} text={`${ds.name} (${ds.total_rows} rows)`} />)}
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
          
          {trainRegime !== "HMM" && (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: "1rem" }}>
              <div style={{ flex: 1 }}>
                  <Select id="train-macro-dataset" labelText="Macro Dataset (FRED Series)" value={trainForm.macro_dataset_id} onChange={e => setTrainForm({...trainForm, macro_dataset_id: e.target.value})}>
                     {datasets.filter(d => d.source_type === "macro").length === 0 ? <SelectItem value="" text="No macro datasets available" disabled /> : null}
                     {(datasets.filter(d => d.source_type === "macro").length > 0 ? datasets.filter(d => d.source_type === "macro") : datasets).map(ds => <SelectItem key={ds.id} value={ds.id} text={`${ds.name} (${ds.total_rows} rows)`} />)}
                  </Select>
              </div>
            </div>
          )}
          
          {trainRegime !== "HMM" && (
            <>
              <NumberInput id="optuna-trials" label="Optuna Tuning Trials" value={trainForm.optuna_trials} onChange={(e, {value}) => setTrainForm({...trainForm, optuna_trials: Number(value)})} min={1} max={500} style={{ marginBottom: "1rem" }} />
              
              <RadioButtonGroup
                legendText="Compute Device"
                name="device"
                valueSelected={trainForm.device}
                onChange={(val) => setTrainForm({ ...trainForm, device: val as string })}
                style={{ marginBottom: "1.5rem" }}
              >
                <RadioButton labelText="GPU (CUDA) - Recommended" value="cuda" id="device-gpu" />
                <RadioButton labelText="CPU Based" value="cpu" id="device-cpu" />
              </RadioButtonGroup>

              <Toggle id="use-meta-labeling" labelText="Use Meta Labeling (The Hakim)" toggled={trainForm.use_meta_labeling} onToggle={(val) => setTrainForm({...trainForm, use_meta_labeling: val})} />
            </>
          )}
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

      {/* Confirmation Modal */}
      <Modal
        open={confirmModalConfig.isOpen}
        modalHeading={confirmModalConfig.title}
        primaryButtonText={confirmLoading ? "Processing..." : "Confirm"}
        secondaryButtonText="Cancel"
        primaryButtonDisabled={confirmLoading}
        onRequestClose={() => !confirmLoading && setConfirmModalConfig(prev => ({ ...prev, isOpen: false }))}
        onRequestSubmit={handleConfirmSubmit}
      >
        {confirmLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 0' }}>
            <Loading withOverlay={false} small />
            <span style={{ fontSize: '0.875rem', color: '#a8a8a8' }}>Please wait...</span>
          </div>
        ) : (
          <p style={{ padding: '1rem 0', fontSize: '0.875rem' }}>{confirmModalConfig.body}</p>
        )}
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
