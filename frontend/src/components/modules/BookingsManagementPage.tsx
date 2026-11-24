import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  ArrowLeft,
  X,
  Printer,
  AlertTriangle,
  CheckCircle2,
  Calculator,
  Ban,
  DollarSign,
  CalendarCheck,
  FileText,
  Check,
  ShieldAlert,
  Crown,
} from 'lucide-react';
import { SEED_BOOKINGS, SEED_HALLS, SEED_MENU_PACKAGES } from '../../data/seedData';
import { bookingsApi, hallsApi, menuApi, authApi } from '../../api/client';
import { formatTo12Hour } from '../../utils/timeFormat';
import { formatPhoneNumber, formatCNIC, isValidPhoneNumber } from '../../utils/formatters';

export interface BookingsManagementPageProps {
  onNavigateToCalendar?: () => void;
  prefillData?: {
    date?: string;
    hall?: string;
    slot?: string;
    bookingType?: string;
    customerName?: string;
    eventType?: string;
    guestCount?: string;
  } | null;
  onClearPrefill?: () => void;
}

interface BookingItem {
  id: string;
  bookingId: string;
  customerName: string;
  phone: string;
  cnic: string;
  eventType: string;
  hallName: string;
  bookingType?: 'Full Hall' | 'Half Hall (Section A)' | 'Half Hall (Section B)';
  eventDate: string;
  guestCount: string;
  personsPerTable?: number;
  seatingArrangement: string;
  includeMenuPackage?: boolean;
  menuPackage: string;
  menuRatePerHead?: number;
  dietaryInstructions: string;
  customRequests?: string;
  includeDjSound?: boolean;
  includeStageDecor?: boolean;
  startTime: string;
  endTime: string;
  extraHours: number;
  ratePerHour: number;
  hallRent?: number;
  menuAmount?: number;
  djAmount?: number;
  decorAmount?: number;
  subtotal?: number;
  discountPercentage?: number;
  discountAmount?: number;
  totalAmount: number;
  advancePayment: number;
  remainingBalance: number;
  assignedManager?: string;
  status: 'Pending' | 'Confirmed' | 'Cancelled';
  paymentStatus: 'Paid' | 'Partial' | 'Unpaid' | 'Refunded' | 'Credit Held' | 'Settled';
  cancellationRecord?: any;
}

function parseTimeToMinutes(timeStr: string): number | null {
  if (!timeStr) return null;
  const clean = timeStr.trim().toUpperCase();
  if (!clean) return null;

  try {
    if (clean.includes('AM') || clean.includes('PM')) {
      const match = clean.match(/(\d+):(\d+)\s*(AM|PM)/);
      if (match) {
        let h = parseInt(match[1], 10);
        const m = parseInt(match[2], 10);
        const p = match[3];
        if (p === 'PM' && h < 12) h += 12;
        if (p === 'AM' && h === 12) h = 0;
        return h * 60 + m;
      }
    }
    if (clean.includes(':')) {
      const parts = clean.split(':');
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) || 0;
      if (!isNaN(h)) return h * 60 + m;
    }
  } catch {
    return null;
  }
  return null;
}

function extractStartEndMinutes(timeStr: string): [number | null, number | null] {
  if (!timeStr) return [null, null];
  const normalized = timeStr.replace(/[–—]/g, '-').replace(/\s+to\s+/i, '-');
  if (normalized.includes('-')) {
    const parts = normalized.split('-');
    const s = parseTimeToMinutes(parts[0]);
    let e = parseTimeToMinutes(parts[1]);
    if (s !== null && e !== null) {
      if (e <= s) e += 24 * 60;
      return [s, e];
    }
  }

  const lower = timeStr.toLowerCase();
  if (lower.includes('morning') || lower.includes('lunch') || lower.includes('afternoon')) {
    return [12 * 60, 16 * 60];
  }
  if (lower.includes('evening') || lower.includes('dinner') || lower.includes('night')) {
    return [18 * 60, 23 * 60 + 30];
  }

  const single = parseTimeToMinutes(timeStr);
  if (single !== null) {
    return [single, Math.min(24 * 60 - 1, single + 5 * 60)];
  }

  return [null, null];
}

interface CollisionResult {
  hasConflict: boolean;
  message?: string;
  conflictingBooking?: BookingItem;
}

function detectBookingCollision(
  bookings: BookingItem[],
  hallName: string,
  eventDate: string,
  startTime: string,
  endTime: string,
  bookingType: 'Full Hall' | 'Half Hall (Section A)' | 'Half Hall (Section B)' = 'Full Hall',
  excludeId: string | null = null
): CollisionResult {
  if (!hallName || !eventDate) {
    return { hasConflict: false };
  }

  const BUFFER_MINUTES = 60; // 60-min turnover/cleaning buffer between distinct non-overlapping time slots

  let reqStart = parseTimeToMinutes(startTime);
  let reqEnd = parseTimeToMinutes(endTime);

  if (reqStart === null || reqEnd === null) {
    const [s, e] = extractStartEndMinutes(startTime);
    if (reqStart === null) reqStart = s;
    if (reqEnd === null) reqEnd = e;
  }

  // Default duration to 4 hours if only start time is provided
  if (reqStart !== null && reqEnd === null) {
    reqEnd = Math.min(24 * 60 - 1, reqStart + 4 * 60);
  }

  if (reqStart !== null && reqEnd !== null && reqEnd <= reqStart) {
    reqEnd += 24 * 60;
  }

  const candidateBookings = bookings.filter((b) => {
    if (b.status === 'Cancelled' || b.status === 'Completed') return false;
    const op = (b.status || '').toLowerCase();
    if (excludeId && b.id === excludeId) return false;
    if (b.eventDate !== eventDate) return false;
    if (b.hallName.trim().toLowerCase() !== hallName.trim().toLowerCase()) return false;
    return true;
  });

  for (const b of candidateBookings) {
    const bType = b.bookingType || 'Full Hall';

    // Partition compatibility rule:
    // Section A and Section B CAN be booked for the same time on the same day!
    // Full Hall cannot be booked if any section is booked, and vice versa.
    const isPartitionCompatible =
      (bookingType === 'Half Hall (Section A)' && bType === 'Half Hall (Section B)') ||
      (bookingType === 'Half Hall (Section B)' && bType === 'Half Hall (Section A)');

    if (isPartitionCompatible) {
      continue; // No collision between separate partitioned sections!
    }

    let bStart = parseTimeToMinutes(b.startTime);
    let bEnd = parseTimeToMinutes(b.endTime);

    if (bStart === null || bEnd === null) {
      const [s, e] = extractStartEndMinutes(b.startTime);
      if (bStart === null) bStart = s;
      if (bEnd === null) bEnd = e;
    }

    if (bStart !== null && bEnd === null) {
      bEnd = Math.min(24 * 60 - 1, bStart + 4 * 60);
    }

    if (bStart !== null && bEnd !== null && bEnd <= bStart) {
      bEnd += 24 * 60;
    }

    if (reqStart !== null && reqEnd !== null && bStart !== null && bEnd !== null) {
      const bufferedStart = Math.max(0, bStart - BUFFER_MINUTES);
      const bufferedEnd = bEnd + BUFFER_MINUTES;

      // Check whether time ranges overlap
      if (Math.max(reqStart, bufferedStart) < Math.min(reqEnd, bufferedEnd)) {
        const bookedTimeStr = `${b.startTime || 'Slot'}${b.endTime ? ` – ${b.endTime}` : ''}`;
        return {
          hasConflict: true,
          conflictingBooking: b,
          message:
            bType !== 'Full Hall' || bookingType !== 'Full Hall'
              ? `Schedule Conflict: '${hallName}' already has an active booking for '${bType}' on ${eventDate} (${bookedTimeStr}) by ${b.customerName} (${b.bookingId}). You cannot book '${bookingType}' at this overlapping time.`
              : `Schedule Conflict: Hall "${hallName}" is already booked on ${eventDate} (${bookedTimeStr}) by ${b.customerName} (${b.bookingId}). Time slots overlap.`,
        };
      }
    }
  }

  return { hasConflict: false };
}

