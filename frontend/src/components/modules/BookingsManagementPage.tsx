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
} from 'lucide-react';
import { SEED_BOOKINGS, SEED_HALLS, SEED_MENU_PACKAGES } from '../../data/seedData';
import { bookingsApi, hallsApi, menuApi, authApi } from '../../api/client';
import { formatTo12Hour } from '../../utils/timeFormat';

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
  totalAmount: number;
  advancePayment: number;
  remainingBalance: number;
  assignedManager?: string;
  status: 'Pending' | 'Confirmed' | 'Cancelled';
  paymentStatus: 'Paid' | 'Partial' | 'Unpaid';
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
  excludeId: string | null
): CollisionResult {
  if (!hallName || !eventDate) {
    return { hasConflict: false };
  }

  const BUFFER_MINUTES = 60; // 1-hour mandatory turnover/cleaning margin

  let reqStart = parseTimeToMinutes(startTime);
  let reqEnd = parseTimeToMinutes(endTime);

  if (reqStart === null || reqEnd === null) {
    const [s, e] = extractStartEndMinutes(startTime);
    if (reqStart === null) reqStart = s;
    if (reqEnd === null) reqEnd = e;
  }

  if (reqStart !== null && reqEnd !== null && reqEnd <= reqStart) {
    reqEnd += 24 * 60;
  }

  const candidateBookings = bookings.filter((b) => {
    if (b.status === 'Cancelled') return false;
    if (excludeId && b.id === excludeId) return false;
    if (b.eventDate !== eventDate) return false;
    if (b.hallName.trim().toLowerCase() !== hallName.trim().toLowerCase()) return false;
    return true;
  });

  for (const b of candidateBookings) {
    let bStart = parseTimeToMinutes(b.startTime);
    let bEnd = parseTimeToMinutes(b.endTime);

    if (bStart === null || bEnd === null) {
      const [s, e] = extractStartEndMinutes(b.startTime);
      if (bStart === null) bStart = s;
      if (bEnd === null) bEnd = e;
    }

    if (bStart !== null && bEnd !== null && bEnd <= bStart) {
      bEnd += 24 * 60;
    }

    if (reqStart !== null && reqEnd !== null && bStart !== null && bEnd !== null) {
      const bufferedStart = Math.max(0, bStart - BUFFER_MINUTES);
      const bufferedEnd = bEnd + BUFFER_MINUTES;

      if (Math.max(reqStart, bufferedStart) < Math.min(reqEnd, bufferedEnd)) {
        const bookedTimeStr = `${b.startTime || 'Standard Slot'}${b.endTime ? ` – ${b.endTime}` : ''}`;
        return {
          hasConflict: true,
          conflictingBooking: b,
          message: `Hall "${hallName}" is already reserved on ${eventDate} (${bookedTimeStr}) by ${b.customerName} (${b.bookingId}). Including the mandatory 1-hour cleaning & turnover buffer, this time slot cannot be booked.`,
        };
      }
    } else {
      const bIsLunch = (b.startTime + ' ' + (b.eventType || '')).toLowerCase().includes('lunch');
      const reqIsLunch = (startTime || '').toLowerCase().includes('lunch') || (reqStart !== null && reqStart < 17 * 60);

      const bIsDinner = !bIsLunch;
      const reqIsDinner = !reqIsLunch;

      if ((bIsLunch && reqIsLunch) || (bIsDinner && reqIsDinner)) {
        return {
          hasConflict: true,
          conflictingBooking: b,
          message: `Hall "${hallName}" is already reserved for this slot on ${eventDate} by ${b.customerName} (${b.bookingId}).`,
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
  const [bookings, setBookings] = useState<BookingItem[]>(SEED_BOOKINGS);
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingBooking, setViewingBooking] = useState<BookingItem | null>(null);
  const [receiptBooking, setReceiptBooking] = useState<BookingItem | null>(null);

  // Dynamic Halls and Menu Packages
  const [availableHalls, setAvailableHalls] = useState<
    Array<{ id: string; name: string; capacity?: number }>
  >([]);
  const [availablePackages, setAvailablePackages] = useState<
    Array<{ id: string; name: string; pricePerHead?: number }>
  >([]);

  useEffect(() => {
    bookingsApi
      .list()
      .then((data) => {
        if (data && data.length > 0) {
          setBookings(
            data.map((b: any) => ({
              id: String(b.id),
              bookingId: b.bookingRef || `BK-${b.id}`,
              customerName: b.customerName && b.customerName !== '[--]' ? b.customerName : '',
              phone: b.contactRef && b.contactRef !== '[--]' ? b.contactRef : '',
              cnic: b.cnic && b.cnic !== '[--]' ? b.cnic : '',
              eventType: b.eventType && b.eventType !== '[--]' ? b.eventType : 'Wedding',
              hallName: b.hallName && b.hallName !== '[--]' ? b.hallName : '',
              bookingType: 'Full Hall',
              eventDate: b.date || '',
              guestCount: b.guestCount && b.guestCount !== '[--]' ? String(b.guestCount) : '',
              seatingArrangement: b.seatingArrangement && b.seatingArrangement !== '[--]' ? b.seatingArrangement : 'Round Tables',
              includeMenuPackage: !!b.menuPackage,
              menuPackage: b.menuPackage && b.menuPackage !== '[--]' ? b.menuPackage : '',
              dietaryInstructions: b.specialInstructions || '',
              customRequests: '',
              includeDjSound: false,
              includeStageDecor: false,
              startTime: b.time || '18:00',
              endTime: '23:00',
              extraHours: Number(b.extraHours) || 0,
              ratePerHour: Number(b.ratePerHour) || 0,
              totalAmount: Number(b.amount) || 0,
              advancePayment: Number(b.advancePayment) || 0,
              remainingBalance: Math.max(
                0,
                (Number(b.amount) || 0) - (Number(b.advancePayment) || 0)
              ),
              assignedManager: b.assignedManager || 'Manager',
              status:
                b.status === 'Confirmed'
                  ? 'Confirmed'
                  : b.status === 'Cancelled'
                  ? 'Cancelled'
                  : 'Pending',
              paymentStatus:
                b.paymentStatus === 'Paid'
                  ? 'Paid'
                  : b.paymentStatus === 'Partial'
                  ? 'Partial'
                  : 'Unpaid',
            }))
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
            }))
          );
        } else {
          setAvailableHalls(
            SEED_HALLS.map((h) => ({ id: h.id, name: h.name, capacity: h.capacity }))
          );
        }
      })
      .catch(() => {
        setAvailableHalls(
          SEED_HALLS.map((h) => ({ id: h.id, name: h.name, capacity: h.capacity }))
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

  // Live collision detection against existing bookings and 1-hour turnover margin
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
      editingId
    );

    if (collision.hasConflict) {
      setCollisionWarning(
        collision.message ||
          `Schedule Conflict: Hall "${hallName}" is already reserved for this schedule with 1-hour margin buffer.`
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
  }, [hallName, eventDate, startTime, endTime, editingId, bookings]);

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
    setTotalAmount(item.totalAmount ? String(item.totalAmount) : '');
    setAdvancePayment(item.advancePayment ? String(item.advancePayment) : '');
    setAssignedManager(item.assignedManager || 'Manager');
    setFormError(null);
    setCollisionWarning(null);
    setViewMode('form');
  };

  const parsedTotal = Number(totalAmount) || 0;
  const parsedAdvance = Number(advancePayment) || 0;
  const parsedExtraHours = Number(extraHours) || 0;
  const parsedRatePerHour = Number(ratePerHour) || 0;
  const extraCharges = parsedExtraHours * parsedRatePerHour;
  const grandTotal = parsedTotal + extraCharges;
  const remainingBalance = Math.max(0, grandTotal - parsedAdvance);

  // Live Food Cost Calculation
  const parsedGuests = Number(guestCount) || 0;
  const parsedRatePerHead = Number(menuRatePerHead) || 0;
  const calculatedFoodCost =
    includeMenuPackage && parsedGuests > 0 && parsedRatePerHead > 0
      ? parsedGuests * parsedRatePerHead
      : 0;

  const hasAmountInput =
    totalAmount.trim() !== '' ||
    advancePayment.trim() !== '' ||
    (extraHours.trim() !== '' && ratePerHour.trim() !== '');

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
      editingId
    );
    if (collisionCheck.hasConflict) {
      const msg =
        collisionCheck.message ||
        `Cannot save: Hall "${chosenHall}" is already booked on ${chosenDate} for the selected time or 1-hour margin buffer.`;
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
      seatingArrangement: seatingArrangement.trim(),
      menuPackage: includeMenuPackage
        ? menuPackage
          ? menuRatePerHead
            ? `${menuPackage} (Rs. ${menuRatePerHead}/head)`
            : menuPackage
          : menuRatePerHead
          ? `Custom Menu (Rs. ${menuRatePerHead}/head)`
          : 'Package Selected'
        : '',
      specialInstructions:
        dietaryInstructions.trim() +
        (customRequests ? ` | ${customRequests.trim()}` : ''),
      amount: grandTotal,
      advancePayment: parsedAdvance,
      extraHours: parsedExtraHours,
      ratePerHour: parsedRatePerHour,
      assignedManager: assignedManager || 'Manager',
      status: 'Pending',
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
      totalAmount: grandTotal,
      advancePayment: parsedAdvance,
      remainingBalance,
      assignedManager: assignedManager || 'Manager',
      status: 'Pending',
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
                  Phone
                </label>
                <input
                  id="booking-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 0300-1234567"
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
              </div>

              <div>
                <label
                  htmlFor="booking-cnic"
                  className="block text-xs font-medium text-gray-700 mb-1.5"
                >
                  CNIC
                </label>
                <input
                  id="booking-cnic"
                  type="text"
                  value={cnic}
                  onChange={(e) => setCnic(e.target.value)}
                  placeholder="e.g. 35202-1234567-1"
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
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
                  onChange={(e) => setHallName(e.target.value)}
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

              <div className="md:col-span-2">
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
                      onChange={(e) => setIncludeDjSound(e.target.checked)}
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
                      onChange={(e) => setIncludeStageDecor(e.target.checked)}
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

          {/* Section 5: Payment Summary */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 pb-4 border-b border-gray-100">
              5. Payment Summary
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              <div>
                <label
                  htmlFor="booking-total-amount"
                  className="block text-xs font-medium text-gray-700 mb-1.5"
                >
                  Total Booking Amount
                </label>
                <input
                  id="booking-total-amount"
                  type="number"
                  min="0"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="e.g. 350000"
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 font-mono tabular-nums"
                />
              </div>

              <div>
                <label
                  htmlFor="booking-advance"
                  className="block text-xs font-medium text-gray-700 mb-1.5"
                >
                  Advance Payment
                </label>
                <input
                  id="booking-advance"
                  type="number"
                  min="0"
                  value={advancePayment}
                  onChange={(e) => setAdvancePayment(e.target.value)}
                  placeholder="e.g. 100000"
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 font-mono tabular-nums"
                />
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="booking-remaining"
                  className="block text-xs font-medium text-gray-700 mb-1.5"
                >
                  Remaining Balance (Read-only)
                </label>
                <input
                  id="booking-remaining"
                  type="text"
                  readOnly
                  value={
                    hasAmountInput
                      ? `Rs. ${remainingBalance.toLocaleString('en-PK')}`
                      : 'Rs. 0'
                  }
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-900 font-mono tabular-nums cursor-default focus:outline-none"
                />
              </div>

              {/* Cost Subtotal Breakdown */}
              <div className="md:col-span-2 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-4">
                  <span className="text-gray-500">
                    Calculated Food Subtotal:{' '}
                    <strong className="text-teal-900 font-mono">
                      Rs. {calculatedFoodCost.toLocaleString('en-PK')}
                    </strong>
                  </span>
                  {extraCharges > 0 && (
                    <span className="text-gray-500">
                      Extra Hours ({parsedExtraHours}h &times; Rs. {parsedRatePerHour}):{' '}
                      <strong className="text-gray-900 font-mono">
                        Rs. {extraCharges.toLocaleString('en-PK')}
                      </strong>
                    </span>
                  )}
                </div>
                <span className="text-gray-500">
                  Total Payable:{' '}
                  <strong className="text-teal-700 font-mono font-bold text-sm">
                    Rs. {grandTotal.toLocaleString('en-PK')}
                  </strong>
                </span>
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
          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
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
              type="button"
              disabled={!!collisionWarning}
              onClick={handleSaveAndPrintReceipt}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                collisionWarning
                  ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'border-teal-700 bg-white hover:bg-teal-50 text-teal-700 cursor-pointer'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>Save &amp; Print Receipt</span>
            </button>
            <button
              type="submit"
              disabled={!!collisionWarning}
              className={`px-5 py-2.5 rounded-lg text-white text-sm font-medium transition-colors ${
                collisionWarning
                  ? 'bg-rose-400 cursor-not-allowed opacity-90'
                  : 'bg-teal-700 hover:bg-teal-800 cursor-pointer'
              }`}
            >
              {collisionWarning ? 'Blocked: Schedule Conflict' : 'Save Booking'}
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
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-medium border ${getStatusClass(
                          booking.status
                        )}`}
                      >
                        {booking.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-medium border ${getPaymentClass(
                          booking.paymentStatus
                        )}`}
                      >
                        {booking.paymentStatus}
                      </span>
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
            </div>

            <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
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
                {/* Header */}
                <div className="text-center pb-4 border-b border-gray-200">
                  <h2 className="text-lg font-bold tracking-tight text-gray-900 font-['Plus_Jakarta_Sans']">
                    Marriage Hall &amp; Banquet Management
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">Address: Main Boulevard, Gulberg III, Lahore</p>
                  <p className="text-xs text-gray-500">Contact: +92 42 3578 9000</p>
                  <div className="mt-2.5 inline-block px-3 py-0.5 rounded border border-gray-200 bg-gray-50 text-[11px] font-semibold uppercase tracking-wider text-gray-700">
                    Booking Receipt
                  </div>
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
                      <p className="text-[11px] text-gray-500">Guest Count</p>
                      <p className="font-mono text-gray-900 mt-0.5">
                        {receiptBooking.guestCount || '100'}
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
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Hall Rent</span>
                      <span className="font-mono text-gray-900">
                        Rs. {(receiptBooking.totalAmount ? Math.round(receiptBooking.totalAmount * 0.4) : 0).toLocaleString('en-PK')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Menu Package</span>
                      <span className="font-medium text-gray-900">{menuDisplay}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-gray-600">
                        Extra Services (DJ/Decor/Extra Time)
                      </span>
                      <span className="font-mono text-gray-900 text-right">
                        {extraServicesLabel}
                      </span>
                    </div>

                    <div className="pt-2.5 mt-2.5 border-t border-gray-100 space-y-1.5">
                      <div className="flex items-center justify-between font-semibold text-gray-900">
                        <span>Total Amount</span>
                        <span className="font-mono tabular-nums">
                          {receiptBooking.totalAmount > 0
                            ? `Rs. ${receiptBooking.totalAmount.toLocaleString('en-PK')}`
                            : 'Rs. 0'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-gray-700">
                        <span>Advance Paid</span>
                        <span className="font-mono tabular-nums">
                          {receiptBooking.advancePayment > 0
                            ? `Rs. ${receiptBooking.advancePayment.toLocaleString('en-PK')}`
                            : 'Rs. 0'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1.5 border-t border-dashed border-gray-200 font-bold text-gray-900 text-sm">
                        <span>Balance Due</span>
                        <span className="font-mono tabular-nums">
                          {receiptBooking.totalAmount > 0 || receiptBooking.remainingBalance > 0
                            ? `Rs. ${receiptBooking.remainingBalance.toLocaleString('en-PK')}`
                            : 'Rs. 0'}
                        </span>
                      </div>
                    </div>
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
