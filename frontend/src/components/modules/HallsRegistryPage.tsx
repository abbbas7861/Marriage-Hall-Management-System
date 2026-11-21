import React, { useState } from 'react';
import {
  Building,
  Building2,
  CheckCircle,
  Users,
  Plus,
  Search,
  DoorOpen,
  MapPin,
  Coins,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import { SEED_HALLS } from '../../data/seedData';

interface HallRecord {
  id: string;
  name: string;
  capacity: number;
  baseRent: number;
  location: string;
  facilities: string[];
  status: 'Active' | 'Under Maintenance';
}

const FACILITY_OPTIONS = ['AC', 'Parking', 'Stage', 'Bridal Room'] as const;

export const HallsRegistryPage: React.FC = () => {
  const [halls, setHalls] = useState<HallRecord[]>(SEED_HALLS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Under Maintenance'>('All');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formCapacity, setFormCapacity] = useState('');
  const [formBaseRent, setFormBaseRent] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formStatus, setFormStatus] = useState<'Active' | 'Under Maintenance'>('Active');
  const [formFacilities, setFormFacilities] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingId(null);
    setFormName('');
    setFormCapacity('');
    setFormBaseRent('');
    setFormLocation('');
    setFormStatus('Active');
    setFormFacilities([]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (hall: HallRecord) => {
    setEditingId(hall.id);
    setFormName(hall.name);
    setFormCapacity(String(hall.capacity));
    setFormBaseRent(String(hall.baseRent));
    setFormLocation(hall.location);
    setFormStatus(hall.status);
    setFormFacilities(hall.facilities);
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormError(null);
  };

  const toggleFacility = (facility: string) => {
    setFormFacilities((prev) =>
      prev.includes(facility)
        ? prev.filter((item) => item !== facility)
        : [...prev, facility]
    );
  };

  const handleSaveHall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Hall Name is required.');
      return;
    }
    const parsedCapacity = Number(formCapacity);
    if (!formCapacity || Number.isNaN(parsedCapacity) || parsedCapacity <= 0) {
      setFormError('Please enter a valid capacity.');
      return;
    }
    const parsedRent = Number(formBaseRent);
    if (!formBaseRent || Number.isNaN(parsedRent) || parsedRent < 0) {
      setFormError('Please enter a valid base rent.');
      return;
    }

    if (editingId) {
      setHalls((prev) =>
        prev.map((h) =>
          h.id === editingId
            ? {
                ...h,
                name: formName.trim(),
                capacity: parsedCapacity,
                baseRent: parsedRent,
                location: formLocation.trim() || '[--]',
                facilities: formFacilities,
                status: formStatus,
              }
            : h
        )
      );
    } else {
      const newHall: HallRecord = {
        id: `hall-${Date.now()}`,
        name: formName.trim(),
        capacity: parsedCapacity,
        baseRent: parsedRent,
        location: formLocation.trim() || '[--]',
        facilities: formFacilities,
        status: formStatus,
      };
      setHalls((prev) => [newHall, ...prev]);
    }

    closeModal();
  };

  const handleDeleteHall = (id: string) => {
    setHalls((prev) => prev.filter((h) => h.id !== id));
  };

  // Filtered halls
  const filteredHalls = halls.filter((hall) => {
    const matchesSearch =
      !searchQuery.trim() ||
      hall.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hall.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || hall.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // KPI Values (strictly [--] when no halls exist)
  const totalHallsValue = halls.length > 0 ? halls.length.toLocaleString('en-PK') : '[--]';
  const activeVenuesValue =
    halls.length > 0
      ? halls.filter((h) => h.status === 'Active').length.toLocaleString('en-PK')
      : '[--]';
  const totalCapacityValue =
    halls.length > 0
      ? halls.reduce((sum, h) => sum + h.capacity, 0).toLocaleString('en-PK')
      : '[--]';

  return (
    <div className="space-y-6">
      {/* Top Section: Header & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 font-['Plus_Jakarta_Sans']">
            Venue &amp; Hall Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage hall capacities, base rents, and facilities.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Hall</span>
        </button>
      </div>

      {/* KPI Metrics Bar (3 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500">Total Halls</p>
            <p className="text-2xl font-semibold text-gray-900 mt-2 font-mono tabular-nums">
              {totalHallsValue}
            </p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-200/80 text-gray-600 flex items-center justify-center shrink-0">
            <Building className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500">Active Venues</p>
            <p className="text-2xl font-semibold text-gray-900 mt-2 font-mono tabular-nums">
              {activeVenuesValue}
            </p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-200/70 text-teal-700 flex items-center justify-center shrink-0">
            <CheckCircle className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500">Total Capacity</p>
            <p className="text-2xl font-semibold text-gray-900 mt-2 font-mono tabular-nums">
              {totalCapacityValue}
            </p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-200/80 text-gray-600 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search halls..."
            className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition-colors"
          />
        </div>

        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as 'All' | 'Active' | 'Under Maintenance')
          }
          className="px-3.5 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition-colors cursor-pointer sm:w-48"
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Under Maintenance">Under Maintenance</option>
        </select>
      </div>

      {/* Main Section: Empty State or Hall Cards Grid */}
      {halls.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-20 px-6 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-200 text-gray-500 flex items-center justify-center mb-4">
            <DoorOpen className="w-7 h-7 stroke-[1.5]" />
          </div>
          <h2 className="text-base font-semibold text-gray-900">
            No halls configured yet.
          </h2>
          <p className="text-sm text-gray-500 mt-1 max-w-sm">
            Add your first venue to start taking bookings.
          </p>
          <button
            type="button"
            onClick={openAddModal}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Hall</span>
          </button>
        </div>
      ) : filteredHalls.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-14 px-6 flex flex-col items-center justify-center text-center">
          <p className="text-sm font-medium text-gray-900">No matching halls found.</p>
          <p className="text-xs text-gray-500 mt-1">
            Try adjusting your search query or status filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('All');
            }}
            className="mt-4 text-xs font-medium text-teal-700 hover:text-teal-800 underline cursor-pointer"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHalls.map((hall) => (
            <div
              key={hall.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
            >
              {/* Top Image Placeholder */}
              <div className="relative h-44 bg-gradient-to-br from-teal-50 via-teal-50/80 to-emerald-100/80 flex items-center justify-center border-b border-teal-100/70">
                <Building2 className="w-14 h-14 text-teal-600/50 stroke-[1.35]" />
                <span
                  className={`absolute top-3 right-3 px-2.5 py-1 rounded-md text-xs font-medium border shadow-2xs ${
                    hall.status === 'Active'
                      ? 'bg-white/95 text-teal-800 border-teal-200'
                      : 'bg-white/95 text-amber-800 border-amber-200'
                  }`}
                >
                  {hall.status}
                </span>
              </div>

              {/* Card Details Section */}
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-gray-900 tracking-tight truncate font-['Plus_Jakarta_Sans']">
                  {hall.name}
                </h3>

                <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="truncate">{hall.location}</span>
                </div>

                {/* Divider + Capacity & Base Rent Grid */}
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Users className="w-3.5 h-3.5 text-gray-400" />
                      <span>Capacity</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 mt-1 font-mono tabular-nums">
                      {hall.capacity.toLocaleString('en-PK')} Guests
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Coins className="w-3.5 h-3.5 text-gray-400" />
                      <span>Base Rent</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 mt-1 font-mono tabular-nums">
                      Rs. {hall.baseRent.toLocaleString('en-PK')}
                    </p>
                  </div>
                </div>

                {/* Facilities & Bottom-Right Minimal Actions */}
                <div className="mt-4 pt-3.5 border-t border-gray-100 flex items-center justify-between gap-3">
                  <p className="text-xs text-gray-500 truncate">
                    {hall.facilities.length > 0 ? hall.facilities.join(' · ') : '[--]'}
                  </p>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditModal(hall)}
                      aria-label={`Edit ${hall.name}`}
                      title="Edit Hall"
                      className="p-2 rounded-lg text-gray-400 hover:text-teal-700 hover:bg-teal-50/80 transition-colors cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteHall(hall.id)}
                      aria-label={`Delete ${hall.name}`}
                      title="Delete Hall"
                      className="p-2 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Hall Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-[1px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="hall-modal-title"
        >
          <div className="bg-white rounded-xl border border-gray-200 shadow-lg w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 id="hall-modal-title" className="text-base font-semibold text-gray-900">
                {editingId ? 'Edit Hall' : 'Add New Hall'}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close modal"
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveHall} className="p-6 space-y-4">
              {formError && (
                <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                  {formError}
                </div>
              )}

              <div>
                <label
                  htmlFor="hall-name"
                  className="block text-xs font-medium text-gray-700 mb-1.5"
                >
                  Hall Name
                </label>
                <input
                  id="hall-name"
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Enter hall name"
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="hall-capacity"
                    className="block text-xs font-medium text-gray-700 mb-1.5"
                  >
                    Capacity
                  </label>
                  <input
                    id="hall-capacity"
                    type="number"
                    min="1"
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(e.target.value)}
                    placeholder="Guests"
                    className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                  />
                </div>

                <div>
                  <label
                    htmlFor="hall-rent"
                    className="block text-xs font-medium text-gray-700 mb-1.5"
                  >
                    Base Rent (Rs.)
                  </label>
                  <input
                    id="hall-rent"
                    type="number"
                    min="0"
                    value={formBaseRent}
                    onChange={(e) => setFormBaseRent(e.target.value)}
                    placeholder="Amount"
                    className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="hall-location"
                    className="block text-xs font-medium text-gray-700 mb-1.5"
                  >
                    Location / Floor
                  </label>
                  <input
                    id="hall-location"
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="e.g. Ground Floor"
                    className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                  />
                </div>

                <div>
                  <label
                    htmlFor="hall-status"
                    className="block text-xs font-medium text-gray-700 mb-1.5"
                  >
                    Status
                  </label>
                  <select
                    id="hall-status"
                    value={formStatus}
                    onChange={(e) =>
                      setFormStatus(e.target.value as 'Active' | 'Under Maintenance')
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Under Maintenance">Under Maintenance</option>
                  </select>
                </div>
              </div>

              <div>
                <span className="block text-xs font-medium text-gray-700 mb-2">
                  Facilities
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  {FACILITY_OPTIONS.map((facility) => {
                    const checked = formFacilities.includes(facility);
                    return (
                      <label
                        key={facility}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer text-xs text-gray-700"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleFacility(facility)}
                          className="rounded border-gray-300 text-teal-700 focus:ring-teal-700/30 cursor-pointer"
                        />
                        <span>{facility}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-medium transition-colors cursor-pointer"
                >
                  {editingId ? 'Save Changes' : 'Add Hall'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
