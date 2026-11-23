from datetime import datetime
from apps.venues.models import BlockedDate
from .models import Booking
from django.db import models

CLEANING_BUFFER_MINUTES = 60  # 1 hour reserved before and after every booking


def parse_to_minutes(t_str):
    """
    Parses various time string formats into minutes from midnight (0 to 1439).
    Handles:
    - '12:00', '16:30' (24-hour HH:MM)
    - '12:00 PM', '04:00 PM', '1:00 am', '11:30 pm' (12-hour hh:mm AM/PM)
    """
    if not t_str:
        return None
    t_str = str(t_str).strip()
    if not t_str:
        return None

    # Standardize whitespace and case
    clean_t = ' '.join(t_str.split()).upper()

    try:
        if 'AM' in clean_t or 'PM' in clean_t:
            # Handle formats like '01:00 PM' or '1:00 PM'
            # Try with %I:%M %p
            dt = datetime.strptime(clean_t, "%I:%M %p")
            return dt.hour * 60 + dt.minute
        elif ':' in clean_t:
            parts = clean_t.split(':')
            h = int(parts[0])
            m = int(parts[1][:2]) if len(parts) > 1 else 0
            return h * 60 + m
    except Exception:
        pass
    return None


def format_minutes_to_12h(total_minutes):
    """Converts minutes from midnight to 'hh:mm AM/PM'."""
    if total_minutes is None:
        return ""
    total_minutes = int(total_minutes) % (24 * 60)
    hours = total_minutes // 60
    minutes = total_minutes % 60
    period = "AM" if hours < 12 else "PM"
    h12 = hours % 12
    if h12 == 0:
        h12 = 12
    return f"{h12:02d}:{minutes:02d} {period}"


def format_time_str_to_12h(time_str):
    """Converts any time string or range (e.g. '18:00 - 23:00') into 12-hour format ('06:00 PM – 11:00 PM')."""
    if not time_str:
        return ""
    start_m, end_m = extract_start_end_minutes(time_str)
    if start_m is not None and end_m is not None:
        return f"{format_minutes_to_12h(start_m)} – {format_minutes_to_12h(end_m)}"
    elif start_m is not None:
        return format_minutes_to_12h(start_m)
    return str(time_str)


def extract_start_end_minutes(time_or_slot_str):
    """
    Extracts (start_minutes, end_minutes) from strings like:
    - '12:00 PM – 04:00 PM' (en-dash)
    - '12:00 PM - 04:00 PM' (hyphen)
    - '12:00 to 16:00'
    - 'Morning' or 'Evening'
    """
    if not time_or_slot_str:
        return None, None

    normalized = str(time_or_slot_str).replace('–', '-').replace('—', '-').replace(' TO ', '-').replace(' to ', '-')

    if '-' in normalized:
        parts = normalized.split('-')
        start_m = parse_to_minutes(parts[0])
        end_m = parse_to_minutes(parts[1])
        if start_m is not None and end_m is not None:
            if end_m <= start_m:
                end_m += 24 * 60
            return start_m, end_m

    lower = str(time_or_slot_str).lower()
    if 'morning' in lower or 'lunch' in lower or 'afternoon' in lower:
        return 12 * 60, 16 * 60  # 12:00 PM to 04:00 PM
    if 'evening' in lower or 'dinner' in lower or 'night' in lower:
        return 18 * 60, 23 * 60 + 30  # 06:00 PM to 11:30 PM

    # Single time like '18:00' or '6:00 PM'
    single_m = parse_to_minutes(time_or_slot_str)
    if single_m is not None:
        end_m = min(24 * 60 - 1, single_m + 5 * 60)
        return single_m, end_m

    return None, None


