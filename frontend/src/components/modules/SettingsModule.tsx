import React, { useState } from 'react';
import {
  Building2,
  ShieldCheck,
  Receipt,
  Users,
  Save,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  RotateCcw,
  Sparkles,
  Lock,
  FileText,
  BadgeAlert,
  Info,
  Server,
  Plus,
  Trash2,
} from 'lucide-react';

type SettingsTab = 'profile' | 'tax' | 'billing' | 'roles';

export const SettingsModule: React.FC = () => {
  // STRICT DATA RULE: All input values start empty or with structural placeholders.
  // No fake keys, dummy names, or fake numbers.
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // Tab 1: Business Profile Fields
  const [businessName, setBusinessName] = useState('');
  const [headOfficeAddress, setHeadOfficeAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [logoFileName, setLogoFileName] = useState<string | null>(null);

  // Tab 2: Tax & FBR Compliance Fields
  const [ntn, setNtn] = useState('');
  const [strn, setStrn] = useState('');
  const [fbrIntegrator, setFbrIntegrator] = useState<'PRAL' | 'Private Integrator'>('PRAL');
  const [apiClientId, setApiClientId] = useState('');
  const [apiClientSecret, setApiClientSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [fbrPosId, setFbrPosId] = useState('');
  const [isFbrEnabled, setIsFbrEnabled] = useState(false); // Default: Off

  // Tab 3: Invoicing & Billing Fields
  const [currencySymbol, setCurrencySymbol] = useState('');
  const [defaultTaxRate, setDefaultTaxRate] = useState('');
  const [invoicePrefix, setInvoicePrefix] = useState('');
  const [termsAndConditions, setTermsAndConditions] = useState('');

  // Tab 4: User Roles & Permissions
  // STRICT DATA RULE: Empty roles array []
  const [roles, setRoles] = useState<any[]>([]);
  const [customRoles, setCustomRoles] = useState<any[]>([]);

  // Feedback State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('System configuration changes saved successfully.');
  };

  const handleResetToEmpty = () => {
    setBusinessName('');
    setHeadOfficeAddress('');
    setContactPhone('');
    setContactEmail('');
    setLogoFileName(null);
    setNtn('');
    setStrn('');
    setFbrIntegrator('PRAL');
    setApiClientId('');
    setApiClientSecret('');
    setShowSecret(false);
    setFbrPosId('');
    setIsFbrEnabled(false);
    setCurrencySymbol('');
    setDefaultTaxRate('');
    setInvoicePrefix('');
    setTermsAndConditions('');
    setRoles([]);
    setCustomRoles([]);
    showToast('All settings reset to empty state [].');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFileName(file.name);
      showToast(`Selected logo file: ${file.name}`);
    }
  };

  return (
    <div className="flex flex-col w-full gap-5 pb-16">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-teal-900 text-teal-50 text-xs font-semibold shadow-xl border border-teal-700/50 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-teal-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Section: Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-['Plus_Jakarta_Sans']">
              System Settings &amp; Configuration
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[10px] font-bold uppercase tracking-wider">
              Governance
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage business profile, tax compliance (FBR), user roles, and global preferences.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetToEmpty}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium transition-colors"
            title="Reset all settings to clean empty state"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          {/* Action Button: "Save Changes" (Primary) at the top right */}
          <button
            type="button"
            onClick={handleSaveChanges}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      {/* Main Section: Tabbed Layout */}
      <div className="flex flex-col lg:flex-row items-start gap-6">
        {/* Tab Navigation Menu */}
        <div className="w-full lg:w-64 shrink-0 flex flex-row lg:flex-col gap-1.5 bg-white p-2 rounded-xl border border-slate-200/90 shadow-2xs overflow-x-auto">
          {/* Tab 1: Business Profile */}
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all text-left whitespace-nowrap cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            <Building2 className={`w-4 h-4 ${activeTab === 'profile' ? 'text-white' : 'text-teal-700'}`} />
            <span>Business Profile</span>
          </button>

          {/* Tab 2: Tax & FBR Compliance */}
          <button
            type="button"
            onClick={() => setActiveTab('tax')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all text-left whitespace-nowrap cursor-pointer ${
              activeTab === 'tax'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            <ShieldCheck className={`w-4 h-4 ${activeTab === 'tax' ? 'text-white' : 'text-emerald-600'}`} />
            <div className="flex flex-col">
              <span>Tax &amp; FBR Compliance</span>
              <span className={`text-[10px] ${activeTab === 'tax' ? 'text-teal-200' : 'text-slate-400'}`}>
                Digital Invoicing
              </span>
            </div>
          </button>

          {/* Tab 3: Invoicing & Billing */}
          <button
            type="button"
            onClick={() => setActiveTab('billing')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all text-left whitespace-nowrap cursor-pointer ${
              activeTab === 'billing'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            <Receipt className={`w-4 h-4 ${activeTab === 'billing' ? 'text-white' : 'text-amber-600'}`} />
            <span>Invoicing &amp; Billing</span>
          </button>

          {/* Tab 4: User Roles & Permissions */}
          <button
            type="button"
            onClick={() => setActiveTab('roles')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all text-left whitespace-nowrap cursor-pointer ${
              activeTab === 'roles'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            <Users className={`w-4 h-4 ${activeTab === 'roles' ? 'text-white' : 'text-slate-600'}`} />
            <span>User Roles &amp; Permissions</span>
          </button>
        </div>

        {/* Tab Content Cards */}
        <div className="flex-1 w-full">
          {/* TAB 1: BUSINESS PROFILE */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden animate-in fade-in duration-150">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans'] flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-teal-700" />
                  <span>Business Profile</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  General venue enterprise identification, corporate headquarters address, and media branding.
                </p>
              </div>

              <div className="p-6 space-y-5">
                {/* Business Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="[Enter Business Name]"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                  />
                </div>

                {/* Head Office Address */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Head Office Address
                  </label>
                  <textarea
                    rows={2}
                    value={headOfficeAddress}
                    onChange={(e) => setHeadOfficeAddress(e.target.value)}
                    placeholder="[Enter Address]"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                  />
                </div>

                {/* Contact Phone & Contact Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Contact Phone
                    </label>
                    <input
                      type="text"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="[Enter Phone]"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="[Enter Email]"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                    />
                  </div>
                </div>

                {/* Business Logo File Upload Placeholder */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Business Logo
                  </label>
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-teal-600 transition-colors bg-slate-50/40">
                    <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-700 mb-2">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-semibold text-slate-800">
                      {logoFileName ? (
                        <span className="text-teal-800 font-mono">{logoFileName}</span>
                      ) : (
                        '[Upload Business Logo Placeholder]'
                      )}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                      Drag &amp; drop PNG, JPG, or SVG emblem (Max 2MB, recommended 400x120px)
                    </p>
                    <label className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium cursor-pointer transition-colors shadow-2xs">
                      <span>Choose File</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TAX & FBR COMPLIANCE (CRUCIAL) */}
          {activeTab === 'tax' && (
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden animate-in fade-in duration-150">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans'] flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Tax &amp; FBR Compliance</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Configure your Federal Board of Revenue credentials for e-invoicing.
                    </p>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border border-emerald-200 bg-emerald-50 text-emerald-800">
                    FBR POS Compliance
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Toggle Switch: "Enable FBR Digital Invoicing" (Default: Off) */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <span>Enable FBR Digital Invoicing</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          isFbrEnabled
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {isFbrEnabled ? 'ACTIVE' : 'OFF'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Transmit real-time transaction payloads to FBR fiscal servers upon booking invoice issuance.
                    </p>
                  </div>

                  {/* Toggle Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsFbrEnabled(!isFbrEnabled);
                      showToast(
                        !isFbrEnabled
                          ? 'FBR Digital Invoicing enabled.'
                          : 'FBR Digital Invoicing disabled.'
                      );
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-700/20 ${
                      isFbrEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        isFbrEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* NTN & STRN 2-col */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      NTN (National Tax Number)
                    </label>
                    <input
                      type="text"
                      value={ntn}
                      onChange={(e) => setNtn(e.target.value)}
                      placeholder="[Enter NTN]"
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      STRN (Sales Tax Registration Number)
                    </label>
                    <input
                      type="text"
                      value={strn}
                      onChange={(e) => setStrn(e.target.value)}
                      placeholder="[Enter STRN]"
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                    />
                  </div>
                </div>

                {/* FBR Integrator Dropdown & FBR POS ID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      FBR Integrator
                    </label>
                    <select
                      value={fbrIntegrator}
                      onChange={(e) =>
                        setFbrIntegrator(e.target.value as 'PRAL' | 'Private Integrator')
                      }
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                    >
                      <option value="PRAL">PRAL (Pakistan Revenue Automation Limited)</option>
                      <option value="Private Integrator">Private Integrator</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      FBR POS ID
                    </label>
                    <input
                      type="text"
                      value={fbrPosId}
                      onChange={(e) => setFbrPosId(e.target.value)}
                      placeholder="[Enter POS ID]"
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                    />
                  </div>
                </div>

                {/* API Client ID & API Client Secret */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      API Client ID
                    </label>
                    <input
                      type="text"
                      value={apiClientId}
                      onChange={(e) => setApiClientId(e.target.value)}
                      placeholder="[Enter Client ID]"
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      API Client Secret
                    </label>
                    <div className="relative">
                      <input
                        type={showSecret ? 'text' : 'password'}
                        value={apiClientSecret}
                        onChange={(e) => setApiClientSecret(e.target.value)}
                        placeholder="[Enter Secret Key]"
                        className="w-full px-3 py-2 pr-10 text-xs font-mono rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecret(!showSecret)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-teal-50/70 border border-teal-200/80 flex items-start gap-2.5 text-xs text-teal-900">
                  <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-semibold">FBR E-Invoicing Verification</span>
                    <p className="text-[11px] text-teal-800 leading-relaxed">
                      All generated guest invoices will append the FBR fiscal QR stamp and unique Invoice Reference Number (USIN) according to SRO standards.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INVOICING & BILLING */}
          {activeTab === 'billing' && (
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden animate-in fade-in duration-150">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans'] flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-amber-600" />
                  <span>Invoicing &amp; Billing</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Establish billing currency, sales tax rates, numbering scheme, and contractual terms.
                </p>
              </div>

              <div className="p-6 space-y-5">
                {/* Currency Symbol, Default Tax Rate, Invoice Prefix */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Currency Symbol */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Currency Symbol
                    </label>
                    <input
                      type="text"
                      value={currencySymbol}
                      onChange={(e) => setCurrencySymbol(e.target.value)}
                      placeholder="[e.g., PKR]"
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                    />
                  </div>

                  {/* Default Tax Rate */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Default Tax Rate
                    </label>
                    <input
                      type="text"
                      value={defaultTaxRate}
                      onChange={(e) => setDefaultTaxRate(e.target.value)}
                      placeholder="[Enter %]"
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                    />
                  </div>

                  {/* Invoice Prefix */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Invoice Prefix
                    </label>
                    <input
                      type="text"
                      value={invoicePrefix}
                      onChange={(e) => setInvoicePrefix(e.target.value)}
                      placeholder="[e.g., INV-]"
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                    />
                  </div>
                </div>

                {/* Terms & Conditions */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Terms &amp; Conditions
                  </label>
                  <textarea
                    rows={5}
                    value={termsAndConditions}
                    onChange={(e) => setTermsAndConditions(e.target.value)}
                    placeholder="[Enter standard terms and conditions for bookings, cancellation policies, food wastage clauses, and security deposit returns...]"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    This text will automatically append to all customer event agreements and invoice printouts.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: USER ROLES & PERMISSIONS */}
          {activeTab === 'roles' && (
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden animate-in fade-in duration-150">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans'] flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-700" />
                    <span>User Roles &amp; Permissions</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Role-based access matrix for Admin, Floor Staff, and Venue Managers.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    showToast('Custom role builder is ready. Connect directory to enroll custom rules.')
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-2xs cursor-pointer w-fit"
                >
                  <Plus className="w-3.5 h-3.5 text-teal-700" />
                  <span>Add Custom Role</span>
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Standard System Roles Reference Table */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800">
                      Standard System Roles Matrix
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">Fixed Architecture</span>
                  </div>

                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <tr>
                          <th className="py-2.5 px-4 w-48">Role Name</th>
                          <th className="py-2.5 px-4">Permissions</th>
                          <th className="py-2.5 px-4 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {/* Admin */}
                        <tr className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-teal-600" />
                            <span>Admin</span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                            [All Modules: Full Access • Booking Approvals • Financial Ledgers • FBR Config]
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                              System Default
                            </span>
                          </td>
                        </tr>

                        {/* Floor Staff */}
                        <tr className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-600" />
                            <span>Floor Staff</span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                            [Floor Tablet View: Read-Only Event Schemas • Extra Time Request Generator]
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                              System Default
                            </span>
                          </td>
                        </tr>

                        {/* Manager */}
                        <tr className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-600" />
                            <span>Manager</span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                            [Bookings Intake • Hall Availability Calendar • Customer CRM • Menu Package Config]
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              System Default
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Custom Roles Section (Strict Data Rule: Empty State) */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800">
                      Custom Granular Roles
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {(roles || customRoles || []).length} custom records
                    </span>
                  </div>

                  {(roles || customRoles || []).length === 0 ? (
                    <div className="p-8 rounded-xl border border-dashed border-slate-200 bg-slate-50/40 text-center flex flex-col items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                        <Users className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-700 font-['Plus_Jakarta_Sans']">
                        No custom roles configured.
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
                        Create fine-grained organizational roles for kitchen dispatch, external security teams, or outsourced stage decorators.
                      </p>
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                          <tr>
                            <th className="py-2.5 px-4">Role Name</th>
                            <th className="py-2.5 px-4">Permissions</th>
                            <th className="py-2.5 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(roles && roles.length > 0 ? roles : customRoles)?.map((role, idx) => (
                            <tr key={role?.id || idx}>
                              <td className="py-2.5 px-4 font-semibold">{role?.name || '[Role Name]'}</td>
                              <td className="py-2.5 px-4 font-mono">{role?.permissions || '[Permissions]'}</td>
                              <td className="py-2.5 px-4 text-right">
                                <button className="text-rose-600 hover:text-rose-800">Delete</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
