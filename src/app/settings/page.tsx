"use client";

import { Grid, Column, Tabs, TabList, Tab, TabPanels, TabPanel, Tile, Form, FormGroup, TextInput, Select, SelectItem, Button, Toggle, Modal } from "@carbon/react";
import { Add, Edit, TrashCan } from "@carbon/icons-react";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import GlobalTable from "../../components/GlobalTable";

function SettingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [configs, setConfigs] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Modal states
  const [isConfigModalOpen, setConfigModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<any>(null);

  const [isModelModalOpen, setModelModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<any>(null);

  // Form states
  const [configForm, setConfigForm] = useState({ key: "", value: "", category: "", description: "" });
  const [modelForm, setModelForm] = useState({ id: "", name: "", algorithm_type: "", accuracy: "", status: "Inactive" });

  const fetchData = async () => {
    setIsLoadingData(true);
    try {
      const [confRes, modRes] = await Promise.all([
        fetch("http://127.0.0.1:8000/api/configurations"),
        fetch("http://127.0.0.1:8000/api/models")
      ]);
      const confData = await confRes.json();
      const modData = await modRes.json();
      setConfigs(confData);
      setModels(modData);
    } catch (err) {
      console.error("Failed to load settings data", err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- CONFIG HANDLERS ---
  const openConfigModal = (config: any = null) => {
    if (config) {
      setEditingConfig(config);
      setConfigForm(config);
    } else {
      setEditingConfig(null);
      setConfigForm({ key: "", value: "", category: "", description: "" });
    }
    setConfigModalOpen(true);
  };

  const saveConfig = async () => {
    try {
      await fetch("http://127.0.0.1:8000/api/configurations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configForm)
      });
      fetchData();
    } catch(e) { console.error(e); }
    setConfigModalOpen(false);
  };

  const deleteConfig = async (id: string) => {
    if(confirm("Are you sure you want to delete this configuration?")) {
      try {
        await fetch(`http://127.0.0.1:8000/api/configurations/${id}`, { method: "DELETE" });
        fetchData();
      } catch(e) { console.error(e); }
    }
  };

  // --- MODEL HANDLERS ---
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
      const payload = id ? { id, ...rest } : rest; // Let backend generate UUID if empty
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

  // --- TABLE FORMATTERS ---
  const configHeaders = [
    { key: "key", header: "Key" },
    { key: "value", header: "Value" },
    { key: "category", header: "Category" },
    { key: "description", header: "Description" },
    { key: "actions", header: "Actions" },
  ];

  const modelHeaders = [
    { key: "name", header: "Model Name" },
    { key: "algorithm_type", header: "Algorithm Type" },
    { key: "accuracy", header: "Accuracy" },
    { key: "status", header: "Status" },
    { key: "actions", header: "Actions" },
  ];

  const formatConfigCell = (cellId: string, value: any) => {
    if (cellId.endsWith(':actions')) {
      const rowId = cellId.split(':')[0];
      const config = configs.find(c => c.id === rowId);
      return (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button kind="ghost" size="sm" renderIcon={Edit} iconDescription="Edit" hasIconOnly onClick={() => openConfigModal(config)} />
          <Button kind="danger--ghost" size="sm" renderIcon={TrashCan} iconDescription="Delete" hasIconOnly onClick={() => deleteConfig(rowId)} />
        </div>
      );
    }
    return value;
  };

  const formatModelCell = (cellId: string, value: any) => {
    if (cellId.endsWith(':actions')) {
      const rowId = cellId.split(':')[0];
      const model = models.find(m => m.id === rowId);
      return (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button kind="ghost" size="sm" renderIcon={Edit} iconDescription="Edit" hasIconOnly onClick={() => openModelModal(model)} />
          <Button kind="danger--ghost" size="sm" renderIcon={TrashCan} iconDescription="Delete" hasIconOnly onClick={() => deleteModel(rowId)} />
        </div>
      );
    }
    if (cellId.endsWith(':status')) {
      return (
        <span style={{ 
          color: value === 'Active' ? '#24a148' : value === 'Training' ? '#0f62fe' : '#a8a8a8',
          fontWeight: value === 'Active' ? 'bold' : 'normal'
        }}>
          {value}
        </span>
      );
    }
    return value;
  };

  const tabParam = searchParams.get('tab');
  const selectedTab = tabParam === 'models' ? 1 : 0;

  const handleTabChange = (data: { selectedIndex: number }) => {
    const tabName = data.selectedIndex === 1 ? 'models' : 'configurations';
    router.replace(`${pathname}?tab=${tabName}`, { scroll: false });
  };

  return (
    <Grid fullWidth style={{ maxWidth: '100%', padding: '0 2rem' }}>
      <Column lg={16} md={8} sm={4} className="landing-page__banner">
        <h1 style={{ marginBottom: "1rem" }}>System Settings</h1>
        <p style={{ marginBottom: "2rem", color: "#a8a8a8" }}>Manage your global configurations and machine learning models.</p>
      </Column>

      <Column lg={16} md={8} sm={4}>
        <Tabs selectedIndex={selectedTab} onChange={handleTabChange}>
          <TabList aria-label="Settings Tabs">
            <Tab>Configurations</Tab>
            <Tab>Models</Tab>
          </TabList>
          <TabPanels>
            {/* --- CONFIGURATIONS TAB --- */}
            <TabPanel style={{ paddingTop: '2rem' }}>
              <GlobalTable 
                title={<span style={{ fontSize: "16px", fontWeight: "bold" }}>Global Configurations</span>}
                headers={configHeaders}
                initialData={configs}
                formatCell={formatConfigCell}
                toolbarActions={
                  <Button size="sm" renderIcon={Add} onClick={() => openConfigModal()}>Add Configuration</Button>
                }
              />
            </TabPanel>

            {/* --- MODELS TAB (SPLIT LAYOUT) --- */}
            <TabPanel style={{ paddingTop: '2rem' }}>
              <Grid>
                {/* Left Side: Settings */}
                <Column lg={5} md={8} sm={4} style={{ marginBottom: "2rem" }}>
                  <Tile>
                    <h3 style={{ marginBottom: '1.5rem' }}>Active Settings</h3>
                    <Form>
                      <FormGroup legendText="Model Selection">
                        <Select id="primary_model" labelText="Primary Directional Model" defaultValue="1" style={{ marginBottom: '1rem' }}>
                          {models.map(m => (
                            <SelectItem key={m.id} value={m.id} text={m.name} />
                          ))}
                        </Select>

                        <Select id="regime_model" labelText="Market Regime Model" defaultValue="hmm_v1" style={{ marginBottom: '1rem' }}>
                          <SelectItem value="hmm_v1" text="Hidden Markov Model v1" />
                          <SelectItem value="adx_kmean" text="ADX + K-Means Clustering" />
                        </Select>
                      </FormGroup>

                      <FormGroup legendText="Model Retraining">
                        <Toggle 
                          labelA="Manual" 
                          labelB="Auto" 
                          id="auto_retrain" 
                          labelText="Auto-Retrain Models Weekly" 
                          defaultToggled={true} 
                          style={{ marginBottom: '1.5rem' }} 
                        />
                      </FormGroup>

                      <Button type="button" onClick={() => alert("Active Settings Saved!")}>Save</Button>
                    </Form>
                  </Tile>
                </Column>

                {/* Right Side: Models Table */}
                <Column lg={11} md={8} sm={4}>
                  <GlobalTable 
                    title={<span style={{ fontSize: "16px", fontWeight: "bold" }}>Registered Models</span>}
                    headers={modelHeaders}
                    initialData={models}
                    formatCell={formatModelCell}
                    toolbarActions={
                      <Button size="sm" renderIcon={Add} onClick={() => openModelModal()}>Register Model</Button>
                    }
                  />
                </Column>
              </Grid>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Column>

      {/* --- MODALS --- */}
      <Modal
        open={isConfigModalOpen}
        onRequestClose={() => setConfigModalOpen(false)}
        onRequestSubmit={saveConfig}
        modalHeading={editingConfig ? "Edit Configuration" : "Add Configuration"}
        primaryButtonText="Save"
        secondaryButtonText="Cancel"
      >
        <TextInput 
          id="conf_key" labelText="Key" placeholder="e.g. MAX_RISK" 
          value={configForm.key} onChange={e => setConfigForm({...configForm, key: e.target.value})}
          style={{ marginBottom: '1rem' }} 
          disabled={!!editingConfig} // Cannot edit key after creation
        />
        <TextInput 
          id="conf_val" labelText="Value" placeholder='e.g. {"percent": 5}' 
          value={configForm.value} onChange={e => setConfigForm({...configForm, value: e.target.value})}
          style={{ marginBottom: '1rem' }} 
        />
        <TextInput 
          id="conf_cat" labelText="Category" placeholder="e.g. Risk" 
          value={configForm.category} onChange={e => setConfigForm({...configForm, category: e.target.value})}
          style={{ marginBottom: '1rem' }} 
        />
        <TextInput 
          id="conf_desc" labelText="Description" placeholder="Description" 
          value={configForm.description} onChange={e => setConfigForm({...configForm, description: e.target.value})}
        />
      </Modal>

      <Modal
        open={isModelModalOpen}
        onRequestClose={() => setModelModalOpen(false)}
        onRequestSubmit={saveModel}
        modalHeading={editingModel ? "Edit Model" : "Register Model"}
        primaryButtonText="Save"
        secondaryButtonText="Cancel"
      >
        <TextInput 
          id="mod_name" labelText="Model Name" placeholder="e.g. XGBoost Trend v2" 
          value={modelForm.name} onChange={e => setModelForm({...modelForm, name: e.target.value})}
          style={{ marginBottom: '1rem' }} 
        />
        <TextInput 
          id="mod_type" labelText="Algorithm Type" placeholder="e.g. Classifier" 
          value={modelForm.algorithm_type} onChange={e => setModelForm({...modelForm, algorithm_type: e.target.value})}
          style={{ marginBottom: '1rem' }} 
        />
        <TextInput 
          id="mod_acc" labelText="Accuracy" placeholder="e.g. 70.2%" 
          value={modelForm.accuracy} onChange={e => setModelForm({...modelForm, accuracy: e.target.value})}
          style={{ marginBottom: '1rem' }} 
        />
        <Select 
          id="mod_status" labelText="Status" 
          value={modelForm.status} onChange={e => setModelForm({...modelForm, status: e.target.value})}
        >
          <SelectItem value="Active" text="Active" />
          <SelectItem value="Inactive" text="Inactive" />
          <SelectItem value="Training" text="Training" />
        </Select>
      </Modal>
    </Grid>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem' }}>Loading Settings...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
