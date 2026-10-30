from django.core.management.base import BaseCommand
from apps.core.models import SystemSetting, AuditLogEntry
from apps.venues.models import Hall, BlockedDate
from apps.events_catering.models import EventTypeConfig, MenuPackage
from apps.customers.models import Customer
from apps.bookings.models import Booking, ExtraTimeRequest
from apps.inventory.models import InventoryItem
from apps.finance.models import InvoiceRecord, PaymentTransaction, ExpenseRecord
from apps.workforce.models import StaffMember, VendorPartner
from datetime import date, timedelta


class Command(BaseCommand):
    help = "Seeds initial demo data for Marriage Hall Management System"

    def handle(self, *args, **options):
        self.stdout.write("Seeding MHMS enterprise database...")

        # 1. System Settings
        setting, created = SystemSetting.objects.get_or_create(id=1)
        setting.business_name = "Grand Pearl Ballroom & Banquets"
        setting.head_office_address = "Plot 42, Club Road, Karachi, Pakistan"
        setting.contact_phone = "+92 21 111 505 505"
        setting.contact_email = "reservations@pearlbanquets.com"
        setting.is_fbr_enabled = True
        setting.ntn = "7291044-8"
        setting.strn = "3277876123456"
        setting.fbr_integrator = "SANDBOX-IMS-01"
        setting.fbr_pos_id = "POS-KAR-0102"
        setting.currency_symbol = "Rs."
        setting.default_tax_rate = 13.0
        setting.invoice_prefix = "INV-"
        setting.terms_and_conditions = (
            "1. Advance payment is 50% non-refundable upon cancellation within 14 days of scheduled event.\n"
            "2. Government POS levy and sales tax are applicable in accordance with FBR regulations.\n"
            "3. Hall overtime beyond scheduled slot is charged at prevailing hourly rate."
        )
        setting.custom_roles = ["Super Admin", "General Manager", "Floor Manager", "Accounts Officer", "Concierge"]
        setting.save()
        self.stdout.write("  [OK] System Settings seeded")

        # 2. Venues / Halls
        halls_data = [
            {
                "code": "HL-01",
                "name": "Grand Crystal Ballroom",
                "capacity": 800,
                "base_rent": 450000,
                "hourly_rate": 35000,
                "location_floor": "Ground Floor - West Wing",
                "facilities": ["Central HVAC", "Bridal Suite", "Stage Lighting", "VIP Valet Parking", "Dual 500kVA Generator"],
                "status": "Active",
                "dimension": "120 x 80 ft",
                "tier": "Diamond Luxury"
            },
            {
                "code": "HL-02",
                "name": "Royal Emerald Hall",
                "capacity": 450,
                "base_rent": 280000,
                "hourly_rate": 22000,
                "location_floor": "1st Floor - East Wing",
                "facilities": ["Central HVAC", "Bridal Lounge", "Ambient Chandeliers", "Acoustic Wall Paneling"],
                "status": "Active",
                "dimension": "90 x 55 ft",
                "tier": "Gold Executive"
            },
            {
                "code": "HL-03",
                "name": "Sapphire Banquet",
                "capacity": 300,
                "base_rent": 190000,
                "hourly_rate": 15000,
                "location_floor": "2nd Floor",
                "facilities": ["Air Conditioning", "Green Room", "Integrated Projector Screen", "PA Sound System"],
                "status": "Active",
                "dimension": "70 x 45 ft",
                "tier": "Silver Standard"
            },
            {
                "code": "HL-04",
                "name": "Imperial Courtyard Lawn",
                "capacity": 1200,
                "base_rent": 650000,
                "hourly_rate": 45000,
                "location_floor": "Outdoor Courtyard Gardens",
                "facilities": ["Water Fountain Stage", "Illuminated Palm Walkways", "Canopy Setup", "Dedicated Buffet Pavilion"],
                "status": "Active",
                "dimension": "180 x 140 ft",
                "tier": "Signature Outdoor"
            }
        ]

        for h in halls_data:
            Hall.objects.update_or_create(code=h["code"], defaults=h)
        self.stdout.write(f"  [OK] {len(halls_data)} Halls seeded")

        # 3. Event Types
        event_types = [
            {
                "name": "Barat Ceremony",
                "default_start_time": "19:30",
                "default_end_time": "00:00",
                "calendar_color": "#00685f",
                "description": "Traditional primary wedding banquet and dinner ceremony"
            },
            {
                "name": "Walima Reception",
                "default_start_time": "20:00",
                "default_end_time": "00:30",
                "calendar_color": "#0284c7",
                "description": "Formal groom reception dinner with couple stage and musical ambiance"
            },
            {
                "name": "Mehendi / Sangeet",
                "default_start_time": "19:00",
                "default_end_time": "23:45",
                "calendar_color": "#d97706",
                "description": "Vibrant festive music night with dance floor and floral stage"
            },
            {
                "name": "Corporate Annual Gala",
                "default_start_time": "18:00",
                "default_end_time": "22:30",
                "calendar_color": "#475569",
                "description": "Formal corporate dinner, awards presentation, and business symposium"
            }
        ]
        for et in event_types:
            EventTypeConfig.objects.update_or_create(name=et["name"], defaults=et)
        self.stdout.write(f"  [OK] {len(event_types)} Event Types seeded")

        # 4. Menu Packages
        packages = [
            {
                "package_code": "PKG-01",
                "name": "Royal Mughlai Grand Banquet",
                "price_per_head": 3200,
                "description": "Five-star imperial dinner buffet with live tandoor and BBQ skewers",
                "includedItems": [
                    "Mutton Kunna Gosht", "Chicken Reshmi Handi", "Beef Seekh Kabab Live",
                    "Mutton Dum Biryani with Zafran", "Tandoori Roghni & Garlic Naan",
                    "Shahi Kulfa & Hot Gulab Jamun", "Assorted Gourmet Salads & Mint Raita",
                    "Kashmiri Green Tea with Crushed Almonds"
                ],
                "status": "Active"
            },
            {
                "package_code": "PKG-02",
                "name": "Executive Heritage Feast",
                "price_per_head": 2450,
                "description": "Celebrated authentic wedding menu with gourmet dessert presentation",
                "includedItems": [
                    "Chicken Makhni Karahi", "Beef Bihari Boti Live", "Degi Chicken Biryani",
                    "Fresh Roghni Naan", "Shahi Gajar Halwa", "Fresh Garden Salads",
                    "Zeera Raita & Chutney", "Cardamom Tea"
                ],
                "status": "Active"
            },
            {
                "package_code": "PKG-03",
                "name": "Corporate Gala Buffet",
                "price_per_head": 1950,
                "description": "Continental and Oriental fusion buffet tailored for corporate executives",
                "includedItems": [
                    "Chicken Teriyaki Skewers", "Fettuccine Alfredo with Grilled Chicken",
                    "Singaporean Rice", "Assorted Canapés & Mini Sliders",
                    "Belgian Chocolate Mousse Cups", "Signature Coffee & Mocktail Bar"
                ],
                "status": "Active"
            }
        ]
        for p in packages:
            items = p.pop("includedItems")
            mp, _ = MenuPackage.objects.update_or_create(package_code=p["package_code"], defaults={**p, "included_items": items})
        self.stdout.write(f"  [OK] {len(packages)} Menu Packages seeded")

        # 5. Customers
        customers = [
            {
                "customer_id": "CUST-1001",
                "name": "Chaudhry Tariq Mehmood",
                "phone": "+92 300 8451920",
                "email": "tariq.mehmood@bizgroup.com.pk",
                "cnic": "35202-1849201-3",
                "address": "House 14, Street 9, DHA Phase 6, Karachi",
                "total_bookings": 2,
                "lifetime_value": 1450000,
                "status": "Active",
                "tier": "VIP"
            },
            {
                "customer_id": "CUST-1002",
                "name": "Syed Imran Hashmi",
                "phone": "+92 321 4458921",
                "email": "imran.hashmi@gmail.com",
                "cnic": "42101-7782910-1",
                "address": "Apartment 4B, Creek Vistas, Clifton, Karachi",
                "total_bookings": 1,
                "lifetime_value": 620000,
                "status": "Active",
                "tier": "Standard"
            },
            {
                "customer_id": "CUST-1003",
                "name": "Dr. Ayesha Siddiqui",
                "phone": "+92 333 5129034",
                "email": "ayesha.siddiqui@hospital.edu.pk",
                "cnic": "37405-9918234-2",
                "address": "B-32, PECHS Block 6, Karachi",
                "total_bookings": 1,
                "lifetime_value": 980000,
                "status": "Active",
                "tier": "Corporate"
            }
        ]
        for c in customers:
            Customer.objects.update_or_create(customer_id=c["customer_id"], defaults=c)
        self.stdout.write(f"  [OK] {len(customers)} Customers seeded")

        # 6. Bookings & Invoices & Transactions
        today = date.today()
        bookings_data = [
            {
                "booking_ref": "BK-20491",
                "customer_name": "Chaudhry Tariq Mehmood",
                "contact_ref": "+92 300 8451920",
                "event_type": "Barat Ceremony",
                "hall_name": "Grand Crystal Ballroom",
                "date": today + timedelta(days=5),
                "time": "07:30 PM – 11:30 PM",
                "slot": "07:30 PM – 11:30 PM (Evening)",
                "status": "Confirmed",
                "payment_status": "Partial",
                "amount": 950000,
                "advance_payment": 500000,
                "guest_count": 650,
                "seatingArrangement": "Round Banquet Tables with Centerpieces",
                "menuPackage": "Royal Mughlai Grand Banquet"
            },
            {
                "booking_ref": "BK-20492",
                "customer_name": "Syed Imran Hashmi",
                "contact_ref": "+92 321 4458921",
                "event_type": "Walima Reception",
                "hall_name": "Royal Emerald Hall",
                "date": today + timedelta(days=12),
                "time": "08:00 PM – 12:00 AM",
                "slot": "08:00 PM – 12:00 AM (Night)",
                "status": "Confirmed",
                "payment_status": "Paid",
                "amount": 620000,
                "advance_payment": 620000,
                "guest_count": 350,
                "seatingArrangement": "Theater Style Stage View",
                "menuPackage": "Executive Heritage Feast"
            },
            {
                "booking_ref": "BK-20493",
                "customer_name": "Dr. Ayesha Siddiqui",
                "contact_ref": "+92 333 5129034",
                "event_type": "Corporate Annual Gala",
                "hall_name": "Imperial Courtyard Lawn",
                "date": today + timedelta(days=18),
                "time": "06:00 PM – 10:30 PM",
                "slot": "06:00 PM – 10:30 PM (Evening)",
                "status": "Under Review",
                "payment_status": "Unpaid",
                "amount": 980000,
                "advance_payment": 0,
                "guest_count": 500,
                "seatingArrangement": "Cabaret Style with Podium",
                "menuPackage": "Corporate Gala Buffet"
            }
        ]

        for bk in bookings_data:
            seating = bk.pop("seatingArrangement", "")
            menu = bk.pop("menuPackage", "")
            b_obj, _ = Booking.objects.update_or_create(
                booking_ref=bk["booking_ref"],
                defaults={
                    **bk,
                    "seating_arrangement": seating,
                    "menu_package": menu
                }
            )

            # Invoice
            inv_id = f"INV-{b_obj.booking_ref.replace('BK-', '')}"
            rem_bal = max(0.0, float(b_obj.amount) - float(b_obj.advance_payment))
            InvoiceRecord.objects.update_or_create(
                invoice_id=inv_id,
                defaults={
                    "booking_id": b_obj.booking_ref,
                    "customer_name": b_obj.customer_name,
                    "total_amount": b_obj.amount,
                    "paid_amount": b_obj.advance_payment,
                    "remaining_balance": rem_bal,
                    "payment_status": b_obj.payment_status if b_obj.payment_status in ['Paid', 'Partial', 'Unpaid'] else 'Unpaid',
                    "date": b_obj.date
                }
            )

            if b_obj.advance_payment > 0:
                PaymentTransaction.objects.update_or_create(
                    txn_ref=f"TXN-{b_obj.booking_ref.replace('BK-', '')}",
                    defaults={
                        "category": "Booking Advance",
                        "channel": "Bank Transfer",
                        "billing_status": "Settled",
                        "amount": b_obj.advance_payment,
                        "timestamp": str(b_obj.date),
                        "booking_ref": b_obj.booking_ref
                    }
                )
        self.stdout.write(f"  [OK] {len(bookings_data)} Bookings, Invoices & Transactions seeded")

        # 7. Inventory Items
        inventory = [
            {
                "item_code": "INV-1001",
                "item_name": "Chiavari Gold Dining Chairs",
                "category": "Furniture",
                "total_quantity": 850,
                "available_quantity": 700,
                "in_use_quantity": 150,
                "reserved_quantity": 0,
                "condition": "Good",
                "storage_location": "Main Furniture Store A"
            },
            {
                "item_code": "INV-1002",
                "item_name": "Round Banquet Tables (60-inch)",
                "category": "Furniture",
                "total_quantity": 120,
                "available_quantity": 105,
                "in_use_quantity": 15,
                "reserved_quantity": 0,
                "condition": "Good",
                "storage_location": "Main Furniture Store B"
            },
            {
                "item_code": "INV-1003",
                "item_name": "Stainless Steel Roll-Top Chafing Dishes",
                "category": "Catering Crockery",
                "total_quantity": 60,
                "available_quantity": 48,
                "in_use_quantity": 12,
                "reserved_quantity": 0,
                "condition": "Good",
                "storage_location": "Kitchen Storage Room 2"
            },
            {
                "item_code": "INV-1004",
                "item_name": "RGB LED Stage Par Spotlights",
                "category": "Audio/Visual",
                "total_quantity": 40,
                "available_quantity": 32,
                "in_use_quantity": 8,
                "reserved_quantity": 0,
                "condition": "Good",
                "storage_location": "AV Control Booth"
            }
        ]
        for inv in inventory:
            InventoryItem.objects.update_or_create(item_code=inv["item_code"], defaults=inv)
        self.stdout.write(f"  [OK] {len(inventory)} Inventory items seeded")

        # 8. Workforce (Staff & Vendors)
        staff = [
            {
                "employee_id": "EMP-401",
                "full_name": "Kamran Zafar",
                "role": "General Manager",
                "contact_number": "+92 301 5567812",
                "shift_timing": "10:00 AM - 07:00 PM",
                "status": "Active"
            },
            {
                "employee_id": "EMP-402",
                "full_name": "Mohammad Rizwan",
                "role": "Floor Staff",
                "contact_number": "+92 312 8891023",
                "shift_timing": "04:00 PM - 01:00 AM",
                "status": "Active"
            },
            {
                "employee_id": "EMP-403",
                "full_name": "Sajid Ali",
                "role": "Floor Staff",
                "contact_number": "+92 334 2209184",
                "shift_timing": "04:00 PM - 01:00 AM",
                "status": "Active"
            }
        ]
        for st in staff:
            StaffMember.objects.update_or_create(employee_id=st["employee_id"], defaults=st)

        vendors = [
            {
                "vendor_id": "VEN-201",
                "business_name": "Flora Elegance Floral & Stage Decorators",
                "category": "Decorator",
                "contact_person": "Bilal Siddique",
                "phone_number": "+92 322 9901234"
            },
            {
                "vendor_id": "VEN-202",
                "business_name": "Luminary Acoustics & Stage Lighting",
                "category": "Sound/Lights",
                "contact_person": "Rehan Butt",
                "phone_number": "+92 345 6678192"
            }
        ]
        for vn in vendors:
            VendorPartner.objects.update_or_create(vendor_id=vn["vendor_id"], defaults=vn)
        self.stdout.write(f"  [OK] Staff & Vendors seeded")

        # 9. Expenses
        expenses = [
            {
                "expense_ref": "EXP-301",
                "category": "Utilities & Generators",
                "vendor": "National Petroleum Supplies",
                "amount": 85000,
                "approved_by": "Kamran Zafar",
                "date": str(today - timedelta(days=2)),
                "payment_method": "Bank Transfer"
            },
            {
                "expense_ref": "EXP-302",
                "category": "Kitchen Fresh Produce",
                "vendor": "Sabzi Mandi Wholesale Dist.",
                "amount": 42000,
                "approved_by": "Kamran Zafar",
                "date": str(today - timedelta(days=1)),
                "payment_method": "Cash on Delivery"
            }
        ]
        for exp in expenses:
            ExpenseRecord.objects.update_or_create(expense_ref=exp["expense_ref"], defaults=exp)
        self.stdout.write(f"  [OK] Expenses seeded")

        # 10. Audit Log
        AuditLogEntry.objects.create(
            log_id="LOG-1001",
            user_name="Super Admin",
            user_role="Admin",
            action="Created",
            module="Core Setup",
            details="Database populated with enterprise production baseline seed records",
            ip_address="127.0.0.1"
        )
        self.stdout.write("  [OK] Audit Log seeded")

        self.stdout.write(self.style.SUCCESS("All demo data seeded successfully!"))
