/**
 * Phone and CNIC formatting & validation utilities
 * Standard Pakistani format rules:
 * - Phone: max 11 digits, must start with 03 (e.g., 03001234567 or 0300-1234567)
 * - CNIC: 13 digits, automatically formatted with dashes (e.g., 35202-1234567-1)
 */

/**
 * Formats phone input to ensure:
 * - Contains only digits
 * - Starts with '03' (if user types '3', prepends '0'; prevents anything other than '03')
 * - Max 11 digits total (e.g. 03XXXXXXXXX)
 */
export function formatPhoneNumber(input: string): string {
  if (!input) return '';
  // Strip non-digits
  let digits = input.replace(/\D/g, '');

  if (digits.length === 0) return '';

  // If user begins typing '3', convert to '03'
  if (digits.startsWith('3')) {
    digits = '0' + digits;
  }

  // Ensure starts with '0'
  if (!digits.startsWith('0')) {
    digits = '0' + digits;
  }

  // If second digit is entered and is not '3', force '3'
  if (digits.length >= 2 && digits[1] !== '3') {
    digits = '03' + digits.slice(2);
  }

  // Enforce max 11 digits
  return digits.slice(0, 11);
}

/**
 * Validates whether a phone number matches 03XXXXXXXXX (11 digits)
 */
export function isValidPhoneNumber(phone: string): boolean {
  const digits = (phone || '').replace(/\D/g, '');
  return /^03\d{9}$/.test(digits);
}

/**
 * Formats a raw or partial CNIC string with standard dashes:
 * 5 digits - 7 digits - 1 digit (XXXXX-XXXXXXX-X)
 * Enforces exactly 13 numeric digits max.
 */
export function formatCNIC(input: string): string {
  if (!input) return '';
  const digits = input.replace(/\D/g, '').slice(0, 13);
  if (digits.length === 0) return '';

  if (digits.length <= 5) {
    return digits;
  } else if (digits.length <= 12) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  } else {
    return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`;
  }
}

/**
 * Validates whether a CNIC string has full 13 digits in XXXXX-XXXXXXX-X format
 */
export function isValidCNIC(cnic: string): boolean {
  if (!cnic) return true; // optional in some places
  const digits = cnic.replace(/\D/g, '');
  return digits.length === 13;
}

/**
 * Checks whether an event/booking is currently active or upcoming
 * Excludes cancelled, concluded, closed, or completed events.
 */
export function isEventActiveOrUpcoming(booking: any): boolean {
  if (!booking) return false;
  const status = (booking.status || '').toLowerCase();
  if (
    status === 'cancelled' ||
    status === 'rejected' ||
    status === 'completed' ||
    status === 'concluded'
  ) {
    return false;
  }

  const op = (
    booking.operationalStatus ||
    booking.operational_status ||
    ''
  ).toLowerCase();
  if (
    op.includes('concluded') ||
    op.includes('completed') ||
    op.includes('closed') ||
    op.includes('cancelled')
  ) {
    return false;
  }

  return true;
}
