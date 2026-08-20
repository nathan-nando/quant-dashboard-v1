"use client";

import React, { useState, useEffect } from "react";
import {
  Grid,
  Column,
  Tile,
  Button,
  Tag,
  Modal,
  TextInput,
  PasswordInput,
  NumberInput,
  Select,
  SelectItem,
  InlineNotification,
  ToastNotification,
  Loading,
  DataTable,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableToolbar,
  TableToolbarContent
} from "@carbon/react";
import {
  Add,
  Edit,
  TrashCan,
  CheckmarkOutline,
  ConnectionSignal,
  Renew,
  PlayOutline,
  SettingsAdjust,
  Locked
} from "@carbon/icons-react";
import { API_BASE_URL } from "@/config/env";

interface BrokerType {
  type: string;
  name: string;
  description: string;
  supported_modes: string[];
  config_schema: any;
  credential_schema: any;
  icon?: string;
}

interface AccountItem {
  id: number;
  broker_id: number;
  name: string;
  mode: string;
  currency: string;
  balance: number;
  equity: number;
  is_active: boolean;
  credentials_masked?: Record<string, string>;
}

interface BrokerItem {
  id: number;
  name: string;
  broker_type: string;
  config: Record<string, any>;
  is_active: boolean;
  accounts_count: number;
  active_account?: {
    id: number;
    name: string;
    mode: string;
    currency: string;
  } | null;
}