export const BookingsManagementPage: React.FC<BookingsManagementPageProps> = ({
  onNavigateToCalendar,
  prefillData,
  onClearPrefill,
}) => {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingBooking, setViewingBooking] = useState<BookingItem | null>(null);
  const [receiptBooking, setReceiptBooking] = useState<BookingItem | null>(null);

  // Cancellation Modal & State
  const [cancellingBooking, setCancellingBooking] = useState<BookingItem | null>(null);
  const [cancellationType, setCancellationType] = useState<'refund' | 'pause_and_adjust'>('refund');
  const [cancellationReason, setCancellationReason] = useState<string>('');
  const [deductionAmount, setDeductionAmount] = useState<string>('0');
  const [cancellationNotes, setCancellationNotes] = useState<string>('');
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [cancellationNotice, setCancellationNotice] = useState<string | null>(null);

  // Viewing settled cancellation details
  const [viewingCancellationRecord, setViewingCancellationRecord] = useState<BookingItem | null>(null);

  const openCancellationModal = (item: BookingItem) => {
    setCancellingBooking(item);
    setCancellationType('refund');
    setCancellationReason('');
    setDeductionAmount('0');
    setCancellationNotes('');
    setCancellationNotice(null);
  };

  // Dynamic Halls and Menu Packages
  const [availableHalls, setAvailableHalls] = useState<
    Array<{ id: string; name: string; capacity?: number; baseRent?: number }>
  >([]);
  const [availablePackages, setAvailablePackages] = useState<
    Array<{ id: string; name: string; pricePerHead?: number }>
  >([]);

  useEffect(() => {
    bookingsApi
      .list()
      .then((data) => {
        if (Array.isArray(data)) {
          setBookings(
            data.map((b: any) => {
              const notesAndSeating = `${b.specialInstructions || ''} ${b.seatingArrangement || ''}`;
              let bType: BookingItem['bookingType'] = 'Full Hall';
              if (notesAndSeating.includes('Half Hall (Section A)') || notesAndSeating.includes('[Section A]')) {
                bType = 'Half Hall (Section A)';
              } else if (notesAndSeating.includes('Half Hall (Section B)') || notesAndSeating.includes('[Section B]')) {
                bType = 'Half Hall (Section B)';
              }

              let sTime = b.time || '';
              let eTime = '';
              if (sTime.includes('-') || sTime.includes('–')) {
                const parts = sTime.split(/[-–]/);
                sTime = parts[0]?.trim() || '';
                eTime = parts[1]?.trim() || '';
              }

              return {
                id: String(b.id),
                bookingId: b.bookingRef || `BK-${b.id}`,
                customerName: b.customerName && b.customerName !== '[--]' ? b.customerName : '',
                phone: b.contactRef && b.contactRef !== '[--]' ? b.contactRef : '',
                cnic: b.cnic && b.cnic !== '[--]' ? b.cnic : '',
                eventType: b.eventType && b.eventType !== '[--]' ? b.eventType : 'Wedding',
                hallName: b.hallName && b.hallName !== '[--]' ? b.hallName : '',
                bookingType: bType,
                eventDate: b.date || '',
                guestCount: b.guestCount && b.guestCount !== '[--]' ? String(b.guestCount) : '',
                personsPerTable: Number(b.personsPerTable) || 10,
                seatingArrangement: b.seatingArrangement && b.seatingArrangement !== '[--]' ? b.seatingArrangement : 'Round Tables',
                includeMenuPackage: !!b.menuPackage,
                menuPackage: b.menuPackage && b.menuPackage !== '[--]' ? b.menuPackage : '',
                dietaryInstructions: b.specialInstructions || '',
                customRequests: '',
                includeDjSound: Number(b.djAmount) > 0,
                includeStageDecor: Number(b.decorAmount) > 0,
                startTime: sTime || '18:00',
                endTime: eTime || (sTime ? '' : '23:00'),
                extraHours: Number(b.extraHours) || 0,
                ratePerHour: Number(b.ratePerHour) || 0,
                hallRent: Number(b.hallRent) || 0,
                menuAmount: Number(b.menuAmount) || 0,
                djAmount: Number(b.djAmount) || 0,
                decorAmount: Number(b.decorAmount) || 0,
                subtotal: Number(b.subtotal) || Number(b.amount) || 0,
                discountPercentage: Number(b.discountPercentage) || 0,
                discountAmount: Number(b.discountAmount) || 0,
                totalAmount: Number(b.amount) || 0,
                advancePayment: Number(b.advancePayment) || 0,
                remainingBalance:
                  b.status === 'Cancelled'
                    ? 0
                    : Math.max(0, (Number(b.amount) || 0) - (Number(b.advancePayment) || 0)),
                assignedManager: b.assignedManager || 'Manager',
                status:
                  b.status === 'Confirmed'
                    ? 'Confirmed'
                    : b.status === 'Cancelled'
                    ? 'Cancelled'
                    : 'Pending',
                paymentStatus:
                  b.status === 'Cancelled'
                    ? (b.paymentStatus === 'Credit Held'
                        ? 'Credit Held'
                        : b.paymentStatus === 'Refunded'
                        ? 'Refunded'
                        : 'Settled')
                    : b.paymentStatus === 'Paid'
                    ? 'Paid'
                    : b.paymentStatus === 'Partial'
                    ? 'Partial'
                    : 'Unpaid',
                cancellationRecord: b.cancellationRecord || null,
              };
            })
          );
        }
      })
      .catch((err) => console.warn('Could not load bookings from API:', err));

    hallsApi
      .list()
      .then((data) => {
        if (data && data.length > 0) {
          setAvailableHalls(
            data.map((h: any) => ({
              id: String(h.id),
              name: h.name,
              capacity: h.capacity,
              baseRent: Number(h.baseRent ?? h.base_rent) || 0,
            }))
          );
        } else {
          setAvailableHalls(
            SEED_HALLS.map((h) => ({ id: h.id, name: h.name, capacity: h.capacity, baseRent: h.baseRent || 0 }))
          );
        }
      })
      .catch(() => {
        setAvailableHalls(
          SEED_HALLS.map((h) => ({ id: h.id, name: h.name, capacity: h.capacity, baseRent: h.baseRent || 0 }))
        );
      });

    menuApi
      .list()
      .then((data) => {
        if (data && data.length > 0) {
          setAvailablePackages(
            data.map((p: any) => ({
              id: String(p.id),
              name: p.name,
              pricePerHead: p.pricePerHead,
            }))
          );
        } else {
          setAvailablePackages(
            SEED_MENU_PACKAGES.map((p) => ({
              id: p.id,
              name: p.name,
              pricePerHead: p.pricePerHead,
            }))
          );
        }
      })
      .catch(() => {
        setAvailablePackages(
          SEED_MENU_PACKAGES.map((p) => ({
            id: p.id,
            name: p.name,
            pricePerHead: p.pricePerHead,
          }))
        );
      });
  }, []);

  // Listen to calendar prefill data
  useEffect(() => {
    if (prefillData) {
      resetForm();
      if (prefillData.date) setEventDate(prefillData.date);
      if (prefillData.hall) setHallName(prefillData.hall);
      if (prefillData.bookingType) {
        setBookingType(prefillData.bookingType as any);
      }
      if (prefillData.customerName) setFullName(prefillData.customerName);
      if (prefillData.eventType) setEventType(prefillData.eventType);
      if (prefillData.guestCount) setGuestCount(prefillData.guestCount);
      if (prefillData.slot) {
        if (prefillData.slot.toLowerCase().includes('lunch')) {
          setStartTime('12:00');
          setEndTime('16:00');
        } else {
          setStartTime('18:00');
          setEndTime('23:00');
        }
      }
      setViewMode('form');
      if (onClearPrefill) {
        onClearPrefill();
      }
    }
  }, [prefillData, onClearPrefill]);

  // Filter bar state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHall, setSelectedHall] = useState('All Halls');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [cnic, setCnic] = useState('');
  const [eventType, setEventType] = useState('');
  const [hallName, setHallName] = useState('');
  const [bookingType, setBookingType] = useState<
    'Full Hall' | 'Half Hall (Section A)' | 'Half Hall (Section B)'
  >('Full Hall');
  const [eventDate, setEventDate] = useState('');
  const [guestCount, setGuestCount] = useState('');
  const [personsPerTable, setPersonsPerTable] = useState('10');
  const [seatingArrangement, setSeatingArrangement] = useState('');
  const [includeMenuPackage, setIncludeMenuPackage] = useState(true);
  const [menuPackage, setMenuPackage] = useState('');
  const [menuRatePerHead, setMenuRatePerHead] = useState<string>('');
  const [dietaryInstructions, setDietaryInstructions] = useState('');
  const [customRequests, setCustomRequests] = useState('');
  const [includeDjSound, setIncludeDjSound] = useState(false);
  const [includeStageDecor, setIncludeStageDecor] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [extraHours, setExtraHours] = useState('');
  const [ratePerHour, setRatePerHour] = useState('');
  const [hallRent, setHallRent] = useState('');
  const [menuAmount, setMenuAmount] = useState('');
  const [djAmount, setDjAmount] = useState('');
  const [decorAmount, setDecorAmount] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('0');
  const [totalAmount, setTotalAmount] = useState('');
  const [advancePayment, setAdvancePayment] = useState('');
  const [assignedManager, setAssignedManager] = useState('Manager');
  const [availableManagers, setAvailableManagers] = useState<string[]>(['Manager', 'ali', 'Operational Manager']);
  const [formError, setFormError] = useState<string | null>(null);
  const [collisionWarning, setCollisionWarning] = useState<string | null>(null);

  useEffect(() => {
    authApi
      .listUsers()
      .then((users) => {
        if (users && users.length > 0) {
          const mgrs = users
            .filter(
              (u: any) =>
                (u.role || '').toLowerCase() === 'manager' ||
                (u.role || '').toLowerCase() === 'admin'
            )
            .map((u: any) => u.fullName || u.username);
          if (mgrs.length > 0) {
            setAvailableManagers(Array.from(new Set(['Manager', ...mgrs])));
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleAssignManager = async (bookingId: string, newManager: string) => {
    try {
      await bookingsApi.update(bookingId, { assignedManager: newManager });
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, assignedManager: newManager } : b))
      );
    } catch (err) {
      console.warn('Assign manager error:', err);
    }
  };

  // Live collision detection against existing bookings and turnover margin
  useEffect(() => {
    if (!hallName || !eventDate) {
      setCollisionWarning(null);
      return;
    }

    const collision = detectBookingCollision(
      bookings,
      hallName,
      eventDate,
      startTime || '18:00',
      endTime || '23:00',
      bookingType,
      editingId
    );

    if (collision.hasConflict) {
      setCollisionWarning(
        collision.message ||
          `Schedule Conflict: Hall "${hallName}" is already reserved for this schedule.`
      );
    } else {
      setCollisionWarning(null);
      // Double check with backend endpoint
      bookingsApi
        .checkAvailability({
          hall: hallName,
          date: eventDate,
          startTime: startTime || '18:00',
          endTime: endTime || '23:00',
          bookingType,
          excludeId: editingId || undefined,
        })
        .then((res) => {
          if (res && res.available === false) {
            setCollisionWarning(
              res.conflict ||
                res.details ||
                `Conflict: Hall "${hallName}" is already booked on ${eventDate}.`
            );
          }
        })
        .catch(() => {});
    }
  }, [hallName, eventDate, startTime, endTime, bookingType, editingId, bookings]);

  const resetForm = () => {
    setEditingId(null);
    setFullName('');
    setPhone('');
    setCnic('');
    setEventType('');
    setHallName('');
    setBookingType('Full Hall');
    setEventDate('');
    setGuestCount('');
    setPersonsPerTable('10');
    setSeatingArrangement('');
    setIncludeMenuPackage(true);
    setMenuPackage('');
    setMenuRatePerHead('');
    setDietaryInstructions('');
    setCustomRequests('');
    setIncludeDjSound(false);
    setIncludeStageDecor(false);
    setStartTime('');
    setEndTime('');
    setExtraHours('');
    setRatePerHour('');
    setHallRent('');
    setMenuAmount('');
    setDjAmount('');
    setDecorAmount('');
    setDiscountPercentage('0');
    setTotalAmount('');
    setAdvancePayment('');
    setAssignedManager('Manager');
    setFormError(null);
    setCollisionWarning(null);
  };

  const openCreateForm = () => {
    if (onNavigateToCalendar) {
      onNavigateToCalendar();
    } else {
      resetForm();
      setViewMode('form');
    }
  };

  const openDirectForm = () => {
    resetForm();
    setViewMode('form');
  };

  const openEditForm = (item: BookingItem) => {
    setEditingId(item.id);
    setFullName(item.customerName === '[--]' ? '' : item.customerName);
    setPhone(item.phone === '[--]' ? '' : item.phone);
    setCnic(item.cnic === '[--]' ? '' : item.cnic);
    setEventType(item.eventType === '[--]' ? '' : item.eventType);
    setHallName(item.hallName === '[--]' ? '' : item.hallName);
    setBookingType(item.bookingType ?? 'Full Hall');
    setEventDate(item.eventDate === '[--]' ? '' : item.eventDate);
    setGuestCount(item.guestCount === '[--]' ? '' : item.guestCount);
    setPersonsPerTable(item.personsPerTable ? String(item.personsPerTable) : '10');
    setSeatingArrangement(item.seatingArrangement === '[--]' ? '' : item.seatingArrangement);
    setIncludeMenuPackage(item.includeMenuPackage ?? true);
    setMenuPackage(item.menuPackage === '[--]' ? '' : item.menuPackage);
    if (item.menuRatePerHead) {
      setMenuRatePerHead(String(item.menuRatePerHead));
    } else if (item.menuPackage) {
      const matched = availablePackages.find((p) => p.name === item.menuPackage);
      if (matched && matched.pricePerHead) {
        setMenuRatePerHead(String(matched.pricePerHead));
      } else {
        setMenuRatePerHead('');
      }
    } else {
      setMenuRatePerHead('');
    }
    setDietaryInstructions(item.dietaryInstructions);
    setCustomRequests(item.customRequests ?? '');
    setIncludeDjSound(item.includeDjSound ?? false);
    setIncludeStageDecor(item.includeStageDecor ?? false);
    setStartTime(item.startTime === '[--]' ? '' : item.startTime);
    setEndTime(item.endTime === '[--]' ? '' : item.endTime);
    setExtraHours(item.extraHours ? String(item.extraHours) : '');
    setRatePerHour(item.ratePerHour ? String(item.ratePerHour) : '');
    setHallRent(item.hallRent ? String(item.hallRent) : '');
    setMenuAmount(item.menuAmount ? String(item.menuAmount) : '');
    setDjAmount(item.djAmount ? String(item.djAmount) : (item.includeDjSound ? '25000' : ''));
    setDecorAmount(item.decorAmount ? String(item.decorAmount) : (item.includeStageDecor ? '50000' : ''));
    setDiscountPercentage(item.discountPercentage ? String(item.discountPercentage) : '0');
    setTotalAmount(item.totalAmount ? String(item.totalAmount) : '');
    setAdvancePayment(item.advancePayment ? String(item.advancePayment) : '');
    setAssignedManager(item.assignedManager || 'Manager');
    setFormError(null);
    setCollisionWarning(null);
    setViewMode('form');
  };

  // Live Itemized Calculations
  const parsedGuests = Number(guestCount) || 0;
  const parsedRatePerHead = Number(menuRatePerHead) || 0;
  const calculatedFoodCost =
    includeMenuPackage && parsedGuests > 0 && parsedRatePerHead > 0
      ? parsedGuests * parsedRatePerHead
      : 0;
  const autoMenuAmount = calculatedFoodCost;
  const effectiveMenuAmount =
    menuAmount !== '' ? Number(menuAmount) || 0 : autoMenuAmount;

  const autoHallRent = (() => {
    const matched = availableHalls.find((h) => h.name === hallName);
    return matched?.baseRent || 0;
  })();
  const effectiveHallRent =
    hallRent !== '' ? Number(hallRent) || 0 : autoHallRent;

  const effectiveDjAmount = includeDjSound
    ? (djAmount !== '' ? Number(djAmount) || 0 : 25000)
    : 0;

  const effectiveDecorAmount = includeStageDecor
    ? (decorAmount !== '' ? Number(decorAmount) || 0 : 50000)
    : 0;

  const parsedExtraHours = Number(extraHours) || 0;
  const parsedRatePerHour = Number(ratePerHour) || 0;
  const extraCharges = parsedExtraHours * parsedRatePerHour;

  // 1. Total Amount (Gross Subtotal)
  const itemizedSubtotal =
    effectiveMenuAmount +
    effectiveHallRent +
    effectiveDjAmount +
    effectiveDecorAmount +
    extraCharges;

  const subtotal = itemizedSubtotal > 0 ? itemizedSubtotal : (Number(totalAmount) || 0);

  // 2. Discount Area
  const parsedDiscountPct = Math.min(100, Math.max(0, Number(discountPercentage) || 0));
  const calculatedDiscountAmount = Math.round((subtotal * parsedDiscountPct) / 100);

  // 3. Final Amount Area
  const calculatedFinalAmount = Math.max(0, subtotal - calculatedDiscountAmount);
  const grandTotal = calculatedFinalAmount;
  const finalAmount = calculatedFinalAmount;

  // 4. Advance Area
  const parsedAdvance = Number(advancePayment) || 0;

  // 5. Remaining Balance
  const remainingBalance = Math.max(0, calculatedFinalAmount - parsedAdvance);

  const hasAmountInput =
    subtotal > 0 ||
    advancePayment.trim() !== '' ||
    totalAmount.trim() !== '';

  const persistBooking = (): BookingItem | null => {
    if (!fullName.trim()) {
      setFormError('Customer Full Name is required.');
      return null;
    }

    const defaultHall = availableHalls[0]?.name || 'Grand Crystal Ballroom';
    const chosenHall = hallName || defaultHall;
    const chosenDate = eventDate || new Date().toISOString().split('T')[0];

    // Enforce Double-Booking & Turnover Margin Prevention
    if (collisionWarning) {
      setFormError(collisionWarning);
      return null;
    }

    const collisionCheck = detectBookingCollision(
      bookings,
      chosenHall,
      chosenDate,
      startTime || '18:00',
      endTime || '23:00',
      bookingType,
      editingId
    );
    if (collisionCheck.hasConflict) {
      const msg =
        collisionCheck.message ||
        `Cannot save: Hall "${chosenHall}" is already booked on ${chosenDate} for this time slot.`;
      setCollisionWarning(msg);
      setFormError(msg);
      return null;
    }

    const derivedPaymentStatus: BookingItem['paymentStatus'] =
      grandTotal > 0 && remainingBalance === 0
        ? 'Paid'
        : parsedAdvance > 0
        ? 'Partial'
        : 'Unpaid';

    const effectiveTime =
      startTime && endTime ? `${startTime} - ${endTime}` : startTime || '18:00 - 23:00';
    const effectiveSlot = startTime
      ? Number(startTime.split(':')[0]) < 17
        ? 'Lunch'
        : 'Dinner'
      : 'Evening';

    const apiPayload = {
      customerName: fullName.trim(),
      contactRef: phone.trim(),
      cnic: cnic.trim(),
      eventType: eventType || 'Wedding',
      hallName: chosenHall,
      date: chosenDate,
      time: effectiveTime,
      slot: effectiveSlot,
      guestCount: Number(guestCount) || 100,
      personsPerTable: Number(personsPerTable) || 10,
      seatingArrangement:
        bookingType !== 'Full Hall'
          ? `${seatingArrangement.trim()} [${bookingType}]`.trim()
          : seatingArrangement.trim(),
      menuPackage: includeMenuPackage
        ? menuPackage
          ? menuRatePerHead
            ? `${menuPackage} (Rs. ${menuRatePerHead}/head)`
            : menuPackage
          : menuRatePerHead
          ? `Custom Menu (Rs. ${menuRatePerHead}/head)`
          : 'Package Selected'
        : '',
      specialInstructions: (
        (bookingType !== 'Full Hall' ? `[${bookingType}] ` : '') +
        dietaryInstructions.trim() +
        (customRequests ? ` | ${customRequests.trim()}` : '')
      ).trim(),
      amount: calculatedFinalAmount,
      advancePayment: parsedAdvance,
      hallRent: effectiveHallRent,
      menuAmount: effectiveMenuAmount,
      djAmount: effectiveDjAmount,
      decorAmount: effectiveDecorAmount,
      subtotal: subtotal,
      discountPercentage: parsedDiscountPct,
      discountAmount: calculatedDiscountAmount,
      extraHours: parsedExtraHours,
      ratePerHour: parsedRatePerHour,
      assignedManager: assignedManager || 'Manager',
      status: parsedAdvance > 0 ? 'Confirmed' : 'Pending',
      paymentStatus: derivedPaymentStatus,
    };

    if (editingId) {
      bookingsApi
        .update(editingId, apiPayload)
        .catch((err) => console.warn('API booking update error:', err));

      let updatedRecord: BookingItem | null = null;
      setBookings((prev) =>
        prev.map((b) => {
          if (b.id !== editingId) return b;
          updatedRecord = {
            ...b,
            customerName: fullName.trim(),
            phone: phone.trim(),
            cnic: cnic.trim(),
            eventType: eventType || 'Wedding',
            hallName: chosenHall,
            bookingType,
            eventDate: chosenDate,
            guestCount: guestCount || '100',
            personsPerTable: Number(personsPerTable) || 10,
            seatingArrangement: seatingArrangement.trim(),
            includeMenuPackage,
            menuPackage: includeMenuPackage ? menuPackage : 'Customer Own',
            dietaryInstructions: dietaryInstructions.trim(),
            customRequests: customRequests.trim(),
            includeDjSound,
            includeStageDecor,
            startTime: startTime || '18:00',
            endTime: endTime || '23:00',
            extraHours: parsedExtraHours,
            ratePerHour: parsedRatePerHour,
            hallRent: effectiveHallRent,
            menuAmount: effectiveMenuAmount,
            djAmount: effectiveDjAmount,
            decorAmount: effectiveDecorAmount,
            subtotal: subtotal,
            discountPercentage: parsedDiscountPct,
            discountAmount: calculatedDiscountAmount,
            totalAmount: grandTotal,
            advancePayment: parsedAdvance,
            remainingBalance,
            assignedManager: assignedManager || 'Manager',
            paymentStatus: derivedPaymentStatus,
          };
          return updatedRecord;
        })
      );
      return (
        updatedRecord ?? {
          id: editingId,
          bookingId: bookings.find((b) => b.id === editingId)?.bookingId || `BK-${editingId}`,
          customerName: fullName.trim(),
          phone: phone.trim(),
          cnic: cnic.trim(),
          eventType: eventType || 'Wedding',
          hallName: chosenHall,
          bookingType,
          eventDate: chosenDate,
          guestCount: guestCount || '100',
          personsPerTable: Number(personsPerTable) || 10,
          seatingArrangement: seatingArrangement.trim(),
          includeMenuPackage,
          menuPackage: includeMenuPackage ? menuPackage : 'Customer Own',
          dietaryInstructions: dietaryInstructions.trim(),
          customRequests: customRequests.trim(),
          includeDjSound,
          includeStageDecor,
          startTime: startTime || '18:00',
          endTime: endTime || '23:00',
          extraHours: parsedExtraHours,
          ratePerHour: parsedRatePerHour,
          hallRent: effectiveHallRent,
          menuAmount: effectiveMenuAmount,
          djAmount: effectiveDjAmount,
          decorAmount: effectiveDecorAmount,
          subtotal: subtotal,
          discountPercentage: parsedDiscountPct,
          discountAmount: calculatedDiscountAmount,
          totalAmount: grandTotal,
          advancePayment: parsedAdvance,
          remainingBalance,
          status: bookings.find((b) => b.id === editingId)?.status || 'Pending',
          paymentStatus: derivedPaymentStatus,
        }
      );
    }

    const nextIndex = bookings.length + 1;
    const tempId = `bk-${Date.now()}`;
    const newBooking: BookingItem = {
      id: tempId,
      bookingId: `BK-${String(nextIndex).padStart(4, '0')}`,
      customerName: fullName.trim(),
      phone: phone.trim(),
      cnic: cnic.trim(),
      eventType: eventType || 'Wedding',
      hallName: chosenHall,
      bookingType,
      eventDate: chosenDate,
      guestCount: guestCount || '100',
      personsPerTable: Number(personsPerTable) || 10,
      seatingArrangement: seatingArrangement.trim(),
      includeMenuPackage,
      menuPackage: includeMenuPackage ? menuPackage : 'Customer Own',
      dietaryInstructions: dietaryInstructions.trim(),
      customRequests: customRequests.trim(),
      includeDjSound,
      includeStageDecor,
      startTime: startTime || '18:00',
      endTime: endTime || '23:00',
      extraHours: parsedExtraHours,
      ratePerHour: parsedRatePerHour,
      hallRent: effectiveHallRent,
      menuAmount: effectiveMenuAmount,
      djAmount: effectiveDjAmount,
      decorAmount: effectiveDecorAmount,
      subtotal: subtotal,
      discountPercentage: parsedDiscountPct,
      discountAmount: calculatedDiscountAmount,
      totalAmount: grandTotal,
      advancePayment: parsedAdvance,
      remainingBalance,
      assignedManager: assignedManager || 'Manager',
      status: parsedAdvance > 0 ? 'Confirmed' : 'Pending',
      paymentStatus: derivedPaymentStatus,
    };
    setBookings((prev) => [newBooking, ...prev]);

    bookingsApi
      .create(apiPayload)
      .then((res: any) => {
        if (res && res.id) {
          setBookings((prev) =>
            prev.map((b) =>
              b.id === tempId
                ? {
                    ...b,
                    id: String(res.id),
                    bookingId: res.bookingRef || b.bookingId,
                  }
                : b
            )
          );
        }
      })
      .catch((err) => console.warn('API booking create error:', err));

    return newBooking;
  };

  const handleSaveBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const saved = persistBooking();
    if (!saved) return;
    resetForm();
    setViewMode('list');
  };

  const handleSaveAndPrintReceipt = () => {
    const saved = persistBooking();
    if (!saved) return;
    resetForm();
    setViewMode('list');
    setReceiptBooking(saved);
  };

  const handleDeleteBooking = (id: string) => {
    bookingsApi.delete(id).catch((err) => console.warn('API booking delete error:', err));
    setBookings((prev) => prev.filter((b) => b.id !== id));
    if (viewingBooking?.id === id) setViewingBooking(null);
  };

  const handleConfirmCancellation = async () => {
    if (!cancellingBooking) return;
    const reason = cancellationReason.trim();
    if (!reason) {
      alert('Please enter an emergency cancellation reason.');
      return;
    }
    const deduction = Math.max(0, parseFloat(deductionAmount) || 0);
    if (deduction > cancellingBooking.advancePayment) {
      alert(
        `Amount used / deduction (Rs. ${deduction.toLocaleString()}) cannot exceed the collected advance payment (Rs. ${cancellingBooking.advancePayment.toLocaleString()}).`
      );
      return;
    }

    setIsCancelling(true);
    try {
      const res = await bookingsApi.cancel(cancellingBooking.id, {
        cancellation_type: cancellationType,
        reason,
        deduction_amount: deduction,
        notes: cancellationNotes.trim(),
      });

      const netAmount = Math.max(0, cancellingBooking.advancePayment - deduction);
      const cancellationData = res?.cancellation || {
        cancellation_type: cancellationType,
        type_label:
          cancellationType === 'pause_and_adjust'
            ? 'Paused for Future Adjustment'
            : 'Client Refund Processed',
        reason,
        advance_paid: cancellingBooking.advancePayment,
        deduction_amount: deduction,
        net_amount: netAmount,
        refund_amount: cancellationType === 'refund' ? netAmount : 0,
        retained_credit: cancellationType === 'pause_and_adjust' ? netAmount : 0,
        freed_date: cancellingBooking.eventDate,
        freed_hall: cancellingBooking.hallName,
      };

      // Update state - retain original booked amount and paid advance for audit integrity
      setBookings((prev) =>
        prev.map((b) =>
          b.id === cancellingBooking.id
            ? {
                ...b,
                status: 'Cancelled',
                totalAmount: Number(res?.booking?.amount) || b.totalAmount,
                advancePayment: Number(res?.booking?.advancePayment) || b.advancePayment,
                remainingBalance: 0,
                paymentStatus: cancellationType === 'pause_and_adjust' ? 'Credit Held' : 'Refunded',
                cancellationRecord: cancellationData,
              }
            : b
        )
      );

      // Notify window for real-time calendar and dashboard availability release
      window.dispatchEvent(
        new CustomEvent('booking_cancelled', {
          detail: {
            bookingId: cancellingBooking.id,
            freedDate: cancellingBooking.eventDate,
            freedHall: cancellingBooking.hallName,
          },
        })
      );

      setCancellationNotice(
        res?.message ||
          `Booking ${cancellingBooking.bookingId} cancelled. Hall '${cancellingBooking.hallName}' on ${cancellingBooking.eventDate} is now open for new bookings.`
      );

      setTimeout(() => {
        setCancellationNotice(null);
        setCancellingBooking(null);
        setCancellationReason('');
        setDeductionAmount('0');
        setCancellationNotes('');
      }, 2500);
    } catch (err: any) {
      console.error('Cancellation error:', err);
      alert(err?.message || 'Failed to cancel booking. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        b.customerName.toLowerCase().includes(q) ||
        b.bookingId.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (selectedHall !== 'All Halls' && b.hallName !== selectedHall) {
      return false;
    }
    if (selectedStatus !== 'All' && b.status !== selectedStatus) {
      return false;
    }
    if (startDate && b.eventDate && b.eventDate < startDate) {
      return false;
    }
    if (endDate && b.eventDate && b.eventDate > endDate) {
      return false;
    }
    return true;
  });

  const getStatusClass = (status: BookingItem['status']) => {
    if (status === 'Confirmed') return 'bg-teal-50 text-teal-800 border-teal-200';
    if (status === 'Cancelled') return 'bg-red-50 text-red-700 border-red-200';
    return 'bg-amber-50 text-amber-800 border-amber-200';
  };

  const getPaymentClass = (status: BookingItem['paymentStatus']) => {
    if (status === 'Paid') return 'bg-teal-50 text-teal-800 border-teal-200';
    if (status === 'Partial') return 'bg-amber-50 text-amber-800 border-amber-200';
    if (status === 'Refunded') return 'bg-slate-100 text-slate-700 border-slate-300';
    if (status === 'Credit Held') return 'bg-sky-50 text-sky-800 border-sky-200';
    if (status === 'Settled') return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  if (viewMode === 'form') {
    return (
      <div className="space-y-6">
        {/* Form Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setViewMode('list');
              }}
              aria-label="Back to bookings list"
              className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900 font-['Plus_Jakarta_Sans']">
                {editingId ? 'Edit Booking' : 'Create New Booking'}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Complete the sections below to record a hall reservation.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveBooking} className="space-y-6">
          {formError && (
            <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {formError}
            </div>
          )}

          {/* Section 1: Customer Information */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 pb-4 border-b border-gray-100">
              1. Customer Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
              <div>
                <label
                  htmlFor="booking-fullname"
                  className="block text-xs font-medium text-gray-700 mb-1.5"
                >
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="booking-fullname"
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  placeholder="e.g. Tariq Mehmood"
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
              </div>

              <div>
                <label
                  htmlFor="booking-phone"
                  className="block text-xs font-medium text-gray-700 mb-1.5"
                >
                  Phone (Must start with 03, max 11 digits)
                </label>
                <input
                  id="booking-phone"
                  type="tel"
                  maxLength={11}
                  value={phone}
                  onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                  placeholder="03XXXXXXXXX"
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm font-mono text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
              </div>

              <div>
                <label
                  htmlFor="booking-cnic"
                  className="block text-xs font-medium text-gray-700 mb-1.5"
                >
                  CNIC (13 digits, auto dashes)
                </label>
                <input
                  id="booking-cnic"
                  type="text"
                  maxLength={15}
                  value={cnic}
                  onChange={(e) => setCnic(formatCNIC(e.target.value))}
                  placeholder="XXXXX-XXXXXXX-X"
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm font-mono text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
              </div>

              <div>
                <label
                  htmlFor="booking-assigned-manager"
                  className="block text-xs font-medium text-gray-700 mb-1.5"
                >
                  Supervising Manager
                </label>
                <select
                  id="booking-assigned-manager"
                  value={assignedManager}
                  onChange={(e) => setAssignedManager(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 cursor-pointer"
                >
                  {availableManagers.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Section 2: Event & Venue Details */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 pb-4 border-b border-gray-100">
              2. Event &amp; Venue Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
              <div>
                <label
                  htmlFor="booking-event-type"
                  className="block text-xs font-medium text-gray-700 mb-1.5"
                >
                  Event Type
                </label>
                <select
                  id="booking-event-type"
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 cursor-pointer"
                >
                  <option value="">Select Event Type</option>
                  <option value="Mehndi">Mehndi</option>
                  <option value="Barat">Barat</option>
                  <option value="Walima">Walima</option>
                  <option value="Corporate / Other">Corporate / Other</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="booking-hall"
                  className="block text-xs font-medium text-gray-700 mb-1.5"
                >
                  Hall Selection
                </label>
                <select
                  id="booking-hall"
                  value={hallName}
                  onChange={(e) => {
                    const chosen = e.target.value;
                    setHallName(chosen);
                    const matched = availableHalls.find((h) => h.name === chosen);
                    if (matched && matched.baseRent) {
                      setHallRent(String(matched.baseRent));
                    }
                  }}
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 cursor-pointer"
                >
                  <option value="">Select Hall</option>
                  {availableHalls.map((h) => (
                    <option key={h.id} value={h.name}>
                      {h.name} {h.capacity ? `(Capacity: ${h.capacity})` : ''}
                    </option>
                  ))}
                  {hallName && !availableHalls.some((h) => h.name === hallName) && (
                    <option value={hallName}>{hallName}</option>
                  )}
                </select>
              </div>

              <div>
                <label
                  htmlFor="booking-type"
                  className="block text-xs font-medium text-gray-700 mb-1.5"
                >
                  Booking Type <span className="text-red-600">*</span>
                </label>
                <select
                  id="booking-type"
                  required
                  value={bookingType}
                  onChange={(e) =>
                    setBookingType(
                      e.target.value as
                        | 'Full Hall'
                        | 'Half Hall (Section A)'
                        | 'Half Hall (Section B)'
                    )
                  }
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 cursor-pointer"
                >
                  <option value="Full Hall">Full Hall</option>
                  <option value="Half Hall (Section A)">Half Hall (Section A)</option>
                  <option value="Half Hall (Section B)">Half Hall (Section B)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">

              <div>
                <label
                  htmlFor="booking-date"
                  className="block text-xs font-medium text-gray-700 mb-1.5"
                >
                  Event Date
                </label>
                <input
                  id="booking-date"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
              </div>

              <div>
                <label
                  htmlFor="booking-guests"
                  className="block text-xs font-medium text-gray-700 mb-1.5"
                >
                  Guest Count
                </label>
                <input
                  id="booking-guests"
                  type="number"
                  min="1"
                  value={guestCount}
                  onChange={(e) => setGuestCount(e.target.value)}
                  placeholder="e.g. 450"
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
              </div>

              <div>
                <label
                  htmlFor="booking-persons-per-table"
                  className="block text-xs font-medium text-gray-700 mb-1.5"
                >
                  Persons per Table
                </label>
                <select
                  id="booking-persons-per-table"
                  value={personsPerTable}
                  onChange={(e) => setPersonsPerTable(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 cursor-pointer"
                >
                  <option value="6">6 Persons per Table</option>
                  <option value="8">8 Persons per Table</option>
                  <option value="10">10 Persons per Table</option>
                  <option value="12">12 Persons per Table</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="booking-seating"
                  className="block text-xs font-medium text-gray-700 mb-1.5"
                >
                  Seating Arrangement
                </label>
                <input
                  id="booking-seating"
                  type="text"
                  value={seatingArrangement}
                  onChange={(e) => setSeatingArrangement(e.target.value)}
                  placeholder="e.g. Round tables with VIP stage setup"
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
              </div>

              {/* Live Exact Table Count Requirement Banner */}
              {guestCount && Number(guestCount) > 0 && (
                <div className="md:col-span-2 rounded-lg border border-teal-200 bg-teal-50/70 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                    <span className="text-xs font-semibold text-teal-900">
                      Exact Tables Required:
                    </span>
                    <span className="text-xs font-bold text-teal-800 font-mono">
                      {Math.ceil(Number(guestCount) / (Number(personsPerTable) || 10))} Tables
                    </span>
                  </div>
                  <span className="text-[11px] text-teal-700 font-medium">
                    {guestCount} guests @ {personsPerTable} persons/table
                  </span>
                </div>
              )}
            </div>

            {/* Additional Services Sub-section */}
            <div className="mt-5 pt-5 border-t border-gray-100">
              <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">
                Additional Services
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="flex items-center justify-between p-3.5 rounded-lg border border-gray-200 bg-gray-50/50 hover:border-teal-700/40 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={includeDjSound}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setIncludeDjSound(isChecked);
                        if (isChecked && (!djAmount || djAmount === '0')) {
                          setDjAmount('25000');
                        } else if (!isChecked) {
                          setDjAmount('0');
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-teal-700 focus:ring-teal-700/20 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-gray-800">
                      Include DJ &amp; Sound System
                    </span>
                  </div>
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-lg border border-gray-200 bg-gray-50/50 hover:border-teal-700/40 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={includeStageDecor}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setIncludeStageDecor(isChecked);
                        if (isChecked && (!decorAmount || decorAmount === '0')) {
                          setDecorAmount('50000');
                        } else if (!isChecked) {
                          setDecorAmount('0');
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-teal-700 focus:ring-teal-700/20 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-gray-800">
                      Include Stage/Decor Services
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Real-time Schedule Conflict / Availability Status */}
            {collisionWarning ? (
              <div className="mt-5 rounded-xl border border-rose-300 bg-rose-50/95 p-4 text-rose-900 shadow-2xs">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800">
                      Booking Collision Detected (Double-Booking Prevented)
                    </h4>
                    <p className="mt-1 text-xs text-rose-700 leading-relaxed font-medium">
                      {collisionWarning}
                    </p>
                    <p className="mt-1.5 text-[11px] text-rose-600">
                      Note: Bookings require at least a 1-hour turnover buffer before and after for hall cleaning &amp; preparation.
                    </p>
                  </div>
                </div>
              </div>
            ) : hallName && eventDate ? (
              <div className="mt-5 rounded-xl border border-teal-200 bg-teal-50/60 px-4 py-2.5 text-xs text-teal-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span>
                  <strong>{hallName}</strong> is open on <strong>{eventDate}</strong> with required 1-hour margin buffer.
                </span>
              </div>
            ) : null}
          </section>

          {/* Section 3: Menu & Catering */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">
                3. Menu &amp; Catering
              </h2>
              <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                <span className="text-xs font-medium text-gray-700">
                  Include Hall Menu Package
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={includeMenuPackage}
                  onClick={() => {
                    const next = !includeMenuPackage;
                    setIncludeMenuPackage(next);
                    if (!next) {
                      setMenuPackage('');
                      setMenuRatePerHead('');
                    }
                  }}
                  className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-700/20 ${
                    includeMenuPackage ? 'bg-teal-700' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      includeMenuPackage ? 'translate-x-4.5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              {includeMenuPackage ? (
                <>
                  <div>
                    <label
                      htmlFor="booking-menu"
                      className="block text-xs font-medium text-gray-700 mb-1.5"
                    >
                      Menu Package
                    </label>
                    <select
                      id="booking-menu"
                      value={menuPackage}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMenuPackage(val);
                        const matched = availablePackages.find((p) => p.name === val);
                        if (matched && matched.pricePerHead) {
                          setMenuRatePerHead(String(matched.pricePerHead));
                        }
                      }}
                      className="w-full px-3.5 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 cursor-pointer"
                    >
                      <option value="">Select Menu Package</option>
                      {availablePackages.map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name} {p.pricePerHead ? `- Rs. ${p.pricePerHead.toLocaleString('en-PK')}/head` : ''}
                        </option>
                      ))}
                      {menuPackage && !availablePackages.some((p) => p.name === menuPackage) && (
                        <option value={menuPackage}>{menuPackage}</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="booking-menu-rate"
                      className="block text-xs font-medium text-gray-700 mb-1.5"
                    >
                      Menu Price Per Head (Rs.)
                    </label>
                    <input
                      id="booking-menu-rate"
                      type="number"
                      min="0"
                      value={menuRatePerHead}
                      onChange={(e) => setMenuRatePerHead(e.target.value)}
                      placeholder="e.g. 2500"
                      className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 font-mono tabular-nums"
                    />
                  </div>

                  {/* Real-time Calculated Food Cost Card */}
                  <div className="md:col-span-2 rounded-xl border border-teal-200 bg-gradient-to-r from-teal-50/90 via-emerald-50/80 to-teal-50/90 p-4.5 text-slate-900 shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800">
                            <Calculator className="w-3.5 h-3.5" />
                            Live Food &amp; Catering Calculator
                          </span>
                          <span className="text-xs font-semibold text-teal-700">Food Cost Only</span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-baseline gap-2.5">
                          <span className="text-2xl sm:text-3xl font-extrabold font-mono text-teal-900 tabular-nums">
                            Rs. {calculatedFoodCost.toLocaleString('en-PK')}
                          </span>
                          {parsedGuests > 0 && parsedRatePerHead > 0 ? (
                            <span className="text-xs font-medium text-teal-800 bg-teal-100/60 px-2 py-0.5 rounded">
                              ({parsedGuests.toLocaleString('en-PK')} guests &times; Rs. {parsedRatePerHead.toLocaleString('en-PK')} / head)
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500">
                              {parsedGuests === 0 && parsedRatePerHead === 0
                                ? '(Enter guest count and menu rate above to see live food cost)'
                                : parsedGuests === 0
                                ? `(Enter guest count in Event Details above &bull; Rs. ${parsedRatePerHead.toLocaleString('en-PK')}/head)`
                                : `(${parsedGuests} guests &bull; Enter price per head above)`}
                            </span>
                          )}
                        </div>
                      </div>

                      {calculatedFoodCost > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setTotalAmount(String(calculatedFoodCost));
                            if (formError) setFormError(null);
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer self-start sm:self-auto shrink-0"
                          title="Click to copy this food cost into Total Booking Amount"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Use as Booking Total</span>
                        </button>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="md:col-span-2 rounded-lg border border-dashed border-gray-200 bg-gray-50/70 px-4 py-3 text-xs text-gray-500">
                  Hall menu package is disabled. Customer will arrange their own catering.
                </div>
              )}

              <div className="md:col-span-2">
                <label
                  htmlFor="booking-dietary"
                  className="block text-xs font-medium text-gray-700 mb-1.5"
                >
                  Special Dietary Instructions
                </label>
                <textarea
                  id="booking-dietary"
                  rows={2}
                  value={dietaryInstructions}
                  onChange={(e) => setDietaryInstructions(e.target.value)}
                  placeholder="e.g. Sugar-free dessert table, spicy roast, halal certified"
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 resize-none"
                />
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="booking-custom-requests"
                  className="block text-xs font-medium text-gray-700 mb-1.5"
                >
                  Special Custom Requests / Add-ons
                </label>
                <textarea
                  id="booking-custom-requests"
                  rows={3}
                  value={customRequests}
                  onChange={(e) => setCustomRequests(e.target.value)}
                  placeholder="e.g., Need 50 extra chairs, special VIP sofa for stage, sugar-free desserts, etc."
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 resize-none"
                />
              </div>
            </div>
          </section>

          {/* Section 4: Timing & Extra Time */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 pb-4 border-b border-gray-100">
              4. Timing &amp; Extra Time
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              <div>
                <label
                  htmlFor="booking-start-time"
                  className="block text-xs font-medium text-gray-700 mb-1.5"
                >
                  Start Time
                </label>
                <input
                  id="booking-start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
                {startTime && (
                  <span className="block mt-1 text-xs text-teal-700 font-mono font-medium">
                    {formatTo12Hour(startTime)}
                  </span>
                )}
              </div>

              <div>
                <label
                  htmlFor="booking-end-time"
                  className="block text-xs font-medium text-gray-700 mb-1.5"
                >
                  End Time
                </label>
                <input
                  id="booking-end-time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
                {endTime && (
                  <span className="block mt-1 text-xs text-teal-700 font-mono font-medium">
                    {formatTo12Hour(endTime)}
                  </span>
                )}
              </div>

              <div>
                <label
                  htmlFor="booking-extra-hours"
                  className="block text-xs font-medium text-gray-700 mb-1.5"
                >
                  Extra Hours
                </label>
                <input
                  id="booking-extra-hours"
                  type="number"
                  min="0"
                  value={extraHours}
                  onChange={(e) => setExtraHours(e.target.value)}
                  placeholder="0"
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
              </div>

              <div>
                <label
                  htmlFor="booking-rate-hour"
                  className="block text-xs font-medium text-gray-700 mb-1.5"
                >
                  Rate per Hour
                </label>
                <input
                  id="booking-rate-hour"
                  type="number"
                  min="0"
                  value={ratePerHour}
                  onChange={(e) => setRatePerHour(e.target.value)}
                  placeholder="e.g. 15000"
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
              </div>
            </div>
          </section>

          {/* Section 5: Payment Summary & Itemized Breakdown */}
          <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 font-['Plus_Jakarta_Sans']">
                  5. Payment &amp; Pricing Breakdown
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Itemized pricing components: hall rent, menu, DJ, decor, total subtotal, discount, final amount, and advance.
                </p>
              </div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                Live Auto-Calculating
              </span>
            </div>

            {/* 4 Line Items: Menu, Hall Rent, DJ, Decor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Menu Total Amount */}
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="booking-menu-amount" className="block text-xs font-semibold text-gray-700">
                    Menu Total Amount
                  </label>
                  <span className="text-[10px] text-teal-700 font-medium">Catering</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-gray-400 font-mono">Rs.</span>
                  <input
                    id="booking-menu-amount"
                    type="number"
                    min="0"
                    value={menuAmount !== '' ? menuAmount : (autoMenuAmount > 0 ? String(autoMenuAmount) : '')}
                    onChange={(e) => setMenuAmount(e.target.value)}
                    placeholder={autoMenuAmount ? String(autoMenuAmount) : '0'}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-mono font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                  />
                </div>
                <p className="text-[10px] text-gray-500 font-mono">
                  {parsedGuests > 0 && parsedRatePerHead > 0
                    ? `${parsedGuests} guests × Rs. ${parsedRatePerHead.toLocaleString()}`
                    : 'Auto-calculates from guests & package'}
                </p>
              </div>

              {/* 2. Hall Rent */}
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="booking-hall-rent" className="block text-xs font-semibold text-gray-700">
                    Hall Rent
                  </label>
                  <span className="text-[10px] text-teal-700 font-medium">Venue Base</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-gray-400 font-mono">Rs.</span>
                  <input
                    id="booking-hall-rent"
                    type="number"
                    min="0"
                    value={hallRent}
                    onChange={(e) => setHallRent(e.target.value)}
                    placeholder={autoHallRent ? String(autoHallRent) : '0'}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-mono font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                  />
                </div>
                <p className="text-[10px] text-gray-500">
                  {hallName ? `Base rental for ${hallName}` : 'Select hall to auto-fill'}
                </p>
              </div>

              {/* 3. DJ Amount */}
              <div className={`p-4 rounded-xl border transition-colors space-y-1.5 ${
                includeDjSound ? 'border-teal-200 bg-teal-50/40' : 'border-gray-200 bg-gray-50/60 opacity-80'
              }`}>
                <div className="flex items-center justify-between">
                  <label htmlFor="booking-dj-amount" className="block text-xs font-semibold text-gray-700">
                    DJ &amp; Sound Amount
                  </label>
                  <span className={`text-[10px] font-medium ${includeDjSound ? 'text-teal-700' : 'text-gray-400'}`}>
                    {includeDjSound ? 'Included' : 'Optional'}
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-gray-400 font-mono">Rs.</span>
                  <input
                    id="booking-dj-amount"
                    type="number"
                    min="0"
                    disabled={!includeDjSound}
                    value={includeDjSound ? (djAmount || '25000') : '0'}
                    onChange={(e) => setDjAmount(e.target.value)}
                    placeholder="25000"
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-mono font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 disabled:bg-gray-100 disabled:text-gray-400"
                  />
                </div>
                <p className="text-[10px] text-gray-500">
                  {includeDjSound ? 'Standard DJ & sound system setup' : 'Toggle DJ in Section 2 to enable'}
                </p>
              </div>

              {/* 4. Decor Stage Amount */}
              <div className={`p-4 rounded-xl border transition-colors space-y-1.5 ${
                includeStageDecor ? 'border-teal-200 bg-teal-50/40' : 'border-gray-200 bg-gray-50/60 opacity-80'
              }`}>
                <div className="flex items-center justify-between">
                  <label htmlFor="booking-decor-amount" className="block text-xs font-semibold text-gray-700">
                    Decor Stage Amount
                  </label>
                  <span className={`text-[10px] font-medium ${includeStageDecor ? 'text-teal-700' : 'text-gray-400'}`}>
                    {includeStageDecor ? 'Included' : 'Optional'}
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-gray-400 font-mono">Rs.</span>
                  <input
                    id="booking-decor-amount"
                    type="number"
                    min="0"
                    disabled={!includeStageDecor}
                    value={includeStageDecor ? (decorAmount || '50000') : '0'}
                    onChange={(e) => setDecorAmount(e.target.value)}
                    placeholder="50000"
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-mono font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 disabled:bg-gray-100 disabled:text-gray-400"
                  />
                </div>
                <p className="text-[10px] text-gray-500">
                  {includeStageDecor ? 'Stage florals & lighting decor' : 'Toggle Stage Decor in Section 2 to enable'}
                </p>
              </div>
            </div>

            {/* Extra Hours / Overtime (if any) */}
            {extraCharges > 0 && (
              <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                <span>Extra Hours Overtime ({parsedExtraHours}h &times; Rs. {parsedRatePerHour.toLocaleString('en-PK')}/h):</span>
                <strong className="font-mono text-sm">+ Rs. {extraCharges.toLocaleString('en-PK')}</strong>
              </div>
            )}

            {/* Row: Total Amount Area + Beside it Discount Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              {/* Total Amount Area */}
              <div className="p-4 rounded-xl border border-gray-200 bg-slate-50 space-y-1">
                <span className="text-xs font-semibold text-gray-700 block uppercase tracking-wider">
                  Total Amount (Gross Subtotal)
                </span>
                <div className="text-2xl font-bold font-mono text-gray-900">
                  Rs. {subtotal.toLocaleString('en-PK')}
                </div>
                <p className="text-[11px] text-gray-500">
                  Sum of Menu + Hall Rent + DJ + Decor {extraCharges > 0 ? '+ Overtime' : ''}
                </p>
              </div>

              {/* Beside it: Discount Area with Percentage Input */}
              <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/60 space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="booking-discount-pct" className="block text-xs font-semibold text-teal-900 uppercase tracking-wider">
                    Discount Area (%)
                  </label>
                  {calculatedDiscountAmount > 0 && (
                    <span className="text-xs font-bold font-mono text-teal-800">
                      - Rs. {calculatedDiscountAmount.toLocaleString('en-PK')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      id="booking-discount-pct"
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={discountPercentage}
                      onChange={(e) => setDiscountPercentage(e.target.value)}
                      placeholder="0"
                      className="w-full pl-3 pr-8 py-2 rounded-lg border border-teal-200 bg-white text-sm font-mono font-bold text-teal-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                    />
                    <span className="absolute right-3 top-2 text-sm text-teal-600 font-bold">%</span>
                  </div>
                  {/* Quick percentage pills */}
                  {[0, 5, 10, 15].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setDiscountPercentage(String(pct))}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        Number(discountPercentage) === pct
                          ? 'bg-teal-700 text-white shadow-2xs'
                          : 'bg-white border border-teal-200 text-teal-700 hover:bg-teal-100'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-teal-700">
                  {calculatedDiscountAmount > 0
                    ? `Discount of ${parsedDiscountPct}% cuts Rs. ${calculatedDiscountAmount.toLocaleString('en-PK')} from subtotal`
                    : 'Staff can add discount percentage here'}
                </p>
              </div>
            </div>

            {/* Row: Final Amount Area + Advance Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Final Amount Area */}
              <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/70 space-y-1">
                <span className="text-xs font-semibold text-teal-800 block uppercase tracking-wider">
                  Final Amount (Net Total Payable)
                </span>
                <div className="text-3xl font-bold font-mono text-teal-900">
                  Rs. {finalAmount.toLocaleString('en-PK')}
                </div>
                <p className="text-[11px] text-teal-700 font-medium">
                  Payable contract amount after {parsedDiscountPct > 0 ? `${parsedDiscountPct}% discount` : 'no discount'}
                </p>
              </div>

              {/* Advance Area & Remaining Balance */}
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-2">
                <label htmlFor="booking-advance-payment" className="block text-xs font-semibold text-gray-800 uppercase tracking-wider">
                  Advance Payment (Rs.)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-gray-400 font-mono">Rs.</span>
                  <input
                    id="booking-advance-payment"
                    type="number"
                    min="0"
                    value={advancePayment}
                    onChange={(e) => setAdvancePayment(e.target.value)}
                    placeholder="e.g. 150000"
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 bg-white text-base font-mono font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                  />
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-200">
                  <span className="text-gray-600 font-medium">Remaining Balance Due:</span>
                  <span className={`font-mono font-bold ${remainingBalance > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                    Rs. {remainingBalance.toLocaleString('en-PK')}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Conflict Block Alert before submit buttons */}
          {collisionWarning && (
            <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-xs font-semibold text-rose-800 flex items-start gap-3 shadow-2xs">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-900">Double-Booking Conflict Detected</p>
                <p className="mt-0.5 text-rose-700 font-normal">{collisionWarning}</p>
                <p className="mt-1 text-rose-800 font-medium">
                  Please change the Hall, Date, or Event Times to resolve this conflict before saving.
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setViewMode('list');
              }}
              className="px-4 py-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!!collisionWarning}
              className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                collisionWarning
                  ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'border-teal-700 bg-white hover:bg-teal-50 text-teal-700 cursor-pointer'
              }`}
            >
              Save Booking Only
            </button>
            <button
              type="button"
              disabled={!!collisionWarning}
              onClick={handleSaveAndPrintReceipt}
              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-white text-sm font-semibold shadow-sm transition-all ${
                collisionWarning
                  ? 'bg-rose-400 cursor-not-allowed opacity-90'
                  : 'bg-teal-700 hover:bg-teal-800 hover:shadow-md cursor-pointer'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>Confirm Booking &amp; Generate Slip</span>
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Section: Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 font-['Plus_Jakarta_Sans']">
            Bookings &amp; Reservations
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage hall availability, customer contracts, and event schedules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openDirectForm}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium transition-colors cursor-pointer"
            title="Create booking without calendar selection"
          >
            Direct Form
          </button>
          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Booking</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3">
        {/* Search Input */}
        <div className="relative lg:col-span-4">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer or booking ID..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
          />
        </div>

        {/* Select Hall Dropdown */}
        <div className="lg:col-span-2">
          <select
            aria-label="Select Hall"
            value={selectedHall}
            onChange={(e) => setSelectedHall(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 cursor-pointer"
          >
            <option value="All Halls">All Halls</option>
            {availableHalls.map((h) => (
              <option key={h.id} value={h.name}>
                {h.name}
              </option>
            ))}
          </select>
        </div>

        {/* Select Status Dropdown */}
        <div className="lg:col-span-2">
          <select
            aria-label="Select Status"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {/* Date Range Picker */}
        <div className="lg:col-span-4 flex items-center gap-2">
          <input
            type="date"
            aria-label="Start Date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-1/2 px-2.5 py-2 rounded-lg border border-gray-200 bg-white text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
          />
          <span className="text-gray-400 text-xs shrink-0">to</span>
          <input
            type="date"
            aria-label="End Date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-1/2 px-2.5 py-2 rounded-lg border border-gray-200 bg-white text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
          />
        </div>
      </div>

      {/* Main Section: Data Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50/90 border-b border-gray-200 text-gray-500 font-medium">
                <th className="py-3.5 px-4">Booking ID</th>
                <th className="py-3.5 px-4">Customer Name</th>
                <th className="py-3.5 px-4">Event Type</th>
                <th className="py-3.5 px-4">Hall / Venue</th>
                <th className="py-3.5 px-4">Event Date</th>
                <th className="py-3.5 px-4">Supervising Manager</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Payment Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-20 px-6 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-200 text-gray-500 flex items-center justify-center mb-4">
                        <Calendar className="w-7 h-7 stroke-[1.5]" />
                      </div>
                      <p className="text-base font-semibold text-gray-900">
                        No bookings found. Create your first booking to get started.
                      </p>
                      <button
                        type="button"
                        onClick={openCreateForm}
                        className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium transition-colors cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Create New Booking</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="hover:bg-gray-50/80 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-medium text-gray-900 whitespace-nowrap">
                      {booking.bookingId || '—'}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-gray-900 whitespace-nowrap">
                      {booking.customerName || 'Walk-in Client'}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 whitespace-nowrap">
                      {booking.eventType || 'Event'}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 whitespace-nowrap">
                      {booking.hallName || 'Hall'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-gray-600 whitespace-nowrap">
                      <div>{booking.eventDate || '—'}</div>
                      {booking.startTime && (
                        <div className="text-[11px] text-teal-700">
                          {formatTo12Hour(
                            booking.startTime && booking.endTime
                              ? `${booking.startTime} – ${booking.endTime}`
                              : booking.startTime
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <select
                        aria-label="Assign Supervising Manager"
                        value={booking.assignedManager || 'Manager'}
                        onChange={(e) => handleAssignManager(booking.id, e.target.value)}
                        className="text-xs py-1 px-2 rounded-md border border-gray-200 bg-gray-50/70 text-gray-800 hover:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-700 cursor-pointer"
                        title="Assign supervising manager to this event"
                      >
                        {availableManagers.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="space-y-0.5">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-medium border ${getStatusClass(
                            booking.status
                          )}`}
                        >
                          {booking.status}
                        </span>
                        {booking.status === 'Cancelled' && (
                          <div className="text-[10px] text-gray-500 font-mono">
                            Booked: Rs. {(booking.cancellationRecord?.booked_amount || booking.totalAmount).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {booking.status === 'Cancelled' ? (
                        <div className="space-y-0.5">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-medium border ${getPaymentClass(
                              booking.paymentStatus
                            )}`}
                          >
                            {booking.cancellationRecord?.cancellation_type === 'pause_and_adjust'
                              ? 'Credit Held'
                              : 'Refund Settled'}
                          </span>
                          <div className="text-[10px] text-teal-700 font-mono">
                            Paid: Rs. {(booking.cancellationRecord?.advance_paid ?? booking.advancePayment).toLocaleString()} | Used: Rs. {(booking.cancellationRecord?.deduction_amount ?? 0).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-slate-700 font-mono font-medium">
                            {booking.cancellationRecord?.cancellation_type === 'pause_and_adjust'
                              ? `Credit: Rs. ${(booking.cancellationRecord?.retained_credit ?? 0).toLocaleString()}`
                              : `Refund: Rs. ${(booking.cancellationRecord?.refund_amount ?? 0).toLocaleString()}`} · Pending: Rs. 0
                          </div>
                        </div>
                      ) : (
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-medium border ${getPaymentClass(
                            booking.paymentStatus
                          )}`}
                        >
                          {booking.paymentStatus}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setReceiptBooking(booking)}
                          aria-label="Print receipt"
                          title="Print Receipt"
                          className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-teal-50 hover:border-teal-200 text-gray-600 hover:text-teal-700 transition-colors cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewingBooking(booking)}
                          aria-label="View booking"
                          className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 hover:text-teal-700 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditForm(booking)}
                          aria-label="Edit booking"
                          className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 hover:text-teal-700 transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {booking.status !== 'Cancelled' ? (
                          <button
                            type="button"
                            onClick={() => openCancellationModal(booking)}
                            aria-label="Emergency cancellation"
                            title="Emergency Cancel (Refund or Pause & Adjust)"
                            className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setViewingCancellationRecord(booking)}
                            aria-label="View cancellation settlement"
                            title="View Cancellation & Settlement Record"
                            className="p-1.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 transition-colors cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteBooking(booking.id)}
                          aria-label="Delete booking"
                          className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-red-50 hover:border-red-200 text-gray-600 hover:text-red-700 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Booking Modal */}
      {viewingBooking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-[1px]"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-xl border border-gray-200 shadow-lg w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">
                Booking Details · {viewingBooking.bookingId}
              </h2>
              <button
                type="button"
                onClick={() => setViewingBooking(null)}
                aria-label="Close details"
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-gray-400">Customer Name</p>
                <p className="font-medium text-gray-900 mt-0.5">
                  {viewingBooking.customerName}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Phone</p>
                <p className="font-mono text-gray-900 mt-0.5">{viewingBooking.phone}</p>
              </div>
              <div>
                <p className="text-gray-400">Event Type</p>
                <p className="font-medium text-gray-900 mt-0.5">
                  {viewingBooking.eventType}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Event Date &amp; Time</p>
                <p className="font-mono text-gray-900 mt-0.5">
                  {viewingBooking.eventDate}
                  {viewingBooking.startTime && (
                    <span className="block text-teal-700 text-[11px]">
                      {formatTo12Hour(
                        viewingBooking.startTime && viewingBooking.endTime
                          ? `${viewingBooking.startTime} – ${viewingBooking.endTime}`
                          : viewingBooking.startTime
                      )}
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Total Amount</p>
                <p className="font-mono font-semibold text-gray-900 mt-0.5">
                  Rs. {viewingBooking.totalAmount.toLocaleString('en-PK')}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Supervising Manager</p>
                <p className="font-medium text-teal-800 mt-0.5">
                  {viewingBooking.assignedManager || 'Manager'}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Remaining Balance</p>
                <p className="font-mono font-semibold text-gray-900 mt-0.5">
                  Rs. {viewingBooking.remainingBalance.toLocaleString('en-PK')}
                </p>
              </div>

              {/* If booking is cancelled, show cancellation settlement details */}
              {viewingBooking.status === 'Cancelled' && (
                <div className="col-span-2 mt-2 p-4 rounded-xl border border-rose-200 bg-rose-50/80 text-rose-950 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-rose-800">
                      <Ban className="w-4 h-4 text-rose-600" />
                      <span>
                        {viewingBooking.cancellationRecord?.type_label || 'Booking Cancelled (Emergency Settlement)'}
                      </span>
                    </div>
                    {viewingBooking.cancellationRecord?.cancelled_at && (
                      <span className="text-[10px] text-rose-600">
                        {viewingBooking.cancellationRecord.cancelled_at}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-rose-800">
                    Reason: <strong>{viewingBooking.cancellationRecord?.reason || 'Emergency cancellation'}</strong>
                    {viewingBooking.cancellationRecord?.cancelled_by && ` (Approved by ${viewingBooking.cancellationRecord.cancelled_by})`}
                  </p>
                  <div className="pt-2 border-t border-rose-200 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-white/80 border border-rose-100">
                      <span className="text-[10px] text-gray-500 block">Booked Amount</span>
                      <strong className="font-mono text-gray-900">
                        Rs. {(viewingBooking.cancellationRecord?.booked_amount || viewingBooking.totalAmount).toLocaleString()}
                      </strong>
                    </div>
                    <div className="p-2 rounded-lg bg-white/80 border border-rose-100">
                      <span className="text-[10px] text-gray-500 block">Advance Paid</span>
                      <strong className="font-mono text-teal-800">
                        Rs. {(viewingBooking.cancellationRecord?.advance_paid ?? viewingBooking.advancePayment).toLocaleString()}
                      </strong>
                    </div>
                    <div className="p-2 rounded-lg bg-white/80 border border-rose-100">
                      <span className="text-[10px] text-gray-500 block">Amount Used (Cut)</span>
                      <strong className="font-mono text-rose-700">
                        Rs. {(viewingBooking.cancellationRecord?.deduction_amount ?? 0).toLocaleString()}
                      </strong>
                    </div>
                    <div className="p-2 rounded-lg bg-white/80 border border-rose-100">
                      <span className="text-[10px] text-gray-500 block">Pending Balance</span>
                      <strong className="font-mono text-emerald-700">
                        Rs. 0 (Closed)
                      </strong>
                    </div>
                    <div className="col-span-2 p-2 rounded-lg bg-teal-50 border border-teal-200">
                      <span className="text-[10px] text-teal-700 block font-semibold">
                        {viewingBooking.cancellationRecord?.cancellation_type === 'pause_and_adjust'
                          ? 'Retained Credit for Rescheduled Event'
                          : 'Refund Disbursed to Client'}
                      </span>
                      <strong className="font-mono text-teal-900 text-sm">
                        Rs. {(viewingBooking.cancellationRecord?.net_amount ?? 0).toLocaleString()}
                      </strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-2">
              <div>
                {viewingBooking.status !== 'Cancelled' && (
                  <button
                    type="button"
                    onClick={() => {
                      const target = viewingBooking;
                      setViewingBooking(null);
                      openCancellationModal(target);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Ban className="w-3.5 h-3.5 text-rose-600" />
                    <span>Emergency Cancel Booking</span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const current = viewingBooking;
                    setViewingBooking(null);
                    setReceiptBooking(current);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-teal-700 bg-white hover:bg-teal-50 text-teal-700 text-xs font-medium cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingBooking(null)}
                  className="px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Cancellation Modal with Two Options */}
      {cancellingBooking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-[2px] animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-rose-600 to-red-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">Emergency Booking Cancellation</h3>
                  <p className="text-xs text-rose-100 mt-0.5 font-mono">
                    {cancellingBooking.bookingId} — {cancellingBooking.customerName} ({cancellingBooking.hallName})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCancellingBooking(null)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {cancellationNotice ? (
                <div className="py-8 px-4 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-base">Booking Successfully Cancelled</h4>
                  <p className="text-xs text-slate-600 max-w-md mx-auto">{cancellationNotice}</p>
                </div>
              ) : (
                <>
                  {/* Two Condition Options */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      Choose Cancellation Condition <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Option 1: Refund */}
                      <button
                        type="button"
                        onClick={() => setCancellationType('refund')}
                        className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                          cancellationType === 'refund'
                            ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <DollarSign className={`w-4 h-4 ${cancellationType === 'refund' ? 'text-emerald-700' : 'text-slate-400'}`} />
                            <span className="font-bold text-sm text-slate-900">Refund Client</span>
                          </div>
                          {cancellationType === 'refund' && (
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Cut incurred expenses used for prep and refund the remaining advance to the client.
                        </p>
                      </button>

                      {/* Option 2: Pause and Adjust */}
                      <button
                        type="button"
                        onClick={() => setCancellationType('pause_and_adjust')}
                        className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                          cancellationType === 'pause_and_adjust'
                            ? 'border-teal-700 bg-teal-50/50 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <CalendarCheck className={`w-4 h-4 ${cancellationType === 'pause_and_adjust' ? 'text-teal-700' : 'text-slate-400'}`} />
                            <span className="font-bold text-sm text-slate-900">Pause &amp; Adjust to Future</span>
                          </div>
                          {cancellationType === 'pause_and_adjust' && (
                            <span className="w-2.5 h-2.5 rounded-full bg-teal-700" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Close booking, cut used amount, and retain remaining balance as client credit for rescheduled event.
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Reason Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Emergency / Cancellation Reason <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={cancellationReason}
                      onChange={(e) => setCancellationReason(e.target.value)}
                      placeholder="e.g. Family Medical Emergency / Bereavement / Event Relocation"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15"
                    />
                  </div>

                  {/* Financial Settlement Calculator */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
                      <span className="text-slate-500">Collected Advance Payment:</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        Rs. {cancellingBooking.advancePayment.toLocaleString('en-PK')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700">
                          Amount Used / Incurred Costs:
                        </label>
                        <p className="text-[11px] text-slate-500">
                          Prep expenses or non-refundable fee to cut
                        </p>
                      </div>
                      <div className="relative w-36">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">
                          Rs.
                        </span>
                        <input
                          type="number"
                          min="0"
                          max={cancellingBooking.advancePayment}
                          value={deductionAmount}
                          onChange={(e) => setDeductionAmount(e.target.value)}
                          className="w-full pl-8 pr-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-right text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-rose-500"
                        />
                      </div>
                    </div>

                    {/* Calculated Net Result */}
                    {(() => {
                      const deduction = Math.max(0, parseFloat(deductionAmount) || 0);
                      const net = Math.max(0, cancellingBooking.advancePayment - deduction);
                      return (
                        <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">
                            {cancellationType === 'refund'
                              ? 'Net Amount to Refund Client:'
                              : 'Net Amount Retained for Future Event:'}
                          </span>
                          <span
                            className={`font-mono font-bold text-base ${
                              cancellationType === 'refund' ? 'text-emerald-700' : 'text-teal-800'
                            }`}
                          >
                            Rs. {net.toLocaleString('en-PK')}
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Hall & Date Release Notice */}
                  <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-3.5 flex items-start gap-2.5 text-xs text-teal-900">
                    <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Immediate Hall &amp; Date Availability Release</p>
                      <p className="text-teal-800 mt-0.5">
                        Closing this booking will immediately free up{' '}
                        <strong className="underline">{cancellingBooking.hallName}</strong> on{' '}
                        <strong className="underline">{cancellingBooking.eventDate}</strong> so it is open for other clients to reserve on the calendar.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            {!cancellationNotice && (
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCancellingBooking(null)}
                  disabled={isCancelling}
                  className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancellation}
                  disabled={isCancelling}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white text-xs font-bold inline-flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Ban className="w-4 h-4" />
                  <span>
                    {isCancelling
                      ? 'Cancelling & Freeing Date...'
                      : cancellationType === 'refund'
                      ? 'Confirm Cancellation & Refund'
                      : 'Confirm Cancellation & Retain Balance'}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cancellation Settlement Details Modal */}
      {viewingCancellationRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-[2px] animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">Cancellation Settlement Summary</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingCancellationRecord(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs text-slate-700">
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                <p className="font-bold text-sm">
                  {viewingCancellationRecord.cancellationRecord?.type_label || 'Booking Cancelled'}
                </p>
                <p>
                  Reason: <span className="font-semibold">{viewingCancellationRecord.cancellationRecord?.reason || 'Emergency'}</span>
                </p>
                {viewingCancellationRecord.cancellationRecord?.cancelled_at && (
                  <p className="text-[11px] text-amber-800">
                    Cancelled on {viewingCancellationRecord.cancellationRecord.cancelled_at} by {viewingCancellationRecord.cancellationRecord.cancelled_by || 'Manager'}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50">
                <div>
                  <span className="text-slate-500">Booked Contract Amount</span>
                  <p className="font-bold font-mono text-sm mt-0.5 text-slate-900">
                    Rs. {Number(viewingCancellationRecord.cancellationRecord?.booked_amount || viewingCancellationRecord.totalAmount).toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Advance Paid</span>
                  <p className="font-bold font-mono text-sm mt-0.5 text-teal-800">
                    Rs. {Number(viewingCancellationRecord.cancellationRecord?.advance_paid || viewingCancellationRecord.advancePayment).toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Amount Used (Incurred Cut)</span>
                  <p className="font-bold font-mono text-sm text-rose-700 mt-0.5">
                    Rs. {Number(viewingCancellationRecord.cancellationRecord?.deduction_amount || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Pending Balance</span>
                  <p className="font-bold font-mono text-sm text-emerald-700 mt-0.5">
                    Rs. 0 (Voided / Settled)
                  </p>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-slate-900">
                    {viewingCancellationRecord.cancellationRecord?.cancellation_type === 'pause_and_adjust'
                      ? 'Credit Retained for Future Event'
                      : 'Amount Refunded to Client'}
                  </span>
                  <span className="font-bold font-mono text-base text-teal-800">
                    Rs. {Number(viewingCancellationRecord.cancellationRecord?.net_amount || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-teal-200 bg-teal-50 text-teal-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                <span>
                  Date <strong>{viewingCancellationRecord.eventDate}</strong> ({viewingCancellationRecord.hallName}) was released and reopened for other bookings.
                </span>
              </div>
            </div>
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingCancellationRecord(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* A5 Printable Receipt Modal */}
      {receiptBooking && (() => {
        const extraTimeCharge =
          (receiptBooking.extraHours || 0) * (receiptBooking.ratePerHour || 0);
        const extraServicesList: string[] = [];
        if (receiptBooking.includeDjSound) extraServicesList.push('DJ & Sound');
        if (receiptBooking.includeStageDecor) extraServicesList.push('Stage/Decor');
        if (receiptBooking.extraHours > 0) {
          extraServicesList.push(`${receiptBooking.extraHours}h Extra Time`);
        }
        const extraServicesLabel =
          extraServicesList.length > 0
            ? extraTimeCharge > 0
              ? `${extraServicesList.join(', ')} (Rs. ${extraTimeCharge.toLocaleString('en-PK')})`
              : extraServicesList.join(', ')
            : 'None';

        const menuDisplay =
          receiptBooking.includeMenuPackage === false ||
          receiptBooking.menuPackage === 'Customer Own' ||
          receiptBooking.menuPackage === 'Own Catering (No Package)'
            ? 'Customer Own'
            : receiptBooking.menuPackage || 'Not Specified';

        const timeSlot =
          receiptBooking.startTime &&
          receiptBooking.startTime !== '[--]' &&
          receiptBooking.endTime &&
          receiptBooking.endTime !== '[--]'
            ? `${formatTo12Hour(receiptBooking.startTime)} – ${formatTo12Hour(receiptBooking.endTime)}`
            : formatTo12Hour(receiptBooking.startTime) || '12:00 PM – 04:00 PM';

        const receiptDate = new Date().toISOString().slice(0, 10);

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-[1px] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-label="Booking Receipt"
          >
            <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-[560px] overflow-hidden my-auto">
              {/* Printable A5 Receipt Sheet */}
              <div className="printable-receipt-area bg-white p-7 text-gray-900">
                {/* Header: Royal Letterhead */}
                <div className="pb-4 border-b-2 border-teal-900/40">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-teal-900 text-amber-400 flex items-center justify-center border border-amber-400/40 shadow-xs shrink-0">
                        <Crown className="w-6 h-6 text-amber-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-bold tracking-tight text-slate-900 font-['Playfair_Display','Cormorant_Garamond',serif]">
                            Mehar Palace Marquee
                          </h2>
                          <span className="text-[9px] font-bold uppercase tracking-widest text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            Banquets
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-600 mt-0.5">
                          Main Canal Road, near PSO Petrol Pump, Fateh Garh Mughalpura, Lahore
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          Phone: <strong className="text-slate-800">0321 1000806</strong>
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="inline-block px-2.5 py-0.5 rounded border border-teal-800 bg-teal-900 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                        Booking Slip
                      </div>
                    </div>
                  </div>
                  {/* Decorative Letterhead Bar */}
                  <div className="mt-3 h-1 w-full bg-gradient-to-r from-teal-900 via-amber-500 to-teal-900 rounded-full" />
                </div>

                {/* Receipt Details */}
                <div className="grid grid-cols-3 gap-3 py-3.5 border-b border-gray-100 text-xs">
                  <div>
                    <p className="text-[11px] text-gray-400">Receipt #</p>
                    <p className="font-mono font-semibold text-gray-900 mt-0.5">
                      {receiptBooking.bookingId && receiptBooking.bookingId !== '[--]'
                        ? `RCP-${receiptBooking.bookingId}`
                        : 'RCP-001'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] text-gray-400">Date</p>
                    <p className="font-mono font-medium text-gray-900 mt-0.5">
                      {receiptDate}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-gray-400">Booking Ref</p>
                    <p className="font-mono font-semibold text-gray-900 mt-0.5">
                      {receiptBooking.bookingId || '—'}
                    </p>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="py-3.5 border-b border-gray-100">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Customer Details
                  </h3>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <p className="text-[11px] text-gray-500">Name</p>
                      <p className="font-medium text-gray-900 mt-0.5">
                        {receiptBooking.customerName || 'Walk-in Client'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-500">Phone</p>
                      <p className="font-mono text-gray-900 mt-0.5">
                        {receiptBooking.phone || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-500">CNIC</p>
                      <p className="font-mono text-gray-900 mt-0.5">
                        {receiptBooking.cnic || '—'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Event Details */}
                <div className="py-3.5 border-b border-gray-100">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Event Details
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <p className="text-[11px] text-gray-500">Hall Name</p>
                      <p className="font-medium text-gray-900 mt-0.5">
                        {receiptBooking.hallName || 'Main Hall'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-500">Event Date</p>
                      <p className="font-mono text-gray-900 mt-0.5">
                        {receiptBooking.eventDate || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-500">Time (Slot)</p>
                      <p className="font-mono text-gray-900 mt-0.5">{timeSlot}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-500">Seating Type</p>
                      <p className="font-medium text-gray-900 mt-0.5">
                        {receiptBooking.bookingType || receiptBooking.seatingArrangement || 'Full Hall'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-500">Guest Count &amp; Tables</p>
                      <p className="font-mono text-gray-900 mt-0.5">
                        {receiptBooking.guestCount || '100'} Guests ({Math.ceil((Number(receiptBooking.guestCount) || 100) / (Number(receiptBooking.personsPerTable) || 10))} Tables)
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-500">Supervising Manager</p>
                      <p className="font-medium text-gray-900 mt-0.5">
                        {receiptBooking.assignedManager || 'Manager'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Financial Breakdown */}
                <div className="py-3.5 border-b border-gray-200">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2.5">
                    Financial Breakdown
                  </h3>
                  <div className="space-y-2 text-xs">
                    {receiptBooking.status === 'Cancelled' ? (
                      <div className="pt-2.5 mt-2.5 border-t border-rose-200 p-3 rounded-lg bg-rose-50/80 text-rose-950 space-y-2">
                        <div className="font-bold text-xs text-rose-800 uppercase tracking-wide">
                          Cancellation &amp; Financial Settlement
                        </div>
                        <div className="flex items-center justify-between text-gray-800">
                          <span>Original Booked Amount</span>
                          <span className="font-mono tabular-nums font-semibold">
                            Rs. {(receiptBooking.cancellationRecord?.booked_amount || receiptBooking.totalAmount).toLocaleString('en-PK')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-teal-800">
                          <span>Advance Paid</span>
                          <span className="font-mono tabular-nums font-semibold">
                            Rs. {(receiptBooking.cancellationRecord?.advance_paid ?? receiptBooking.advancePayment).toLocaleString('en-PK')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-rose-700">
                          <span>Amount Used (Deductions)</span>
                          <span className="font-mono tabular-nums font-semibold">
                            Rs. {(receiptBooking.cancellationRecord?.deduction_amount ?? 0).toLocaleString('en-PK')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-emerald-800">
                          <span>Pending Balance</span>
                          <span className="font-mono tabular-nums font-semibold">
                            Rs. 0 (Closed / Voided)
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-rose-200 font-bold text-slate-900 text-sm">
                          <span>
                            {receiptBooking.cancellationRecord?.cancellation_type === 'pause_and_adjust'
                              ? 'Retained Credit Voucher'
                              : 'Refund Disbursed to Client'}
                          </span>
                          <span className="font-mono tabular-nums text-teal-800">
                            Rs. {(receiptBooking.cancellationRecord?.net_amount ?? 0).toLocaleString('en-PK')}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 pt-1">
                        {/* What It Is For - Itemized Table */}
                        <table className="w-full text-left border-collapse border border-gray-200 text-xs">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-gray-700">
                              <th className="py-2 px-3 font-semibold uppercase text-[10px]">Service Item</th>
                              <th className="py-2 px-3 font-semibold uppercase text-[10px]">Scope</th>
                              <th className="py-2 px-3 text-right font-semibold uppercase text-[10px]">Amount (PKR)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            <tr>
                              <td className="py-2 px-3 font-medium text-gray-900">Hall Rental Venue</td>
                              <td className="py-2 px-3 text-gray-600">{receiptBooking.hallName} Base</td>
                              <td className="py-2 px-3 text-right font-mono font-semibold text-gray-900">
                                Rs. {(receiptBooking.hallRent || 0).toLocaleString('en-PK')}
                              </td>
                            </tr>
                            <tr>
                              <td className="py-2 px-3 font-medium text-gray-900">Food &amp; Catering Menu</td>
                              <td className="py-2 px-3 text-gray-600">
                                {receiptBooking.menuPackage || 'Catering'} ({receiptBooking.guestCount} guests)
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-semibold text-gray-900">
                                Rs. {(receiptBooking.menuAmount || 0).toLocaleString('en-PK')}
                              </td>
                            </tr>
                            {(receiptBooking.includeDjSound || (receiptBooking.djAmount && receiptBooking.djAmount > 0)) && (
                              <tr>
                                <td className="py-2 px-3 font-medium text-gray-900">DJ &amp; Sound System</td>
                                <td className="py-2 px-3 text-gray-600">Audio setup &amp; DJ arrangement</td>
                                <td className="py-2 px-3 text-right font-mono font-semibold text-gray-900">
                                  Rs. {(receiptBooking.djAmount || 25000).toLocaleString('en-PK')}
                                </td>
                              </tr>
                            )}
                            {(receiptBooking.includeStageDecor || (receiptBooking.decorAmount && receiptBooking.decorAmount > 0)) && (
                              <tr>
                                <td className="py-2 px-3 font-medium text-gray-900">Stage &amp; Floral Decor</td>
                                <td className="py-2 px-3 text-gray-600">Floral stage styling &amp; ambient lights</td>
                                <td className="py-2 px-3 text-right font-mono font-semibold text-gray-900">
                                  Rs. {(receiptBooking.decorAmount || 50000).toLocaleString('en-PK')}
                                </td>
                              </tr>
                            )}
                            {receiptBooking.extraHours > 0 && (
                              <tr>
                                <td className="py-2 px-3 font-medium text-gray-900">Extra Hours Overtime</td>
                                <td className="py-2 px-3 text-gray-600">
                                  {receiptBooking.extraHours}h @ Rs. {(receiptBooking.ratePerHour || 0).toLocaleString('en-PK')}/h
                                </td>
                                <td className="py-2 px-3 text-right font-mono font-semibold text-gray-900">
                                  Rs. {((receiptBooking.extraHours || 0) * (receiptBooking.ratePerHour || 0)).toLocaleString('en-PK')}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>

                        {/* Payment & Settlement Table */}
                        <table className="w-full text-left border-collapse border border-gray-200 text-xs">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-gray-700">
                              <th className="py-2 px-3 font-semibold uppercase text-[10px]">Payment Summary</th>
                              <th className="py-2 px-3 text-right font-semibold uppercase text-[10px]">Amount (PKR)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            <tr>
                              <td className="py-2 px-3 text-gray-600">Gross Subtotal</td>
                              <td className="py-2 px-3 text-right font-mono text-gray-900 font-medium">
                                Rs. {(receiptBooking.subtotal || receiptBooking.totalAmount).toLocaleString('en-PK')}
                              </td>
                            </tr>
                            {receiptBooking.discountPercentage && receiptBooking.discountPercentage > 0 ? (
                              <tr className="text-teal-700 font-medium">
                                <td className="py-2 px-3">Special Discount ({receiptBooking.discountPercentage}%)</td>
                                <td className="py-2 px-3 text-right font-mono font-bold">
                                  - Rs. {(receiptBooking.discountAmount || 0).toLocaleString('en-PK')}
                                </td>
                              </tr>
                            ) : null}
                            <tr className="font-bold bg-teal-50/50">
                              <td className="py-2.5 px-3 text-teal-900">Final Net Contract Payable</td>
                              <td className="py-2.5 px-3 text-right font-mono text-teal-900 text-sm">
                                Rs. {receiptBooking.totalAmount.toLocaleString('en-PK')}
                              </td>
                            </tr>
                            <tr className="bg-emerald-50/70 font-semibold">
                              <td className="py-2.5 px-3 text-emerald-800">Advance Payment Received</td>
                              <td className="py-2.5 px-3 text-right font-mono text-emerald-700 text-sm font-bold">
                                Rs. {receiptBooking.advancePayment.toLocaleString('en-PK')}
                              </td>
                            </tr>
                            <tr className="border-t-2 border-gray-300 font-bold">
                              <td className="py-2.5 px-3 text-gray-900">Remaining Balance Due</td>
                              <td className={`py-2.5 px-3 text-right font-mono text-sm ${receiptBooking.remainingBalance > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                                Rs. {receiptBooking.remainingBalance.toLocaleString('en-PK')}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-4 text-center">
                  <p className="text-xs font-medium text-gray-700">
                    Thank you for booking with us!
                  </p>
                </div>
              </div>

              {/* Modal Action Bar (Hidden in Print) */}
              <div className="no-print px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setReceiptBooking(null)}
                  className="px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-medium transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
