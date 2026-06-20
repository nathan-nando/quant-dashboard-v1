"use client";

import { Grid, Column, Tabs, TabList, Tab, TabPanels, TabPanel, Tile, Form, FormGroup, TextInput, Select, SelectItem, Button, Toggle, Modal } from "@carbon/react";
import { Add, Edit, TrashCan } from "@carbon/icons-react";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import GlobalTable from "../../components/GlobalTable";

function SettingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const currentTab = searchParams.get("tab") || "general";
  const navItems = [
    { id: 'general', label: 'General' },
    { id: 'configuration', label: 'Configuration' }
  ];

  const handleTabChange = (tabId: string) => {
    router.push(`${pathname}?tab=${tabId}`);
  };

  const [configs, setConfigs] = useState<any[]>([]);
      const [isLoadingData, setIsLoadingData] = useState(true);
  
  // Modal states
  const [isConfigModalOpen, setConfigModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<any>(null);

    
  // Form states
  const [configForm, setConfigForm] = useState({ key: "", value: "", category: "", description: "" });
  
    const fetchData = async () => {
    setIsLoadingData(true);
    try {
      const confRes = await fetch("http://127.0.0.1:8000/api/configurations");
      const confData = await confRes.json();
      setConfigs(confData);
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

  // --- TABLE FORMATTERS ---
  const configHeaders = [
    { key: "key", header: "Key" },
    { key: "value", header: "Value" },
    { key: "category", header: "Category" },
    { key: "description", header: "Description" },
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

  

  
  return (
    <Grid>
      <Column lg={16} md={8} sm={4} className="landing-page__banner">
        <h3 style={{ marginBottom: "1rem", fontWeight: 400 }}>System Settings</h3>
      </Column>

      <Column lg={16} md={8} sm={4}>
        <div style={{ display: 'flex', gap: '2rem', marginTop: '0.5rem' }}>
          {/* Sidebar Navigation */}
          <div style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '0.25rem', flexShrink: 0 }}>
            {navItems.map(item => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTabChange(item.id)}
                  className={isActive ? "settings-sidebar-item active" : "settings-sidebar-item"}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content Panels */}
          <div style={{ flex: 1 }}>
            {currentTab === 'general' && (
              <Tile style={{ backgroundColor: '#353535', border: 'none' }}>
                <h4 style={{ marginBottom: '0.5rem', fontWeight: 600 }}>General Settings</h4>
                <p style={{ color: '#c6c6c6' }}>Placeholder for general system settings.</p>
              </Tile>
            )}

            {currentTab === 'configuration' && (
              <GlobalTable 
                title="Global Configurations"
                headers={configHeaders}
                initialData={configs}
                formatCell={formatConfigCell}
                toolbarActions={
                  <Button size="sm" renderIcon={Add} onClick={() => openConfigModal()}>Add Configuration</Button>
                }
              />
            )}
          </div>
        </div>
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
