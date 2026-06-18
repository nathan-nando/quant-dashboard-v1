"use client";

import { Grid, Column, Tile, Form, FormGroup, TextInput, Select, SelectItem, Button, Modal, Tabs, TabList, Tab, TabPanels, TabPanel, ProgressBar, DatePicker, DatePickerInput, NumberInput, CodeSnippet } from "@carbon/react";
import { Add, Edit, TrashCan, Play, Save, Information } from "@carbon/icons-react";
import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import GlobalTable from "../../components/GlobalTable";

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

  // Train states
  const initEnd = new Date().toISOString().split('T')[0];
  const d = new Date(); d.setFullYear(d.getFullYear() - 3);
  const initStart = d.toISOString().split('T')[0];

  const [isTrainModalOpen, setTrainModalOpen] = useState(false);
  const [trainRegime, setTrainRegime] = useState<string>("");
  const [trainForm, setTrainForm] = useState({ algorithm: "XGBoost", model_name: "", start_date: initStart, end_date: initEnd, optuna_trials: 10 });
  const [trainProgress, setTrainProgress] = useState<Record<string, {label: string, value: number}>>({});

  // Detail Modal
  const [isDetailModalOpen, setDetailModalOpen] = useState(false);
  const [detailModel, setDetailModel] = useState<any>(null);

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
    if(confirm("Are you sure you want to delete this model?")) {
      try {
        await fetch(`http://127.0.0.1:8000/api/models/${id}`, { method: "DELETE" });
        fetchData();
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
  
  const openTrainModal = (regime: string) => {
    setTrainRegime(regime);
    
    const d = new Date();
    const endStr = d.toISOString().split('T')[0];
    d.setFullYear(d.getFullYear() - 3);
    const startStr = d.toISOString().split('T')[0];

    setTrainForm({ algorithm: "XGBoost", model_name: "", start_date: startStr, end_date: endStr, optuna_trials: 10 });
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
        
        // Listen to SSE
        const eventSource = new EventSource(`http://127.0.0.1:8000/api/models/train/stream/${taskId}`);
        eventSource.onmessage = (event) => {
          const msg = event.data;
          if(msg.includes("[DONE]")) {
            eventSource.close();
            setTrainProgress(prev => {
              const newP = {...prev};
              delete newP[targetRegime];
              return newP;
            });
            fetchData(); // Refresh registry
          } else {
            let val = 0;
            const match = msg.match(/PROGRESS:\s*(\d+)%/);
            if(match) val = parseInt(match[1]);
            setTrainProgress(prev => ({...prev, [targetRegime]: {label: msg.replace(/PROGRESS:\s*\d+%\s*-\s*/, ''), value: val || prev[targetRegime]?.value || 0}}));
          }
        };
        eventSource.onerror = (e) => {
            console.error("SSE Error", e);
            eventSource.close();
        };
      }
    } catch(e) { 
      console.error(e); 
      setTrainProgress(prev => {
         const newP = {...prev};
         delete newP[targetRegime];
         return newP;
      });
    }
  };

  const modelHeaders = [
    { key: "name", header: "Model Name" },
    { key: "algorithm_type", header: "Algorithm Type" },
    { key: "accuracy", header: "Accuracy" },
    { key: "status", header: "Status" },
    { key: "actions", header: "Actions" },
  ];

  const formatModelCell = (cellId: string, value: any) => {
    if (cellId.endsWith(':actions')) {
      const rowId = cellId.split(':')[0];
      const model = models.find(m => m.id === rowId);
      return (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button size="sm" kind="ghost" renderIcon={Information} iconDescription="Details" hasIconOnly onClick={() => {setDetailModel(model); setDetailModalOpen(true);}} />
          <Button size="sm" kind="ghost" renderIcon={Edit} iconDescription="Edit" hasIconOnly onClick={() => openModelModal(model)} />
          <Button size="sm" kind="danger--ghost" renderIcon={TrashCan} iconDescription="Delete" hasIconOnly onClick={() => deleteModel(rowId)} />
        </div>
      );
    }
    return value;
  };

  return (
    <>
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
              <TabPanel style={{ paddingTop: '2rem' }}>
                <Grid>
                  <Column lg={16} md={8} sm={4}>
                    <Form>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2px', marginBottom: '2rem' }}>
                        {['TREND_BULL', 'TREND_BEAR', 'MEAN_REVERTING', 'VOLATILE_CHOP'].map(regime => (
                          <Tile key={regime} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                              <h4 style={{fontWeight: 400, marginBottom: '0.5rem'}}>{regime.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}</h4>
                              <Select id={`route_${regime}_champ`} labelText="👑 Champion" value={modelRouting[regime]?.champion || "NONE"} onChange={e => handleRouteChange(regime, 'champion', e.target.value)}>
                                <SelectItem value="NONE" text="-- None (Disable) --" />
                                <SelectItem value={`xgboost_${regime.toLowerCase()}`} text={`xgboost_${regime.toLowerCase()} (Default)`} />
                                {models.map(m => <SelectItem key={`${m.id}-champ`} value={m.name} text={m.name} />)}
                              </Select>
                              <Select id={`route_${regime}_chall`} labelText="🔬 Challenger" value={modelRouting[regime]?.challenger || "NONE"} onChange={e => handleRouteChange(regime, 'challenger', e.target.value)}>
                                <SelectItem value="NONE" text="-- None --" />
                                <SelectItem value={`xgboost_${regime.toLowerCase()}`} text={`xgboost_${regime.toLowerCase()} (Default)`} />
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
              <TabPanel style={{ paddingTop: '2rem' }}>
                 <Grid>
                  <Column lg={12} md={8} sm={4}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2px' }}>
                        {['TREND_BULL', 'TREND_BEAR', 'MEAN_REVERTING', 'VOLATILE_CHOP'].map(regime => (
                          <Tile key={regime}>
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                               <h4 style={{fontWeight: 400}}>{regime.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}</h4>
                               {trainProgress[regime] ? (
                                   <div style={{ width: '200px' }}>
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
              </TabPanel>

              {/* TAB 3: REGISTRY */}
              <TabPanel style={{ paddingTop: '2rem' }}>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
                  <Button renderIcon={Add} onClick={() => openModelModal()}>Register External Model</Button>
                </div>
                <GlobalTable 
                  headers={modelHeaders} 
                  initialData={models} 
                  title="Models Registry" 
                  description="List of available models that can be assigned to strategies."
                  formatCell={formatModelCell}
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

      {/* TRAIN SETTINGS MODAL */}
      <Modal open={isTrainModalOpen} onRequestClose={() => setTrainModalOpen(false)} onRequestSubmit={startTraining} modalHeading={`Train settings for ${trainRegime.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}`} primaryButtonText="Start Training" secondaryButtonText="Cancel">
        <FormGroup legendText="">
          <Select id="train-algo" labelText="Algorithm" value={trainForm.algorithm} onChange={e => setTrainForm({...trainForm, algorithm: e.target.value})} style={{ marginBottom: "1rem" }}>
             <SelectItem value="XGBoost" text="XGBoost Ensemble" />
          </Select>
          <TextInput id="model-name-train" labelText="Custom Model Name (Optional)" placeholder="e.g. xgboost_bull_v2" value={trainForm.model_name} onChange={e => setTrainForm({...trainForm, model_name: e.target.value})} style={{ marginBottom: "1rem" }} />
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <TextInput id="start-date" type="date" labelText="Start Date" value={trainForm.start_date} onChange={e => setTrainForm({...trainForm, start_date: e.target.value})} />
              <TextInput id="end-date" type="date" labelText="End Date" value={trainForm.end_date} onChange={e => setTrainForm({...trainForm, end_date: e.target.value})} />
          </div>
          <NumberInput id="optuna-trials" label="Optuna Tuning Trials" value={trainForm.optuna_trials} onChange={(e, {value}) => setTrainForm({...trainForm, optuna_trials: Number(value)})} min={1} max={500} />
        </FormGroup>
      </Modal>

      {/* MODEL DETAILS MODAL */}
      <Modal open={isDetailModalOpen} onRequestClose={() => setDetailModalOpen(false)} passiveModal modalHeading="Model Details">
         {detailModel && (
            <div>
               <h4 style={{marginBottom: '1rem'}}>{detailModel.name}</h4>
               <p><strong>Algorithm:</strong> {detailModel.algorithm_type}</p>
               <p><strong>Accuracy:</strong> {detailModel.accuracy}</p>
               {detailModel.train_start_time && <p><strong>Train Started:</strong> {new Date(detailModel.train_start_time).toLocaleString()}</p>}
               {detailModel.train_duration_sec && <p><strong>Duration:</strong> {detailModel.train_duration_sec} seconds</p>}
               
               {detailModel.metrics_report && detailModel.metrics_report !== "{}" && (
                   <div style={{marginTop: '1rem'}}>
                       <h5>Metrics Report</h5>
                       <CodeSnippet type="multi" light>{JSON.stringify(JSON.parse(detailModel.metrics_report), null, 2)}</CodeSnippet>
                   </div>
               )}

               {detailModel.hyperparameters && detailModel.hyperparameters !== "{}" && (
                   <div style={{marginTop: '1rem'}}>
                       <h5>Hyperparameters</h5>
                       <CodeSnippet type="multi" light>{JSON.stringify(JSON.parse(detailModel.hyperparameters), null, 2)}</CodeSnippet>
                   </div>
               )}
            </div>
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
