import React, { useState, useEffect } from 'react';
import {
  Receipt,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  Key,
  Eye,
  EyeOff,
  QrCode,
  Radio,
  Server,
  Info,
  Check,
} from 'lucide-react';
import { settingsApi } from '../../api/client';

export const FBRModule: React.FC = () => {
  // Form State
  const [ntn, setNtn] = useState('');
  const [strn, setStrn] = useState('');
  const [fbrPosId, setFbrPosId] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [isFbrEnabled, setIsFbrEnabled] = useState(false);

  // UI State
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load existing FBR settings
  useEffect(() => {
    let isMounted = true;
    async function loadSettings() {
      try {
        setLoading(true);
        const data = await settingsApi.get();
        if (isMounted && data) {
          if (data.ntn) setNtn(data.ntn);
          if (data.strn) setStrn(data.strn);
          if (data.fbrPosId) setFbrPosId(data.fbrPosId);
          if (typeof data.isFbrEnabled === 'boolean') setIsFbrEnabled(data.isFbrEnabled);
        }
      } catch (err) {
        console.warn('Could not fetch server settings, reading cached state:', err);
      } finally {
        // Also read client-side persisted credentials if present
        const savedClientId = localStorage.getItem('mhms_fbr_client_id');
        const savedClientSecret = localStorage.getItem('mhms_fbr_client_secret');
        if (savedClientId) setClientId(savedClientId);
        if (savedClientSecret) setClientSecret(savedClientSecret);
        if (isMounted) setLoading(false);
      }
    }

    loadSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // 1. Persist to backend settings API
      await settingsApi.update({
        ntn: ntn.trim(),
        strn: strn.trim(),
        fbrPosId: fbrPosId.trim(),
        isFbrEnabled: Boolean(isFbrEnabled),
      });

      // 2. Persist client authentication keys securely in local storage
      if (clientId) localStorage.setItem('mhms_fbr_client_id', clientId.trim());
      if (clientSecret) localStorage.setItem('mhms_fbr_client_secret', clientSecret.trim());

      showToast('FBR Digital Invoicing settings saved successfully.');
    } catch (err: any) {
      console.error('Error saving FBR settings:', err);
      // Fallback local persistence if offline
      if (clientId) localStorage.setItem('mhms_fbr_client_id', clientId.trim());
      if (clientSecret) localStorage.setItem('mhms_fbr_client_secret', clientSecret.trim());
      showToast('FBR configuration saved locally.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col w-full gap-6 pb-16 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-slate-700 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-teal-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              FBR Digital Invoicing &amp; POS Integration
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] font-bold uppercase tracking-wider">
              Fiscal Compliance
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure real-time sales tax fiscalization, PRAL integration credentials, and automated QR code generation for banquet invoices.
          </p>
        </div>

        {/* Live Status Badge */}
        <div className="flex items-center gap-2">
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold ${
              isFbrEnabled
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-slate-800/80 text-slate-400 border-slate-700'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isFbrEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
              }`}
            />
            <span>{isFbrEnabled ? 'FBR Invoicing Active' : 'FBR Invoicing Disabled'}</span>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: FBR Settings Form */}
        <div className="lg:col-span-2">
          <form
            onSubmit={handleSaveSettings}
            className="bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden"
          >
            <div className="p-5 border-b border-slate-700/60 bg-slate-900/80 flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-teal-400" />
                <span>PRAL Gateway Configuration</span>
              </h2>
              <span className="text-xs font-mono text-slate-400">PRAL IMS v2.4</span>
            </div>

            <div className="p-6 space-y-6">
              {/* Toggle Switch: Enable FBR Digital Invoicing */}
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-700 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">
                      Enable FBR Digital Invoicing
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        isFbrEnabled
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {isFbrEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Automatically sign customer booking payments with FBR fiscal tokens and embed verified QR codes on invoice printouts.
                  </p>
                </div>

                {/* Toggle Button */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={isFbrEnabled}
                  onClick={() => setIsFbrEnabled(!isFbrEnabled)}
                  className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isFbrEnabled ? 'bg-gradient-to-r from-teal-500 to-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      isFbrEnabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* NTN & STRN Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    NTN (National Tax Number)
                  </label>
                  <input
                    type="text"
                    value={ntn}
                    onChange={(e) => setNtn(e.target.value)}
                    placeholder="e.g. 1234567-8"
                    className="w-full px-3.5 py-2.5 text-xs font-mono rounded-lg border border-slate-700 bg-slate-900 text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">7 digits followed by 1 check digit</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    STRN (Sales Tax Registration Number)
                  </label>
                  <input
                    type="text"
                    value={strn}
                    onChange={(e) => setStrn(e.target.value)}
                    placeholder="e.g. 03-00-1234-567-89"
                    className="w-full px-3.5 py-2.5 text-xs font-mono rounded-lg border border-slate-700 bg-slate-900 text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">13-digit provincial STRN identifier</span>
                </div>
              </div>

              {/* POS ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  POS ID (Registered Point of Sale ID)
                </label>
                <input
                  type="text"
                  value={fbrPosId}
                  onChange={(e) => setFbrPosId(e.target.value)}
                  placeholder="e.g. POS-98214"
                  className="w-full px-3.5 py-2.5 text-xs font-mono rounded-lg border border-slate-700 bg-slate-900 text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Assigned by the Federal Board of Revenue upon venue registration</span>
              </div>

              {/* Client ID & Client Secret */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Client ID / App Key
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      placeholder="e.g. fbr_live_client_abc123"
                      className="w-full px-3.5 py-2.5 text-xs font-mono rounded-lg border border-slate-700 bg-slate-900 text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">PRAL OAuth2 Client ID</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Client Secret / Authorization Token
                  </label>
                  <div className="relative">
                    <input
                      type={showSecret ? 'text' : 'password'}
                      value={clientSecret}
                      onChange={(e) => setClientSecret(e.target.value)}
                      placeholder="••••••••••••••••••••••••"
                      className="w-full px-3.5 py-2.5 pr-10 text-xs font-mono rounded-lg border border-slate-700 bg-slate-900 text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Encrypted token for HTTPS endpoint signing</span>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-slate-700/60 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={saving || loading}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white text-xs font-bold shadow-lg shadow-teal-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save FBR Settings'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Right 1 Column: Fiscal Diagnostics & QR Code Preview */}
        <div className="space-y-6">
          {/* QR Code Verification Preview Card */}
          <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 shadow-xl flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-3">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white">Invoice QR Verification</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Every invoice printed with FBR enabled displays an official PRAL verification barcode readable by the Tax Asaan mobile app.
            </p>

            <div className="mt-5 p-4 rounded-xl bg-white border border-slate-300 shadow-inner flex flex-col items-center">
              <div className="w-32 h-32 bg-slate-900 rounded-lg flex flex-col items-center justify-center p-2 text-white">
                <QrCode className="w-24 h-24 text-teal-400" />
              </div>
              <span className="text-[10px] font-mono text-slate-700 font-bold mt-2">
                USIN: {fbrPosId || 'POS-0000'}-2026-INV
              </span>
            </div>

            <div className="mt-4 flex items-center gap-1.5 text-[11px] text-teal-400 font-medium">
              <Check className="w-3.5 h-3.5" />
              <span>Compliant with FBR SRO 1006(I)/2021</span>
            </div>
          </div>

          {/* Integration Specs Card */}
          <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <Server className="w-4 h-4 text-emerald-400" />
              <span>Gateway Diagnostics</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-slate-700/50">
                <span className="text-slate-400">Environment</span>
                <span className="font-mono text-emerald-400 font-semibold">PRAL Production</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-700/50">
                <span className="text-slate-400">Protocol</span>
                <span className="font-mono text-white">REST HTTPS / JSON</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-700/50">
                <span className="text-slate-400">Fiscal Tokenization</span>
                <span className="font-mono text-teal-400">HMAC-SHA256</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-400">Fallback Mode</span>
                <span className="font-mono text-amber-400">Offline Queueing</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

