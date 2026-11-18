import React, { useRef, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  FileCheck2,
  KeyRound,
  Save,
  Shield,
  Upload,
} from 'lucide-react';

type SettingsTab = 'profile' | 'tax' | 'security';
type FbrIntegrator = 'PRAL' | 'Private';

export const SettingsConfigurationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Tab 1: Business Profile (strictly empty initial values)
  const [businessName, setBusinessName] = useState('');
  const [headOfficeAddress, setHeadOfficeAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [logoFileName, setLogoFileName] = useState<string | null>(null);

  // Tab 2: Tax & FBR Compliance (strictly empty initial values)
  const [ntn, setNtn] = useState('');
  const [strn, setStrn] = useState('');
  const [fbrIntegrator, setFbrIntegrator] = useState<FbrIntegrator>('PRAL');
  const [apiClientId, setApiClientId] = useState('');
  const [apiClientSecret, setApiClientSecret] = useState('');
  const [enableFbrInvoicing, setEnableFbrInvoicing] = useState(false);

  // Tab 3: Security (strictly empty initial values)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleSaveChanges = () => {
    setSaveFeedback('Configuration changes saved.');
    setTimeout(() => setSaveFeedback(null), 2500);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFileName(file.name);
    }
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({
        type: 'error',
        text: 'Please fill in all password fields.',
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({
        type: 'error',
        text: 'New password and confirmation do not match.',
      });
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordMessage({
      type: 'success',
      text: 'Password updated successfully.',
    });
  };

  const tabs: Array<{
    id: SettingsTab;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      id: 'profile',
      label: 'Business Profile',
      description: 'Venue identity & contact details',
      icon: Building2,
    },
    {
      id: 'tax',
      label: 'Tax & FBR Compliance',
      description: 'NTN, STRN & digital invoicing',
      icon: FileCheck2,
    },
    {
      id: 'security',
      label: 'Security',
      description: 'Credentials & password policy',
      icon: Shield,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Section: Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-slate-900 tracking-tight">
            System Settings &amp; Configuration
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage business profile, tax compliance, and system preferences.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {saveFeedback && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {saveFeedback}
            </span>
          )}
          <button
            type="button"
            onClick={handleSaveChanges}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 hover:bg-teal-800 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>

      {/* Main Section: Vertical Tabs Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Tab Navigation */}
        <aside className="lg:col-span-4 xl:col-span-3 bg-white border border-slate-200/90 rounded-xl p-2 shadow-2xs">
          <nav className="space-y-1" aria-label="Settings sections">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-start gap-3 px-3.5 py-3 rounded-lg text-left transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-teal-50 text-teal-900'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 mt-0.5 shrink-0 ${
                      isActive ? 'text-teal-700' : 'text-slate-400'
                    }`}
                  />
                  <div className="min-w-0">
                    <div
                      className={`text-sm ${
                        isActive ? 'font-semibold text-teal-900' : 'font-medium text-slate-800'
                      }`}
                    >
                      {tab.label}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 truncate">
                      {tab.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Right Side: Content Area */}
        <section className="lg:col-span-8 xl:col-span-9 bg-white border border-slate-200/90 rounded-xl p-6 sm:p-7 shadow-2xs">
          {/* TAB 1: BUSINESS PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-slate-100">
                <h2 className="font-['Plus_Jakarta_Sans'] text-lg font-semibold text-slate-900">
                  Business Profile
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Configure your organization identity displayed on contracts and invoices.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="business-name"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Business Name
                  </label>
                  <input
                    id="business-name"
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="[Enter Business Name]"
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  />
                </div>

                <div>
                  <label
                    htmlFor="head-office-address"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Head Office Address
                  </label>
                  <textarea
                    id="head-office-address"
                    rows={3}
                    value={headOfficeAddress}
                    onChange={(e) => setHeadOfficeAddress(e.target.value)}
                    placeholder="[Enter Head Office Address]"
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="contact-phone"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Contact Phone
                    </label>
                    <input
                      id="contact-phone"
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="[Enter Contact Phone]"
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm font-mono text-slate-900 placeholder:font-sans placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-email"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Contact Email
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="[Enter Contact Email]"
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                    />
                  </div>
                </div>

                {/* Upload Business Logo Placeholder */}
                <div className="pt-2">
                  <span className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Business Logo
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full rounded-xl border-2 border-dashed border-slate-300 hover:border-teal-600/60 bg-slate-50/60 hover:bg-teal-50/30 px-6 py-8 text-center transition-colors cursor-pointer flex flex-col items-center justify-center"
                  >
                    <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center mb-3">
                      <Upload className="w-5 h-5 text-teal-700" />
                    </div>
                    <p className="text-sm font-semibold text-slate-800">
                      {logoFileName ? logoFileName : 'Upload Business Logo'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      PNG, JPG, or SVG up to 2MB
                    </p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TAX & FBR COMPLIANCE */}
          {activeTab === 'tax' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-slate-100">
                <h2 className="font-['Plus_Jakarta_Sans'] text-lg font-semibold text-slate-900">
                  Tax &amp; FBR Compliance
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Configure tax registration identifiers and FBR digital invoicing integration.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="ntn-input"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      NTN (National Tax Number)
                    </label>
                    <input
                      id="ntn-input"
                      type="text"
                      value={ntn}
                      onChange={(e) => setNtn(e.target.value)}
                      placeholder="[Enter NTN]"
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm font-mono text-slate-900 placeholder:font-sans placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="strn-input"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      STRN (Sales Tax Registration Number)
                    </label>
                    <input
                      id="strn-input"
                      type="text"
                      value={strn}
                      onChange={(e) => setStrn(e.target.value)}
                      placeholder="[Enter STRN]"
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm font-mono text-slate-900 placeholder:font-sans placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="fbr-integrator"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    FBR Integrator
                  </label>
                  <select
                    id="fbr-integrator"
                    value={fbrIntegrator}
                    onChange={(e) => setFbrIntegrator(e.target.value as FbrIntegrator)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  >
                    <option value="PRAL">PRAL</option>
                    <option value="Private">Private</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="api-client-id"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      API Client ID
                    </label>
                    <input
                      id="api-client-id"
                      type="text"
                      value={apiClientId}
                      onChange={(e) => setApiClientId(e.target.value)}
                      placeholder="[Enter API Client ID]"
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm font-mono text-slate-900 placeholder:font-sans placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="api-client-secret"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      API Client Secret
                    </label>
                    <input
                      id="api-client-secret"
                      type="password"
                      value={apiClientSecret}
                      onChange={(e) => setApiClientSecret(e.target.value)}
                      placeholder="[Enter API Client Secret]"
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                    />
                  </div>
                </div>

                {/* Modern Toggle Switch */}
                <div className="pt-3">
                  <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3.5">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Enable FBR Digital Invoicing
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Automatically sync finalized event invoices with the FBR portal.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={enableFbrInvoicing}
                      onClick={() => setEnableFbrInvoicing((prev) => !prev)}
                      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-700/30 focus:ring-offset-2 cursor-pointer ${
                        enableFbrInvoicing ? 'bg-teal-700' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform duration-200 ${
                          enableFbrInvoicing ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SECURITY */}
          {activeTab === 'security' && (
            <form onSubmit={handleUpdatePassword} className="space-y-6">
              <div className="pb-4 border-b border-slate-100">
                <h2 className="font-['Plus_Jakarta_Sans'] text-lg font-semibold text-slate-900">
                  Security
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Update your administrator account password to keep the portal secure.
                </p>
              </div>

              <div className="space-y-4 max-w-md">
                <div>
                  <label
                    htmlFor="current-password"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Current Password
                  </label>
                  <input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="[Enter Current Password]"
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  />
                </div>

                <div>
                  <label
                    htmlFor="new-password"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    New Password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="[Enter New Password]"
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Confirm New Password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="[Confirm New Password]"
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
                  />
                </div>

                {passwordMessage && (
                  <p
                    className={`text-xs font-medium ${
                      passwordMessage.type === 'success'
                        ? 'text-emerald-700'
                        : 'text-red-600'
                    }`}
                  >
                    {passwordMessage.text}
                  </p>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 hover:bg-teal-800 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4" />
                    Update Password
                  </button>
                </div>
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  );
};