export default function BrokerSettings() {
  const [brokerTypes, setBrokerTypes] = useState<BrokerType[]>([]);
  const [brokers, setBrokers] = useState<BrokerItem[]>([]);
  const [selectedBrokerId, setSelectedBrokerId] = useState<number | null>(null);
  const [selectedBrokerDetails, setSelectedBrokerDetails] = useState<{
    id: number;
    name: string;
    broker_type: string;
    config: Record<string, any>;
    is_active: boolean;
    accounts: AccountItem[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ kind: "success" | "error" | "info" | "warning"; title: string; subtitle: string } | null>(null);

  // Modal States
  const [brokerModalOpen, setBrokerModalOpen] = useState(false);
  const [editingBroker, setEditingBroker] = useState<BrokerItem | null>(null);
  const [brokerForm, setBrokerForm] = useState<{ name: string; broker_type: string; config: Record<string, any> }>({
    name: "",
    broker_type: "mt5",
    config: {}
  });

  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountItem | null>(null);
  const [accountForm, setAccountForm] = useState<{
    name: string;
    mode: string;
    currency: string;
    credentials: Record<string, any>;
  }>({
    name: "",
    mode: "DEMO",
    currency: "USD",
    credentials: {}
  });

  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => Promise<void>;
  }>({ open: false, title: "", message: "", onConfirm: async () => {} });

  const [testResult, setTestResult] = useState<{
    open: boolean;
    title: string;
    connected: boolean;
    message: string;
    info?: any;
  } | null>(null);

  // Fetch Broker Types & Brokers List
  const loadData = async () => {
    setLoading(true);
    try {
      const [typesRes, listRes] = await Promise.all([
        fetch(`${API_BASE_URL}/brokers/types`),
        fetch(`${API_BASE_URL}/brokers`)
      ]);
      const typesData = await typesRes.json();
      const listData = await listRes.json();

      if (typesData.status === "success") setBrokerTypes(typesData.data || []);
      if (listData.status === "success") {
        const bList: BrokerItem[] = listData.data || [];
        setBrokers(bList);
        // Default select active broker or first broker
        if (bList.length > 0) {
          const active = bList.find(b => b.is_active) || bList[0];
          setSelectedBrokerId(prev => (prev !== null && bList.some(b => b.id === prev) ? prev : active.id));
        } else {
          setSelectedBrokerId(null);
        }
      }
    } catch (err: any) {
      console.error("Failed to load broker data:", err);
      setToast({ kind: "error", title: "Network Error", subtitle: "Could not fetch broker configs from engine." });
    } finally {
      setLoading(false);
    }
  };

  // Fetch single broker details when selection changes
  const loadBrokerDetails = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/brokers/${id}`);
      const data = await res.json();
      if (data.status === "success") {
        setSelectedBrokerDetails(data.data);
      }
    } catch (err) {
      console.error("Failed to load broker details:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedBrokerId !== null) {
      loadBrokerDetails(selectedBrokerId);
    } else {
      setSelectedBrokerDetails(null);
    }
  }, [selectedBrokerId]);

  // Selected Broker Type Definition
  const currentBrokerType = brokerTypes.find(t => t.type === (editingBroker ? editingBroker.broker_type : brokerForm.broker_type)) || brokerTypes[0];

  // --- Dynamic Schema Form Field Renderer ---
  const renderDynamicFields = (
    schema: any,
    values: Record<string, any>,
    onChange: (key: string, value: any) => void
  ) => {
    if (!schema || !schema.properties) return null;

    return Object.entries(schema.properties).map(([key, prop]: [string, any]) => {
      const fieldTitle = prop.title || key;
      const fieldDesc = prop.description || "";
      const fieldType = prop.type;
      const isPassword = prop.format === "password";
      const val = values[key] !== undefined ? values[key] : prop.default !== undefined ? prop.default : "";

      if (isPassword) {
        return (
          <div key={key} style={{ marginBottom: "1rem" }}>
            <PasswordInput
              id={`dyn_${key}`}
              labelText={fieldTitle}
              helperText={fieldDesc}
              placeholder={prop.placeholder || "Enter password"}
              value={val}
              onChange={(e: any) => onChange(key, e.target.value)}
            />
          </div>
        );
      }

      if (fieldType === "number" || fieldType === "integer") {
        return (
          <div key={key} style={{ marginBottom: "1rem" }}>
            <NumberInput
              id={`dyn_${key}`}
              label={fieldTitle}
              helperText={fieldDesc}
              value={val === "" ? 0 : Number(val)}
              onChange={(e: any, { value }: any) => onChange(key, value)}
              step={fieldType === "integer" ? 1 : 0.1}
            />
          </div>
        );
      }

      return (
        <div key={key} style={{ marginBottom: "1rem" }}>
          <TextInput
            id={`dyn_${key}`}
            labelText={fieldTitle}
            helperText={fieldDesc}
            placeholder={prop.placeholder || prop.default || ""}
            value={val}
            onChange={(e: any) => onChange(key, e.target.value)}
          />
        </div>
      );
    });
  };

  // --- Broker Actions ---
  const handleOpenAddBroker = () => {
    setEditingBroker(null);
    const defaultType = brokerTypes[0]?.type || "mt5";
    const defaultSchema = brokerTypes[0]?.config_schema?.properties || {};
    const defaultCfg: Record<string, any> = {};
    Object.keys(defaultSchema).forEach(k => {
      if (defaultSchema[k].default !== undefined) defaultCfg[k] = defaultSchema[k].default;
    });

    setBrokerForm({
      name: "",
      broker_type: defaultType,
      config: defaultCfg
    });
    setBrokerModalOpen(true);
  };

  const handleOpenEditBroker = (broker: BrokerItem) => {
    setEditingBroker(broker);
    setBrokerForm({
      name: broker.name,
      broker_type: broker.broker_type,
      config: { ...(broker.config || {}) }
    });
    setBrokerModalOpen(true);
  };

  const handleSaveBroker = async () => {
    if (!brokerForm.name.trim()) {
      setToast({ kind: "error", title: "Validation Error", subtitle: "Broker name is required." });
      return;
    }

    setActionLoading(true);
    try {
      const url = editingBroker ? `${API_BASE_URL}/brokers/${editingBroker.id}` : `${API_BASE_URL}/brokers`;
      const method = editingBroker ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(brokerForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to save broker.");

      setToast({ kind: "success", title: "Success", subtitle: data.message || "Broker saved successfully." });
      setBrokerModalOpen(false);
      await loadData();
      if (data.data?.id) setSelectedBrokerId(data.data.id);
    } catch (err: any) {
      setToast({ kind: "error", title: "Error", subtitle: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivateBroker = (broker: BrokerItem) => {
    setConfirmModal({
      open: true,
      title: `Activate Broker: ${broker.name}`,
      message: `Are you sure you want to switch the system's active broker to "${broker.name}"? Only 1 broker can be active at a time. The trading engine will re-initialize its connection.`,
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const res = await fetch(`${API_BASE_URL}/brokers/${broker.id}/activate`, { method: "POST" });
          const data = await res.json();
          if (!res.ok) throw new Error(data.detail || "Failed to activate broker");

          setToast({
            kind: data.connected ? "success" : "warning",
            title: data.connected ? "Broker Activated & Connected" : "Broker Activated (Pending Connection)",
            subtitle: data.message
          });
          await loadData();
        } catch (err: any) {
          setToast({ kind: "error", title: "Activation Failed", subtitle: err.message });
        } finally {
          setActionLoading(false);
          setConfirmModal(prev => ({ ...prev, open: false }));
        }
      }
    });
  };

  const handleDeleteBroker = (broker: BrokerItem) => {
    if (broker.is_active) {
      setToast({ kind: "warning", title: "Cannot Delete", subtitle: "Active broker cannot be deleted. Please activate another broker first." });
      return;
    }

    setConfirmModal({
      open: true,
      title: `Delete Broker: ${broker.name}`,
      message: `Are you sure you want to delete "${broker.name}" and all its configured accounts? This action cannot be undone.`,
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const res = await fetch(`${API_BASE_URL}/brokers/${broker.id}`, { method: "DELETE" });
          const data = await res.json();
          if (!res.ok) throw new Error(data.detail || "Failed to delete broker.");

          setToast({ kind: "success", title: "Broker Deleted", subtitle: data.message });
          await loadData();
        } catch (err: any) {
          setToast({ kind: "error", title: "Delete Error", subtitle: err.message });
        } finally {
          setActionLoading(false);
          setConfirmModal(prev => ({ ...prev, open: false }));
        }
      }
    });
  };

  const handleTestBroker = async (brokerId: number) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/brokers/${brokerId}/test`, { method: "POST" });
      const data = await res.json();
      setTestResult({
        open: true,
        title: `Broker Connection Test`,
        connected: data.connected,
        message: data.message,
        info: data.account_info
      });
    } catch (err: any) {
      setTestResult({
        open: true,
        title: `Broker Connection Test`,
        connected: false,
        message: err.message || "Failed to reach engine."
      });
    } finally {
      setActionLoading(false);
    }
  };

  // --- Account Actions ---
  const handleOpenAddAccount = () => {
    if (!selectedBrokerId) return;
    setEditingAccount(null);
    const bType = brokerTypes.find(t => t.type === selectedBrokerDetails?.broker_type);
    const credProps = bType?.credential_schema?.properties || {};
    const defaultCreds: Record<string, any> = {};
    Object.keys(credProps).forEach(k => {
      if (credProps[k].default !== undefined) defaultCreds[k] = credProps[k].default;
    });

    setAccountForm({
      name: "",
      mode: bType?.supported_modes?.[0] || "DEMO",
      currency: "USD",
      credentials: defaultCreds
    });
    setAccountModalOpen(true);
  };

  const handleOpenEditAccount = (acc: AccountItem) => {
    setEditingAccount(acc);
    setAccountForm({
      name: acc.name,
      mode: acc.mode,
      currency: acc.currency,
      credentials: { ...(acc.credentials_masked || {}) }
    });
    setAccountModalOpen(true);
  };

  const handleSaveAccount = async () => {
    if (!selectedBrokerId) {
      setToast({ kind: "error", title: "Validation Error", subtitle: "Please select a broker first." });
      return;
    }

    setActionLoading(true);
    try {
      const url = editingAccount
        ? `${API_BASE_URL}/brokers/${selectedBrokerId}/accounts/${editingAccount.id}`
        : `${API_BASE_URL}/brokers/${selectedBrokerId}/accounts`;
      const method = editingAccount ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(accountForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to save account.");

      setToast({ kind: "success", title: "Success", subtitle: data.message || "Account saved." });
      setAccountModalOpen(false);
      await loadBrokerDetails(selectedBrokerId);
      await loadData();
    } catch (err: any) {
      setToast({ kind: "error", title: "Save Error", subtitle: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAccount = (account: AccountItem) => {
    if (!selectedBrokerId) return;
    setConfirmModal({
      open: true,
      title: `Delete Account: ${account.name}`,
      message: `Are you sure you want to delete account "${account.name}" (${account.mode})?`,
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const res = await fetch(`${API_BASE_URL}/brokers/${selectedBrokerId}/accounts/${account.id}`, {
            method: "DELETE"
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.detail || "Failed to delete account");

          setToast({ kind: "success", title: "Account Deleted", subtitle: data.message });
          await loadBrokerDetails(selectedBrokerId);
          await loadData();
        } catch (err: any) {
          setToast({ kind: "error", title: "Delete Error", subtitle: err.message });
        } finally {
          setActionLoading(false);
          setConfirmModal(prev => ({ ...prev, open: false }));
        }
      }
    });
  };

  const handleTestAccount = async (accountId: number) => {
    if (!selectedBrokerId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/brokers/${selectedBrokerId}/accounts/${accountId}/test`, {
        method: "POST"
      });
      const data = await res.json();
      setTestResult({
        open: true,
        title: "Account Login Test",
        connected: data.connected,
        message: data.message,
        info: data.account_info
      });
    } catch (err: any) {
      setTestResult({
        open: true,
        title: "Account Login Test",
        connected: false,
        message: err.message || "Failed to execute login test."
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Active Broker helper
  const activeBroker = brokers.find(b => b.is_active);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Toast Notification */}
      {toast && (
        <div style={{ position: "fixed", top: "4rem", right: "1rem", zIndex: 9999 }}>
          <ToastNotification
            timeout={5000}
            kind={toast.kind}
            title={toast.title}
            subtitle={toast.subtitle}
            caption={new Date().toLocaleTimeString()}
            onClose={() => {
              setToast(null);
              return false;
            }}
          />
        </div>
      )}

      {/* --- Active Broker Status Banner --- */}
      <Tile style={{ backgroundColor: "#262626", border: "1px solid #393939", padding: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
              <ConnectionSignal size={24} style={{ color: activeBroker ? "#42be65" : "#da1e28" }} />
              <h4 style={{ fontWeight: 600, margin: 0 }}>
                Active Broker: {activeBroker ? activeBroker.name : "None Configured"}
              </h4>
              {activeBroker ? (
                <Tag type="green">SYSTEM ACTIVE</Tag>
              ) : (
                <Tag type="red">OFFLINE</Tag>
              )}
            </div>
            <p style={{ color: "#c6c6c6", fontSize: "0.875rem", margin: 0 }}>
              {activeBroker ? (
                <>
                  Adapter Type: <strong style={{ color: "#fff" }}>{activeBroker.broker_type.toUpperCase()}</strong> | Active Account:{" "}
                  <strong style={{ color: "#fff" }}>
                    {activeBroker.active_account ? `${activeBroker.active_account.name} (${activeBroker.active_account.mode})` : "No account active"}
                  </strong>
                </>
              ) : (
                "Please configure and activate a broker below to enable market data & trade execution."
              )}
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Button
              size="sm"
              kind="tertiary"
              renderIcon={Renew}
              onClick={loadData}
              disabled={loading || actionLoading}
            >
              Refresh
            </Button>
            <Button
              size="sm"
              kind="primary"
              renderIcon={Add}
              onClick={handleOpenAddBroker}
            >
              Add Broker
            </Button>
          </div>
        </div>
      </Tile>

      {/* --- Main 2-Column Layout: Broker Cards (Left) & Accounts Table (Right) --- */}
      <Grid fullWidth style={{ padding: 0 }}>
        {/* Left Column: Registered Brokers */}
        <Column lg={6} md={8} sm={4}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h5 style={{ fontWeight: 600, color: "#f4f4f4" }}>Brokers ({brokers.length})</h5>
              <span style={{ fontSize: "0.75rem", color: "#8d8d8d" }}>Single active constraint enforced</span>
            </div>

            {loading && brokers.length === 0 ? (
              <Tile style={{ backgroundColor: "#262626", textAlign: "center", padding: "2rem" }}>
                <Loading withOverlay={false} small />
              </Tile>
            ) : brokers.length === 0 ? (
              <Tile style={{ backgroundColor: "#262626", textAlign: "center", padding: "2rem" }}>
                <p style={{ color: "#a8a8a8" }}>No brokers registered yet.</p>
                <Button size="sm" renderIcon={Add} style={{ marginTop: "1rem" }} onClick={handleOpenAddBroker}>
                  Add Your First Broker
                </Button>
              </Tile>
            ) : (
              brokers.map(broker => {
                const isSelected = selectedBrokerId === broker.id;
                return (
                  <Tile
                    key={broker.id}
                    onClick={() => setSelectedBrokerId(broker.id)}
                    style={{
                      backgroundColor: isSelected ? "#353535" : "#262626",
                      border: isSelected ? "2px solid #0f62fe" : "1px solid #393939",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      padding: "1rem"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                      <div>
                        <h6 style={{ fontWeight: 600, margin: 0, fontSize: "1rem", color: "#ffffff" }}>
                          {broker.name}
                        </h6>
                        <span style={{ fontSize: "0.75rem", color: "#8d8d8d" }}>
                          Type: {broker.broker_type.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "0.25rem" }}>
                        {broker.is_active && <Tag type="green" size="sm">ACTIVE</Tag>}
                        <Tag type={broker.broker_type === "mt5" ? "teal" : "purple"} size="sm">
                          {broker.broker_type.toUpperCase()}
                        </Tag>
                      </div>
                    </div>

                    <p style={{ fontSize: "0.8125rem", color: "#c6c6c6", margin: "0.5rem 0" }}>
                      Accounts: <strong>{broker.accounts_count}</strong>
                      {broker.config?.symbols && (
                        <> | Symbols: <strong style={{ color: "#f4f4f4" }}>{broker.config.symbols}</strong></>
                      )}
                      {broker.config?.initial_balance !== undefined && (
                        <> | Default Fund: <strong style={{ color: "#42be65" }}>${Number(broker.config.initial_balance).toLocaleString()}</strong></>
                      )}
                    </p>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.75rem" }} onClick={e => e.stopPropagation()}>
                      {!broker.is_active && (
                        <Button
                          kind="ghost"
                          size="sm"
                          renderIcon={PlayOutline}
                          onClick={() => handleActivateBroker(broker)}
                          title="Activate this broker"
                        >
                          Activate
                        </Button>
                      )}
                      <Button
                        kind="ghost"
                        size="sm"
                        hasIconOnly
                        renderIcon={ConnectionSignal}
                        iconDescription="Test Connection"
                        onClick={() => handleTestBroker(broker.id)}
                      />
                      <Button
                        kind="ghost"
                        size="sm"
                        hasIconOnly
                        renderIcon={Edit}
                        iconDescription="Edit Config"
                        onClick={() => handleOpenEditBroker(broker)}
                      />
                      {!broker.is_active && (
                        <Button
                          kind="danger--ghost"
                          size="sm"
                          hasIconOnly
                          renderIcon={TrashCan}
                          iconDescription="Delete Broker"
                          onClick={() => handleDeleteBroker(broker)}
                        />
                      )}
                    </div>
                  </Tile>
                );
              })
            )}
          </div>
        </Column>

        {/* Right Column: Accounts under Selected Broker */}
        <Column lg={10} md={8} sm={4}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {selectedBrokerDetails ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h5 style={{ fontWeight: 600, margin: 0, color: "#f4f4f4" }}>
                      Accounts for: {selectedBrokerDetails.name}
                    </h5>
                    <span style={{ fontSize: "0.8125rem", color: "#8d8d8d" }}>
                      Manage trading credentials and account profiles for this adapter
                    </span>
                  </div>
                  <Button size="sm" renderIcon={Add} onClick={handleOpenAddAccount}>
                    Add Account
                  </Button>
                </div>

                {selectedBrokerDetails.accounts.length === 0 ? (
                  <Tile style={{ backgroundColor: "#262626", textAlign: "center", padding: "2.5rem" }}>
                    <p style={{ color: "#a8a8a8", marginBottom: "1rem" }}>
                      No accounts registered under this broker.
                    </p>
                    <Button size="sm" renderIcon={Add} onClick={handleOpenAddAccount}>
                      Add Account Credentials
                    </Button>
                  </Tile>
                ) : (
                  <div style={{ backgroundColor: "#262626", border: "1px solid #393939" }}>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableHeader>Account Name</TableHeader>
                            <TableHeader>Mode</TableHeader>
                            <TableHeader>Balance</TableHeader>
                            <TableHeader>Currency</TableHeader>
                            <TableHeader>Credentials / Config</TableHeader>
                            <TableHeader>Actions</TableHeader>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedBrokerDetails.accounts.map(acc => (
                            <TableRow key={acc.id}>
                              <TableCell style={{ fontWeight: 600 }}>{acc.name}</TableCell>
                              <TableCell>
                                <Tag
                                  type={
                                    acc.mode === "LIVE" ? "green" : acc.mode === "DEMO" ? "blue" : "purple"
                                  }
                                  size="sm"
                                >
                                  {acc.mode}
                                </Tag>
                              </TableCell>
                              <TableCell style={{ fontWeight: 500, color: "#42be65" }}>
                                {acc.balance ? `$${Number(acc.balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "$0.00"}
                              </TableCell>
                              <TableCell>{acc.currency}</TableCell>
                              <TableCell>
                                <span style={{ fontFamily: "monospace", fontSize: "0.8125rem", color: "#8d8d8d" }}>
                                  {acc.credentials_masked
                                    ? Object.entries(acc.credentials_masked)
                                        .map(([k, v]) => `${k}: ${v}`)
                                        .join(", ")
                                    : "None"}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div style={{ display: "flex", gap: "0.25rem" }}>
                                  <Button
                                    kind="ghost"
                                    size="sm"
                                    hasIconOnly
                                    renderIcon={ConnectionSignal}
                                    iconDescription="Test Login Credentials"
                                    onClick={() => handleTestAccount(acc.id)}
                                  />
                                  <Button
                                    kind="ghost"
                                    size="sm"
                                    hasIconOnly
                                    renderIcon={Edit}
                                    iconDescription="Edit Account"
                                    onClick={() => handleOpenEditAccount(acc)}
                                  />
                                  <Button
                                    kind="danger--ghost"
                                    size="sm"
                                    hasIconOnly
                                    renderIcon={TrashCan}
                                    iconDescription="Delete Account"
                                    onClick={() => handleDeleteAccount(acc)}
                                  />
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </div>
                )}
              </>
            ) : (
              <Tile style={{ backgroundColor: "#262626", textAlign: "center", padding: "3rem" }}>
                <p style={{ color: "#a8a8a8" }}>Select a broker from the left column to view and manage its accounts.</p>
              </Tile>
            )}
          </div>
        </Column>
      </Grid>

      {/* --- Add / Edit Broker Modal (Dynamic JSON Schema) --- */}
      <Modal
        open={brokerModalOpen}
        modalHeading={editingBroker ? `Edit Broker: ${editingBroker.name}` : "Add New Broker"}
        primaryButtonText={actionLoading ? "Saving..." : "Save Broker"}
        secondaryButtonText="Cancel"
        primaryButtonDisabled={actionLoading}
        onRequestClose={() => setBrokerModalOpen(false)}
        onRequestSubmit={handleSaveBroker}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "0.5rem 0" }}>
          <TextInput
            id="broker_name"
            labelText="Broker Name / Label"
            placeholder="e.g. Exness MT5 Real, FTMO Challenge, Paper Sandbox"
            value={brokerForm.name}
            onChange={e => setBrokerForm({ ...brokerForm, name: e.target.value })}
            required
          />

          {!editingBroker && (
            <Select
              id="broker_type_select"
              labelText="Broker Adapter Type"
              value={brokerForm.broker_type}
              onChange={e => {
                const bType = e.target.value;
                const defSchema = brokerTypes.find(t => t.type === bType)?.config_schema?.properties || {};
                const defCfg: Record<string, any> = {};
                Object.keys(defSchema).forEach(k => {
                  if (defSchema[k].default !== undefined) defCfg[k] = defSchema[k].default;
                });
                setBrokerForm({ ...brokerForm, broker_type: bType, config: defCfg });
              }}
            >
              {brokerTypes.map(t => (
                <SelectItem key={t.type} value={t.type} text={`${t.name} (${t.type.toUpperCase()})`} />
              ))}
            </Select>
          )}

          {currentBrokerType && (
            <InlineNotification
              kind="info"
              lowContrast
              hideCloseButton
              title={currentBrokerType.name}
              subtitle={currentBrokerType.description}
            />
          )}

          <h6 style={{ fontWeight: 600, marginTop: "0.5rem", color: "#f4f4f4" }}>Adapter Configuration</h6>

          {currentBrokerType?.config_schema ? (
            renderDynamicFields(currentBrokerType.config_schema, brokerForm.config, (key, value) => {
              setBrokerForm(prev => ({
                ...prev,
                config: { ...prev.config, [key]: value }
              }));
            })
          ) : (
            <p style={{ color: "#8d8d8d", fontSize: "0.875rem" }}>No configuration parameters required for this broker.</p>
          )}
        </div>
      </Modal>

      {/* --- Add / Edit Account Modal (Dynamic Credential Schema) --- */}
      <Modal
        open={accountModalOpen}
        modalHeading={
          editingAccount
            ? `Edit Account: ${editingAccount.name}`
            : `Add Account to ${selectedBrokerDetails?.name || "Broker"}`
        }
        primaryButtonText={actionLoading ? "Saving..." : "Save Account"}
        secondaryButtonText="Cancel"
        primaryButtonDisabled={actionLoading}
        onRequestClose={() => setAccountModalOpen(false)}
        onRequestSubmit={handleSaveAccount}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "0.5rem 0" }}>
          <TextInput
            id="acc_name"
            labelText="Account Alias / Label (Optional)"
            helperText="Leave blank to auto-use '{Server} #{Login ID}' from broker"
            placeholder="e.g. Exness-MT5Trial7 #218631908"
            value={accountForm.name}
            onChange={e => setAccountForm({ ...accountForm, name: e.target.value })}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <Select
              id="acc_mode"
              labelText="Trading Mode"
              value={accountForm.mode}
              onChange={e => setAccountForm({ ...accountForm, mode: e.target.value })}
            >
              {(currentBrokerType?.supported_modes || ["DEMO", "LIVE", "PAPER"]).map(m => (
                <SelectItem key={m} value={m} text={m} />
              ))}
            </Select>

            <TextInput
              id="acc_curr"
              labelText="Base Currency"
              value={accountForm.currency}
              onChange={e => setAccountForm({ ...accountForm, currency: e.target.value })}
            />
          </div>

          <h6 style={{ fontWeight: 600, marginTop: "0.5rem", color: "#f4f4f4" }}>Account Credentials (Encrypted at Rest)</h6>

          {currentBrokerType?.credential_schema ? (
            renderDynamicFields(currentBrokerType.credential_schema, accountForm.credentials, (key, value) => {
              setAccountForm(prev => ({
                ...prev,
                credentials: { ...prev.credentials, [key]: value }
              }));
            })
          ) : (
            <p style={{ color: "#8d8d8d", fontSize: "0.875rem" }}>No credentials required.</p>
          )}
        </div>
      </Modal>

      {/* --- Confirmation Modal --- */}
      <Modal
        open={confirmModal.open}
        modalHeading={confirmModal.title}
        primaryButtonText={actionLoading ? "Processing..." : "Confirm"}
        secondaryButtonText="Cancel"
        primaryButtonDisabled={actionLoading}
        onRequestClose={() => setConfirmModal(prev => ({ ...prev, open: false }))}
        onRequestSubmit={confirmModal.onConfirm}
      >
        <p style={{ padding: "1rem 0", fontSize: "0.875rem", color: "#e0e0e0" }}>
          {confirmModal.message}
        </p>
      </Modal>

      {/* --- Connection Test Result Modal --- */}
      {testResult && (
        <Modal
          open={testResult.open}
          modalHeading={testResult.title}
          passiveModal
          onRequestClose={() => setTestResult(null)}
        >
          <div style={{ padding: "1rem 0" }}>
            <InlineNotification
              kind={testResult.connected ? "success" : "error"}
              title={testResult.connected ? "Connection Successful" : "Connection Failed"}
              subtitle={testResult.message}
              hideCloseButton
            />
            {testResult.info && (
              <div style={{ marginTop: "1rem", backgroundColor: "#353535", padding: "1rem", borderRadius: "4px" }}>
                <h6 style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Live Account Metrics</h6>
                <p style={{ fontSize: "0.875rem", margin: "0.25rem 0" }}>
                  Server: <strong>{testResult.info.server}</strong>
                </p>
                <p style={{ fontSize: "0.875rem", margin: "0.25rem 0" }}>
                  Balance: <strong>${testResult.info.balance?.toLocaleString()} {testResult.info.currency}</strong>
                </p>
                <p style={{ fontSize: "0.875rem", margin: "0.25rem 0" }}>
                  Equity: <strong>${testResult.info.equity?.toLocaleString()}</strong>
                </p>
                <p style={{ fontSize: "0.875rem", margin: "0.25rem 0" }}>
                  Leverage: <strong>1:{testResult.info.leverage}</strong>
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