def check_hall_availability(
    hall_name,
    date_str,
    start_time_str=None,
    end_time_str=None,
    slot_str=None,
    time_str=None,
    exclude_booking_id=None
):
    """
    Strict collision and 1-hour turnover buffer validation.
    Returns:
        (is_available: bool, error_message: str, details_dict: dict)
    """
    if not hall_name or not date_str:
        return True, "", {}

    # Check maintenance dates first
    blocked = BlockedDate.objects.filter(
        start_date__lte=date_str,
        end_date__gte=date_str
    ).filter(models.Q(hall_name='All Halls') | models.Q(hall_name__iexact=hall_name)).first()

    if blocked:
        msg = f"Hall '{hall_name}' is blocked for maintenance on {date_str}: {blocked.reason}"
        return False, msg, {
            'conflictType': 'Maintenance',
            'reason': blocked.reason,
            'hall': hall_name,
            'date': date_str,
        }

    # Resolve requested start and end minutes
    req_start_m = parse_to_minutes(start_time_str)
    req_end_m = parse_to_minutes(end_time_str)

    if req_start_m is None or req_end_m is None:
        # Try extracting from time_str or slot_str
        s_m, e_m = extract_start_end_minutes(time_str or slot_str)
        if s_m is not None and e_m is not None:
            req_start_m, req_end_m = s_m, e_m

    # If still None and slot_str is morning/evening
    if (req_start_m is None or req_end_m is None) and slot_str:
        s_m, e_m = extract_start_end_minutes(slot_str)
        if s_m is not None and e_m is not None:
            req_start_m, req_end_m = s_m, e_m

    if req_start_m is not None and req_end_m is not None and req_end_m <= req_start_m:
        req_end_m += 24 * 60

    # Find existing active bookings for this hall and date
    bookings_qs = Booking.objects.filter(
        hall_name__iexact=hall_name,
        date=date_str
    ).exclude(status__in=['Cancelled', 'Rejected'])

    if exclude_booking_id:
        bookings_qs = bookings_qs.exclude(id=exclude_booking_id)

    for b in bookings_qs:
        b_start_m, b_end_m = extract_start_end_minutes(b.time or b.slot)

        if req_start_m is not None and req_end_m is not None and b_start_m is not None and b_end_m is not None:
            # Enforce 1-hour pre-cleaning and 1-hour post-cleaning buffer
            reserved_buffer_start = max(0, b_start_m - CLEANING_BUFFER_MINUTES)
            reserved_buffer_end = min(24 * 60, b_end_m + CLEANING_BUFFER_MINUTES)

            # Check overlap between [req_start_m, req_end_m] and [reserved_buffer_start, reserved_buffer_end]
            if max(req_start_m, reserved_buffer_start) < min(req_end_m, reserved_buffer_end):
                req_str = f"{format_minutes_to_12h(req_start_m)} – {format_minutes_to_12h(req_end_m)}"
                booked_str = f"{format_minutes_to_12h(b_start_m)} – {format_minutes_to_12h(b_end_m)}"
                buffer_str = f"{format_minutes_to_12h(reserved_buffer_start)} – {format_minutes_to_12h(reserved_buffer_end)}"

                error_msg = (
                    f"Conflict: '{hall_name}' is already booked on {date_str} from {booked_str} "
                    f"by {b.customer_name} ({b.booking_ref}). Including the mandatory 1-hour cleaning/turnover "
                    f"buffer ({buffer_str}), your selected time ({req_str}) cannot be booked."
                )

                return False, error_msg, {
                    'conflictType': 'BookingCollision',
                    'hall': hall_name,
                    'date': date_str,
                    'existingBooking': {
                        'id': b.id,
                        'ref': b.booking_ref,
                        'customer': b.customer_name,
                        'bookedTime': booked_str,
                        'bufferWindow': buffer_str,
                        'cleaningBufferMinutes': CLEANING_BUFFER_MINUTES,
                    },
                    'requestedTime': req_str,
                }
        else:
            # Fallback slot comparison if exact minutes could not be resolved
            b_slot = (b.slot or b.time or '').lower()
            req_slot = (slot_str or time_str or '').lower()
            is_b_lunch = any(k in b_slot for k in ['morning', 'lunch', 'afternoon'])
            is_b_dinner = any(k in b_slot for k in ['evening', 'dinner', 'night'])
            is_req_lunch = any(k in req_slot for k in ['morning', 'lunch', 'afternoon'])
            is_req_dinner = any(k in req_slot for k in ['evening', 'dinner', 'night'])

            if (is_b_lunch and is_req_lunch) or (is_b_dinner and is_req_dinner):
                error_msg = f"Conflict: '{hall_name}' is already booked for this slot on {date_str} by {b.customer_name} ({b.booking_ref})."
                return False, error_msg, {
                    'conflictType': 'SlotCollision',
                    'hall': hall_name,
                    'date': date_str,
                    'existingBooking': {
                        'id': b.id,
                        'ref': b.booking_ref,
                        'customer': b.customer_name,
                    }
                }

    return True, "", {}
