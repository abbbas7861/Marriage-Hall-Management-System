import React, { useState } from 'react';
import {
  CalendarHeart,
  Sparkles,
  Plus,
  Clock,
  Palette,
  Edit2,
  Trash2,
  X,
  Check,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Layers,
  FileText,
  Search,
} from 'lucide-react';
import { EventTypeConfig } from '../../types';

const PRESET_COLORS = [
  { name: 'Amber Gold (Mehndi)', hex: '#f59e0b' },
  { name: 'Crimson Rose (Barat)', hex: '#e11d48' },
  { name: 'Emerald Velvet (Walima)', hex: '#059669' },
  { name: 'Royal Purple (Reception)', hex: '#7c3aed' },
  { name: 'Sapphire Blue (Engagement)', hex: '#2563eb' },
  { name: 'Teal Horizon (Qawwali/Musical)', hex: '#00685f' },
];

export const EventsModule: React.FC = () => {
  // STRICT DATA RULE: DO NOT hardcode any dummy data.
  // Starts strictly as empty array []
  const [eventTypes, setEventTypes] = useState<EventTypeConfig[]>([]);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEventType, setEditingEventType] = useState<EventTypeConfig | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formStartTime, setFormStartTime] = useState('');
  const [formEndTime, setFormEndTime] = useState('');
  const [formColor, setFormColor] = useState('#00685f');
  const [formDescription, setFormDescription] = useState('');
  const [formError, setFormError] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const openCreateModal = () => {
    setEditingEventType(null);
    setFormName('');
    setFormStartTime('');
    setFormEndTime('');
    setFormColor('#00685f');
    setFormDescription('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: EventTypeConfig) => {
    setEditingEventType(item);
    setFormName(item.name);
    setFormStartTime(item.defaultStartTime);
    setFormEndTime(item.defaultEndTime);
    setFormColor(item.calendarColor || '#00685f');
    setFormDescription(item.description);
    setFormError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEventType(null);
    setFormError('');
  };

  const handleSaveEventType = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) {
      setFormError('Please enter a valid event type name.');
      return;
    }

    if (editingEventType) {
      setEventTypes((prev) =>
        prev.map((item) =>
          item.id === editingEventType.id
            ? {
                ...item,
                name: formName.trim(),
                defaultStartTime: formStartTime.trim() || '--:--',
                defaultEndTime: formEndTime.trim() || '--:--',
                calendarColor: formColor,
                description: formDescription.trim(),
              }
            : item
        )
      );
      showToast(`Event template "${formName.trim()}" updated successfully.`);
    } else {
      const newType: EventTypeConfig = {
        id: `evt-${Date.now()}`,
        name: formName.trim(),
        defaultStartTime: formStartTime.trim() || '--:--',
        defaultEndTime: formEndTime.trim() || '--:--',
        calendarColor: formColor,
        description: formDescription.trim(),
      };

      setEventTypes((prev) => [...prev, newType]);
      showToast(`New event template "${formName.trim()}" configured.`);
    }

    closeModal();
  };

  const handleDeleteEventType = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove event template "${name}"?`)) {
      setEventTypes((prev) => prev.filter((item) => item.id !== id));
      showToast(`Event template "${name}" deleted.`);
    }
  };

  const handleResetToEmpty = () => {
    setEventTypes([]);
    setSearchQuery('');
    showToast('Event templates reset to initial empty state.');
  };

  const filteredEvents = eventTypes.filter((evt) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        evt.name.toLowerCase().includes(q) ||
        evt.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex flex-col w-full gap-6 pb-12 animate-in fade-in duration-150">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-xl bg-teal-900 text-white shadow-xl flex items-center gap-2.5 text-xs font-medium animate-in slide-in-from-top-2 border border-teal-700">
          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Section (Header) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200/70">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-['Plus_Jakarta_Sans']">
              Event Types &amp; Configurations
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-mono font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00685f]"></span>
              CEREMONIAL TEMPLATES
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Define standard event templates, default timings, and calendar color codes.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {eventTypes.length > 0 && (
            <button
              type="button"
              onClick={handleResetToEmpty}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Empty</span>
            </button>
          )}

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00685f] hover:bg-[#00524b] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Add Event Type</span>
          </button>
        </div>
      </div>

      {/* Metrics Bar with structural placeholders [--] */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Event Types
            </span>
            <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight mt-1 font-['Plus_Jakarta_Sans']">
              {eventTypes.length === 0 ? '[--]' : eventTypes.length}
            </div>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
              [Ceremonial Schemas]
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-[#00685f]">
            <CalendarHeart className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Standard Shift Timings
            </span>
            <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight mt-1 font-['Plus_Jakarta_Sans']">
              {eventTypes.length === 0 ? '[--:-- - --:--]' : 'Configured'}
            </div>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
              [Shift Durations]
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Calendar Color Tags
            </span>
            <div className="text-2xl font-bold font-mono text-emerald-700 tracking-tight mt-1 font-['Plus_Jakarta_Sans']">
              {eventTypes.length === 0 ? '[--]' : `${eventTypes.length} Colors`}
            </div>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
              [Matrix Color Swatches]
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Palette className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar (Active when eventTypes > 0) */}
      {eventTypes.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200/80 shadow-xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search event type templates..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#00685f]"
            />
          </div>
        </div>
      )}

      {/* Main Section: Card Grid Layout OR Large Centered Empty State */}
      {eventTypes.length === 0 ? (
        /* Large Centered Empty State */
        <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-xs py-20 px-6 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-3xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#00685f] shadow-sm mb-4">
            <CalendarHeart className="w-10 h-10 stroke-[1.5]" />
          </div>

          <h2 className="text-xl font-bold text-slate-900 font-['Plus_Jakarta_Sans'] tracking-tight">
            No event types configured. Add an event type to standardize your bookings.
          </h2>

          <p className="text-xs text-slate-500 max-w-md mt-2 leading-relaxed">
            Standardize booking slots for Mehndi, Barat, Walima, and corporate events with default operating shift hours and visual calendar color codes.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00685f] hover:bg-[#00524b] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Add Event Type</span>
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-3 text-slate-400 text-xs font-mono">
            <span>eventTypes: []</span>
            <span>•</span>
            <span>[Status: Empty Ceremonial Registry]</span>
          </div>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="w-full bg-white rounded-2xl border border-slate-200/90 p-12 text-center flex flex-col items-center justify-center gap-2">
          <Sparkles className="w-8 h-8 text-slate-300" />
          <h3 className="text-sm font-bold text-slate-700">No matching event types found</h3>
          <p className="text-xs text-slate-400">Try modifying your search term.</p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="mt-2 text-xs font-semibold text-[#00685f] hover:underline"
          >
            Clear search
          </button>
        </div>
      ) : (
        /* Card Grid Layout for Event Types */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((evt) => (
            <div
              key={evt.id}
              className="group bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-teal-200 transition-all duration-200 flex flex-col overflow-hidden"
            >
              {/* Card Color Top Accent */}
              <div
                className="h-2 w-full transition-all"
                style={{ backgroundColor: evt.calendarColor || '#00685f' }}
              />

              {/* Card Header */}
              <div className="p-5 pb-4 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {/* Small Color Swatch */}
                    <span
                      className="w-4 h-4 rounded-full shadow-2xs border border-white/50 shrink-0"
                      style={{ backgroundColor: evt.calendarColor || '#00685f' }}
                      title={`Color: ${evt.calendarColor}`}
                    />
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight font-['Plus_Jakarta_Sans'] group-hover:text-teal-800 transition-colors">
                      {evt.name}
                    </h3>
                  </div>

                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    {evt.calendarColor ? `[${evt.calendarColor.toUpperCase()}]` : '[#HEXCODE]'}
                  </span>
                </div>

                {/* Default Timings */}
                <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-700 mt-1">
                  <Clock className="w-3.5 h-3.5 text-[#00685f] shrink-0" />
                  <span className="font-medium text-slate-500">Default Shift:</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {evt.defaultStartTime || '[--:--]'} — {evt.defaultEndTime || '[--:--]'}
                  </span>
                </div>

                {/* Description / Notes */}
                {evt.description ? (
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {evt.description}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic mt-1">
                    No specific requirements or notes entered.
                  </p>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="p-4 pt-3 mt-auto border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[10px] font-mono text-slate-400">
                  ID: {evt.id.slice(-6)}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(evt)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors cursor-pointer"
                    title="Edit Event Type"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteEventType(evt.id, evt.name)}
                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                    title="Delete Event Type"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* "Add Event Type" / Edit Modal (Simulated) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-[#00685f]">
                  <CalendarHeart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
                    {editingEventType ? 'Edit Event Type' : 'Add Event Type'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Configure event template, shift schedule, and calendar accent color.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEventType} className="overflow-y-auto p-6 flex flex-col gap-4 text-xs">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {formError}
                </div>
              )}

              {/* Event Name */}
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-slate-700">
                  Event Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="[Enter Event Name e.g., Mehndi, Barat, Walima]"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#00685f]"
                  required
                />
              </div>

              {/* Timings: Default Start Time & Default End Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-slate-700">
                    Default Start Time
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="time"
                      value={formStartTime}
                      onChange={(e) => setFormStartTime(e.target.value)}
                      placeholder="[--:--]"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-[#00685f]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-slate-700">
                    Default End Time
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="time"
                      value={formEndTime}
                      onChange={(e) => setFormEndTime(e.target.value)}
                      placeholder="[--:--]"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-[#00685f]"
                    />
                  </div>
                </div>
              </div>

              {/* Calendar Color Code */}
              <div className="flex flex-col gap-2">
                <label className="font-semibold text-slate-700">
                  Calendar Color Code
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 p-1 bg-slate-50 border border-slate-200 rounded-lg">
                    <input
                      type="color"
                      value={formColor}
                      onChange={(e) => setFormColor(e.target.value)}
                      className="w-8 h-8 rounded border-none cursor-pointer p-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={formColor}
                      onChange={(e) => setFormColor(e.target.value)}
                      placeholder="[#HEXCODE]"
                      className="w-24 px-2 py-1 text-xs font-mono uppercase bg-white border border-slate-200 rounded focus:outline-none"
                    />
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Color indicator for calendar booking matrix
                  </span>
                </div>

                {/* Quick Color Presets */}
                <div className="flex flex-wrap gap-2 mt-1">
                  {PRESET_COLORS.map((preset) => (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => setFormColor(preset.hex)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors cursor-pointer ${
                        formColor.toLowerCase() === preset.hex.toLowerCase()
                          ? 'border-slate-800 bg-slate-100 font-bold'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: preset.hex }}
                      />
                      <span>{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description / Notes */}
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-slate-700">
                  Description / Notes
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="[Enter any specific requirements for this event e.g., Traditional yellow floral setup, dance floor acoustic requirements]"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#00685f] resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#00685f] hover:bg-[#00524b] text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>{editingEventType ? 'Save Changes' : 'Save Event Type'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
