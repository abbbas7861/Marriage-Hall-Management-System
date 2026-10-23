import React, { useState, useEffect } from 'react';
import {
  Building,
  DoorOpen,
  Plus,
  Users,
  DollarSign,
  MapPin,
  Check,
  X,
  Edit2,
  Trash2,
  Layers,
  Sparkles,
  Snowflake,
  Car,
  Mic2,
  Zap,
  Heart,
  CheckCircle2,
  RotateCcw,
  SlidersHorizontal,
  Search,
} from 'lucide-react';
import { Hall } from '../../types';
import { hallsApi } from '../../api/client';

const AVAILABLE_FACILITIES = [
  { id: 'AC', label: 'Air Conditioning (AC)', icon: Snowflake },
  { id: 'Parking', label: 'Dedicated Parking', icon: Car },
  { id: 'Stage', label: 'Acoustic Stage & Rigging', icon: Mic2 },
  { id: 'Generator', label: 'Backup Power Generator', icon: Zap },
  { id: 'Bridal Room', label: 'Executive Bridal Suite', icon: Heart },
];

export const HallsModule: React.FC = () => {
  // STRICT DATA RULE: DO NOT hardcode any dummy data.
  // Data starts as an empty array [].
  const [halls, setHalls] = useState<Hall[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchHalls = async () => {
    setIsLoading(true);
    try {
      const data = await hallsApi.list();
      setHalls(data);
    } catch (err: any) {
      console.error('Failed to load halls from API:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHalls();
  }, []);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Under Maintenance'>('All');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHall, setEditingHall] = useState<Hall | null>(null);

  // Form Fields
  const [formHallName, setFormHallName] = useState('');
  const [formCapacity, setFormCapacity] = useState('');
  const [formBaseRent, setFormBaseRent] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formFacilities, setFormFacilities] = useState<string[]>([]);
  const [formStatus, setFormStatus] = useState<'Active' | 'Under Maintenance'>('Active');
  const [formError, setFormError] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const openCreateModal = () => {
    setEditingHall(null);
    setFormHallName('');
    setFormCapacity('');
    setFormBaseRent('');
    setFormLocation('');
    setFormFacilities([]);
    setFormStatus('Active');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (hall: Hall) => {
    setEditingHall(hall);
    setFormHallName(hall.name);
    setFormCapacity(String(hall.capacity));
    setFormBaseRent(String(hall.baseRent));
    setFormLocation(hall.locationFloor);
    setFormFacilities(hall.facilities || []);
    setFormStatus(hall.status);
    setFormError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingHall(null);
    setFormError('');
  };

  const toggleFacility = (facilityId: string) => {
    setFormFacilities((prev) =>
      prev.includes(facilityId)
        ? prev.filter((f) => f !== facilityId)
        : [...prev, facilityId]
    );
  };

  const handleSaveHall = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formHallName.trim()) {
      setFormError('Please enter a valid hall name.');
      return;
    }

    const capacityNum = parseInt(formCapacity, 10);
    if (isNaN(capacityNum) || capacityNum <= 0) {
      setFormError('Please enter a valid maximum guest capacity.');
      return;
    }

    const baseRentNum = parseFloat(formBaseRent);
    if (isNaN(baseRentNum) || baseRentNum < 0) {
      setFormError('Please enter a valid base rent amount.');
      return;
    }

    if (!formLocation.trim()) {
      setFormError('Please specify the location or floor.');
      return;
    }

    if (editingHall) {
      // Update existing hall
      hallsApi.update(editingHall.id, {
        name: formHallName.trim(),
        capacity: capacityNum,
        baseRent: baseRentNum,
        locationFloor: formLocation.trim(),
        facilities: formFacilities,
        status: formStatus,
      }).then((updated) => {
        setHalls((prev) =>
          prev.map((h) => (h.id === editingHall.id ? updated : h))
        );
        showToast(`Venue "${formHallName.trim()}" specifications updated successfully.`);
      }).catch((err: any) => {
        setFormError(err.message || 'Failed to update venue specifications.');
      });
    } else {
      // Create new hall
      hallsApi.create({
        name: formHallName.trim(),
        capacity: capacityNum,
        baseRent: baseRentNum,
        locationFloor: formLocation.trim(),
        facilities: formFacilities,
        status: formStatus,
      }).then((newHall) => {
        setHalls((prev) => [...prev, newHall]);
        showToast(`New venue "${formHallName.trim()}" configured and available for reservations.`);
      }).catch((err: any) => {
        setFormError(err.message || 'Failed to create new venue.');
      });
    }

    closeModal();
  };

  const handleDeleteHall = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove "${name}" from configured venues?`)) {
      hallsApi.delete(id).then(() => {
        setHalls((prev) => prev.filter((h) => h.id !== id));
        showToast(`Venue "${name}" removed from registry.`);
      }).catch((err: any) => {
        alert(err.message || 'Failed to delete venue.');
      });
    }
  };

  const handleResetToEmpty = () => {
    setHalls([]);
    setSearchQuery('');
    setStatusFilter('All');
    showToast('Halls registry reset to initial empty state.');
  };

  const filteredHalls = halls.filter((hall) => {
    if (statusFilter !== 'All' && hall.status !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        hall.name.toLowerCase().includes(q) ||
        hall.locationFloor.toLowerCase().includes(q) ||
        (hall.code && hall.code.toLowerCase().includes(q));
      if (!match) return false;
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
              Venue &amp; Hall Management
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-mono font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00685f]"></span>
              FACILITIES SUITE
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure hall capacities, base rents, and available facilities.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {halls.length > 0 && (
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
            <span>+ Add New Hall</span>
          </button>
        </div>
      </div>

      {/* Top Metrics Cards with structural placeholders [--] */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Configured Halls
            </span>
            <Building className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight mt-1 font-['Plus_Jakarta_Sans']">
            {halls.length === 0 ? '[--]' : halls.length}
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">
            [Registered Venues]
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Active Venues
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700 tracking-tight mt-1 font-['Plus_Jakarta_Sans']">
            {halls.length === 0 ? '[--]' : halls.filter((h) => h.status === 'Active').length}
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">
            [Ready for Booking]
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Aggregate Capacity
            </span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-blue-700 tracking-tight mt-1 font-['Plus_Jakarta_Sans']">
            {halls.length === 0 ? '[--]' : halls.reduce((acc, h) => acc + h.capacity, 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">
            [Max Guest Load]
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Avg Base Rent
            </span>
            <DollarSign className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight mt-1 font-['Plus_Jakarta_Sans']">
            {halls.length === 0
              ? '[--]'
              : `${Math.round(halls.reduce((acc, h) => acc + h.baseRent, 0) / halls.length).toLocaleString()}`}
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">
            [Standard Shift Rate]
          </span>
        </div>
      </div>

      {/* Filter and Search Bar (Active when halls > 0) */}
      {halls.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200/80 shadow-xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter halls by name or floor..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#00685f]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="All">All Operational Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Under Maintenance">Under Maintenance Only</option>
            </select>
          </div>
        </div>
      )}

      {/* Main Section: Card Grid Layout for Halls OR Large Centered Empty State */}
      {halls.length === 0 ? (
        /* Large Centered Empty State */
        <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-xs py-20 px-6 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-3xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#00685f] shadow-sm mb-4">
            <DoorOpen className="w-10 h-10 stroke-[1.5]" />
          </div>

          <h2 className="text-xl font-bold text-slate-900 font-['Plus_Jakarta_Sans'] tracking-tight">
            No halls configured. Add your first venue to start taking bookings.
          </h2>

          <p className="text-xs text-slate-500 max-w-md mt-2 leading-relaxed">
            Venue management lets you define room dimensions, maximum guest capacities, base shift rentals, and amenity provisions such as power generators and bridal suites.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00685f] hover:bg-[#00524b] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Add New Hall</span>
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-3 text-slate-400 text-xs font-mono">
            <span>halls: []</span>
            <span>•</span>
            <span>[Status: Empty Registry]</span>
          </div>
        </div>
      ) : filteredHalls.length === 0 ? (
        <div className="w-full bg-white rounded-2xl border border-slate-200/90 p-12 text-center flex flex-col items-center justify-center gap-2">
          <Building className="w-8 h-8 text-slate-300" />
          <h3 className="text-sm font-bold text-slate-700">No matching venues found</h3>
          <p className="text-xs text-slate-400">Try modifying your search or status filter.</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('All');
            }}
            className="mt-2 text-xs font-semibold text-[#00685f] hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        /* Card Grid Layout for Halls */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHalls.map((hall) => {
            const isActive = hall.status === 'Active';

            return (
              <div
                key={hall.id}
                className="group bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-teal-200 transition-all duration-200 flex flex-col overflow-hidden"
              >
                {/* Visual Banner / Placeholder Image */}
                <div className="relative h-44 bg-gradient-to-br from-slate-800 via-slate-900 to-teal-950 p-4 flex flex-col justify-between overflow-hidden">
                  {/* Subtle Background Pattern */}
                  <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]"></div>

                  {/* Top Badges */}
                  <div className="relative z-10 flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-bold px-2.5 py-1 rounded-md bg-white/10 backdrop-blur-md text-white border border-white/20">
                      [{hall.code || 'HL-01'}]
                    </span>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur-md ${
                        isActive
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isActive ? 'bg-emerald-400' : 'bg-amber-400'
                        }`}
                      ></span>
                      <span>{hall.status}</span>
                    </span>
                  </div>

                  {/* Hall Name & Location in Banner */}
                  <div className="relative z-10">
                    <h3 className="text-lg font-bold text-white tracking-tight font-['Plus_Jakarta_Sans'] group-hover:text-teal-200 transition-colors">
                      {hall.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-300 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      <span>{hall.locationFloor}</span>
                    </div>
                  </div>
                </div>

                {/* Card Content & Specifications */}
                <div className="p-5 flex flex-col gap-4 flex-1 justify-between">
                  {/* Capacity & Base Rent Row */}
                  <div className="grid grid-cols-2 gap-3 py-3 px-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-500" />
                        Max Capacity
                      </span>
                      <span className="text-base font-bold font-mono text-slate-900 mt-0.5">
                        {hall.capacity.toLocaleString()}{' '}
                        <span className="text-xs font-normal text-slate-500 font-sans">Guests</span>
                      </span>
                    </div>

                    <div className="flex flex-col border-l border-slate-200 pl-3">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-[#00685f]" />
                        Base Rent
                      </span>
                      <span className="text-base font-bold font-mono text-[#00685f] mt-0.5">
                        ${hall.baseRent.toLocaleString()}
                        <span className="text-xs font-normal text-slate-500 font-sans"> / shift</span>
                      </span>
                    </div>
                  </div>

                  {/* Facilities Badges */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Included Facilities
                    </span>
                    <div className="flex flex-wrap gap-1.5 min-h-[30px]">
                      {hall.facilities && hall.facilities.length > 0 ? (
                        hall.facilities.map((fac) => {
                          const config = AVAILABLE_FACILITIES.find((f) => f.id === fac);
                          const Icon = config ? config.icon : Sparkles;
                          return (
                            <span
                              key={fac}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 border border-teal-200/80 text-[11px] font-medium text-teal-800"
                            >
                              <Icon className="w-3 h-3 text-[#00685f]" />
                              <span>{fac}</span>
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          No specific amenities selected.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
                    <span className="text-[10px] font-mono text-slate-400">
                      ID: {hall.id.slice(-6)}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(hall)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                        title="Edit Hall Settings"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteHall(hall.id, hall.name)}
                        className="inline-flex items-center justify-center p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                        title="Delete Hall"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* "Add New Hall" / Edit Hall Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-[#00685f]">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
                    {editingHall ? 'Edit Venue / Hall' : 'Add New Hall'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Configure capacity limits, base rentals, and amenity provisions.
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

            {/* Modal Body Form */}
            <form onSubmit={handleSaveHall} className="overflow-y-auto p-6 flex flex-col gap-4 text-xs">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {formError}
                </div>
              )}

              {/* Hall Name */}
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-slate-700">
                  Hall Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formHallName}
                  onChange={(e) => setFormHallName(e.target.value)}
                  placeholder="[Enter Hall Name e.g., Grand Ballroom]"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#00685f]"
                  required
                />
              </div>

              {/* 2-Column: Max Capacity & Base Rent */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-slate-700">
                    Max Capacity (Guests) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Users className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      min="1"
                      value={formCapacity}
                      onChange={(e) => setFormCapacity(e.target.value)}
                      placeholder="[Enter Guest Capacity]"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#00685f]"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-slate-700">
                    Base Rent / Rate ($) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={formBaseRent}
                      onChange={(e) => setFormBaseRent(e.target.value)}
                      placeholder="[Enter Base Rent]"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#00685f]"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Location / Floor */}
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-slate-700">
                  Location / Floor <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="[Enter Location/Floor e.g., Ground Floor, North Wing]"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#00685f]"
                    required
                  />
                </div>
              </div>

              {/* Facilities (Checkboxes / Multi-select) */}
              <div className="flex flex-col gap-2 pt-1">
                <label className="font-semibold text-slate-700">
                  Facilities &amp; Amenities
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {AVAILABLE_FACILITIES.map((facility) => {
                    const isChecked = formFacilities.includes(facility.id);
                    const Icon = facility.icon;

                    return (
                      <label
                        key={facility.id}
                        onClick={() => toggleFacility(facility.id)}
                        className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer select-none transition-all ${
                          isChecked
                            ? 'bg-teal-50/70 border-teal-300 text-teal-900'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/70'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-3.5 h-3.5 accent-[#00685f] rounded"
                        />
                        <Icon className="w-3.5 h-3.5 text-[#00685f]" />
                        <span className="text-xs font-medium">{facility.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Status (Dropdown: Active, Under Maintenance) */}
              <div className="flex flex-col gap-1.5 pt-1">
                <label className="font-semibold text-slate-700">
                  Operational Status <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-[#00685f] cursor-pointer"
                >
                  <option value="Active">Active (Available for booking)</option>
                  <option value="Under Maintenance">Under Maintenance (Temporarily offline)</option>
                </select>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 mt-2 border-t border-slate-200 flex items-center justify-end gap-3">
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
                  <span>{editingHall ? 'Save Changes' : 'Save Hall'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
