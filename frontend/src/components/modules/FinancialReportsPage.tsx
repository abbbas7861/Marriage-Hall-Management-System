import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  BarChart3,
  DollarSign,
  Download,
  TrendingDown,
  TrendingUp,
  FileText,
  Printer,
  BookOpen,
  Scale,
  Calendar,
  Layers,
  CheckCircle2,
  Receipt,
  Filter,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  SEED_EXPENSE_BREAKDOWN,
  SEED_FINANCIAL_TREND,
  SEED_MONTHLY_SUMMARY,
} from '../../data/seedData';
import {
  reportsApi,
  bookingsApi,
  expensesApi,
  invoicesApi,
  vendorsApi,
  pantryApi,
  paymentsApi,
  settingsApi,
} from '../../api/client';
import { Booking } from '../../types';

export type ReportType =
  | 'overview'
  | 'balance-sheet'
  | 'general-journal'
  | 'general-ledger'
  | 'trial-balance'
  | 'profit-loss';

export interface MonthlySummaryRow {
  month: string;
  totalBookings: number;
  grossRevenue: number;
  totalExpenses: number;
  netProfit: number;
}

export const FinancialReportsPage: React.FC = () => {
  const [activeReport, setActiveReport] = useState<ReportType>('overview');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedEventRef, setSelectedEventRef] = useState<string>('All Events');

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [pantryStock, setPantryStock] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [depositSettlements, setDepositSettlements] = useState<any[]>([]);
  const [systemSettings, setSystemSettings] = useState<any>(null);
  const [trendData, setTrendData] = useState<any[]>(SEED_FINANCIAL_TREND);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummaryRow[]>(SEED_MONTHLY_SUMMARY);
  const [expenseBreakdownData, setExpenseBreakdownData] = useState<any[]>(SEED_EXPENSE_BREAKDOWN);
  const [loading, setLoading] = useState(true);

  // Load all foundational records for real double-entry computation
  useEffect(() => {
    setLoading(true);
    Promise.all([
      bookingsApi.list().catch(() => []),
      invoicesApi.list().catch(() => []),
      expensesApi.list().catch(() => []),
      vendorsApi.list().catch(() => []),
      pantryApi.listItems().catch(() => []),
      paymentsApi.list().catch(() => []),
      invoicesApi.listDepositSettlements().catch(() => []),
      settingsApi.get().catch(() => null),
      reportsApi.getSummary({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        bookingRef: selectedEventRef !== 'All Events' ? selectedEventRef : undefined,
      }).catch(() => null),
    ])
      .then(([bData, iData, eData, vData, pData, payData, depData, setData, repData]) => {
        setBookings(bData || []);
        setInvoices(iData || []);
        setExpenses(eData || []);
        setVendors(vData || []);
        setPantryStock(pData || []);
        setPayments(payData || []);
        setDepositSettlements(depData || []);
        if (setData) setSystemSettings(setData);

        if (repData) {
          if (repData.monthly_breakdown && repData.monthly_breakdown.length > 0) {
            setTrendData(
              repData.monthly_breakdown.map((m: any) => ({
                month: m.month,
                revenue: m.revenue || 0,
                expenses: m.expenses || 0,
              }))
            );
            setMonthlySummary(
              repData.monthly_breakdown.map((m: any) => ({
                month: m.month,
                totalBookings: m.totalBookings || 4,
                grossRevenue: m.revenue || 0,
                totalExpenses: m.expenses || 0,
                netProfit: (m.revenue || 0) - (m.expenses || 0),
              }))
            );
          }
          if (repData.expense_breakdown && repData.expense_breakdown.length > 0) {
            setExpenseBreakdownData(repData.expense_breakdown);
          }
        }
      })
      .finally(() => setLoading(false));
  }, [startDate, endDate, selectedEventRef]);

  // Filtered dataset based on Date-to-Date & Event filter
  const filteredData = useMemo(() => {
    const isEventMatch = (ref?: string) =>
      selectedEventRef === 'All Events' || ref === selectedEventRef;

    const isDateMatch = (d?: string) => {
      if (!d) return true;
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    };

    const curBookings = bookings.filter(
      (b) => isEventMatch(b.bookingRef) && isDateMatch(b.date)
    );
    const curInvoices = invoices.filter((inv) => {
      const bRef = inv.bookingId || inv.bookingRef;
      return isEventMatch(bRef) && isDateMatch(inv.date);
    });
    const curExpenses = expenses.filter(
      (exp) => isEventMatch(exp.bookingRef) && isDateMatch(exp.date)
    );
    const curDeposits = depositSettlements.filter(
      (d) => isEventMatch(d.bookingRef || d.booking_ref) && isDateMatch(d.eventDate || d.event_date)
    );
    const curPayments = payments.filter(
      (p) => isEventMatch(p.bookingRef || p.booking_ref) && isDateMatch(String(p.timestamp || p.created_at || '').slice(0, 10))
    );

    // Build quick booking lookup by ref
    const bookingByRef = new Map<string, Booking>();
    curBookings.forEach((b) => {
      if (b.bookingRef) bookingByRef.set(b.bookingRef, b);
    });

    // Aggregate revenue streams & discounts
    let recognizedRevenue = 0;
    let cashCollected = 0;
    let totalDiscounts = 0;
    let hallRentRevenue = 0;
    let cateringRevenue = 0;
    let decorDjRevenue = 0;
    let otherExtrasRevenue = 0;
    let cancellationFeeRevenue = 0;
    let retainedCreditsLiability = 0;

    curInvoices.forEach((inv) => {
      const bRef = inv.bookingId || inv.bookingRef;
      const matchedBooking = bookingByRef.get(bRef);
      const isCancelled = inv.status === 'Cancelled' || inv.paymentStatus === 'Cancelled';

      if (isCancelled) {
        const crec = inv.cancellationRecord || inv.cancellation_record || matchedBooking?.cancellationRecord || {};
        const retainedFee = Number(crec.deduction_amount ?? crec.amount_used ?? 0);
        const retainedCredit = Number(crec.retained_credit ?? 0);
        recognizedRevenue += retainedFee;
        cancellationFeeRevenue += retainedFee;
        cashCollected += retainedFee + retainedCredit;
        retainedCreditsLiability += retainedCredit;
      } else {
        const netTotal = Number(inv.totalAmount || 0);
        const paid = Number(inv.paidAmount || 0);
        recognizedRevenue += netTotal;
        cashCollected += paid;

        if (matchedBooking) {
          const disc = Number(matchedBooking.discountAmount || 0);
          const hRent = Number(matchedBooking.hallRent || 0);
          const mAmt = Number(matchedBooking.menuAmount || 0);
          const dAmt = Number(matchedBooking.decorAmount || 0) + Number(matchedBooking.djAmount || 0);
          const allocated = hRent + mAmt + dAmt - disc;
          totalDiscounts += disc;
          hallRentRevenue += hRent;
          cateringRevenue += mAmt;
          decorDjRevenue += dAmt;
          if (netTotal > allocated && (hRent > 0 || mAmt > 0 || dAmt > 0)) {
            otherExtrasRevenue += (netTotal - allocated);
          } else if (hRent === 0 && mAmt === 0 && dAmt === 0) {
            hallRentRevenue += netTotal + disc;
          }
        } else {
          hallRentRevenue += netTotal;
        }
      }
    });

    if (curInvoices.length === 0 && curBookings.length > 0) {
      curBookings.forEach((b) => {
        const isCancelled = b.status === 'Cancelled' || (b.paymentStatus as string) === 'Refunded';
        if (isCancelled) {
          const crec: any = b.cancellationRecord || {};
          const retainedFee = Number(crec.deduction_amount ?? crec.amount_used ?? 0);
          const retainedCredit = Number(crec.retained_credit ?? 0);
          recognizedRevenue += retainedFee;
          cancellationFeeRevenue += retainedFee;
          cashCollected += retainedFee + retainedCredit;
          retainedCreditsLiability += retainedCredit;
        } else {
          const netTotal = Number(b.amount || 0);
          const paid = Number(b.advancePayment || 0);
          const disc = Number(b.discountAmount || 0);
          recognizedRevenue += netTotal;
          cashCollected += paid;
          totalDiscounts += disc;
          hallRentRevenue += Number(b.hallRent || 0) || netTotal + disc;
          cateringRevenue += Number(b.menuAmount || 0);
          decorDjRevenue += Number(b.decorAmount || 0) + Number(b.djAmount || 0);
        }
      });
    }

    // Security Deposits currently held (liability)
    const securityDepositsHeld = curDeposits
      .filter((d) => d.status === 'Held')
      .reduce((s, d) => s + Number(d.depositHeld ?? d.deposit_held ?? 0), 0);

    // Unpaid Vendor Balances (Accounts Payable) when viewing cumulative/overall
    const unpaidVendorPayables =
      selectedEventRef === 'All Events'
        ? vendors.reduce((s, v) => s + Math.max(0, Number(v.balanceDue ?? v.balance_due ?? 0)), 0)
        : 0;

    // Pantry Inventory Valuation (Asset) when viewing overall
    const inventoryAssetValue =
      selectedEventRef === 'All Events'
        ? pantryStock.reduce(
            (s, item) =>
              s + Number(item.currentStock ?? item.current_stock ?? 0) * Number(item.unitPrice ?? item.unit_price ?? 0),
            0
          )
        : 0;

    // Paid vs Unpaid ExpenseRecords
    const paidExpensesTotal = curExpenses
      .filter((e) => e.status !== 'Pending' && e.status !== 'Unpaid')
      .reduce((s, e) => s + Number(e.amount || 0), 0);
    const unpaidExpensesTotal = curExpenses
      .filter((e) => e.status === 'Pending' || e.status === 'Unpaid')
      .reduce((s, e) => s + Number(e.amount || 0), 0);

    const receivables = Math.max(0, recognizedRevenue - (cashCollected - retainedCreditsLiability));
    const totalExpenses = paidExpensesTotal + unpaidExpensesTotal + unpaidVendorPayables;
    const netProfit = recognizedRevenue - totalExpenses;
    const profitMargin =
      recognizedRevenue > 0
        ? ((netProfit / recognizedRevenue) * 100).toFixed(1)
        : (netProfit < 0 ? '-100.0' : '0.0');

    return {
      bookings: curBookings,
      invoices: curInvoices,
      expenses: curExpenses,
      deposits: curDeposits,
      payments: curPayments,
      recognizedRevenue,
      cashCollected,
      receivables,
      totalDiscounts,
      hallRentRevenue,
      cateringRevenue,
      decorDjRevenue,
      otherExtrasRevenue,
      cancellationFeeRevenue,
      retainedCreditsLiability,
      securityDepositsHeld,
      unpaidVendorPayables,
      inventoryAssetValue,
      paidExpensesTotal,
      unpaidExpensesTotal,
      totalExpenses,
      netProfit,
      profitMargin,
    };
  }, [bookings, invoices, expenses, depositSettlements, payments, vendors, pantryStock, startDate, endDate, selectedEventRef]);

  // Double-Entry Calculations: Ledger accounts & Journal entries
  const doubleEntryData = useMemo(() => {
    const journalEntries: Array<{
      date: string;
      ref: string;
      description: string;
      debitAccount: string;
      creditAccount: string;
      amount: number;
    }> = [];

    // 1. Invoicing & Booking contracts (Active vs Cancelled)
    filteredData.invoices.forEach((inv) => {
      const isCancelled = inv.status === 'Cancelled' || inv.paymentStatus === 'Cancelled';
      const invDate = inv.date || new Date().toISOString().slice(0, 10);

      if (isCancelled) {
        const crec = inv.cancellationRecord || inv.cancellation_record || {};
        const retainedFee = Number(crec.deduction_amount ?? crec.amount_used ?? 0);
        const retainedCredit = Number(crec.retained_credit ?? 0);

        if (retainedFee > 0) {
          journalEntries.push({
            date: invDate,
            ref: `CANC-${inv.invoiceId || inv.bookingId}`,
            description: `Cancellation Fee Retained - ${inv.customerName || 'Client'} (${inv.bookingId})`,
            debitAccount: '1010 Cash & Bank',
            creditAccount: '4050 Cancellation & Forfeiture Fees',
            amount: retainedFee,
          });
        }
        if (retainedCredit > 0) {
          journalEntries.push({
            date: invDate,
            ref: `CRED-${inv.invoiceId || inv.bookingId}`,
            description: `Paused Booking Credit Held - ${inv.customerName || 'Client'} (${inv.bookingId})`,
            debitAccount: '1010 Cash & Bank',
            creditAccount: '2025 Customer Retained Credits (Unearned)',
            amount: retainedCredit,
          });
        }
        return;
      }

      const amt = Number(inv.totalAmount || 0);
      if (amt > 0) {
        journalEntries.push({
          date: invDate,
          ref: inv.invoiceId || inv.bookingId,
          description: `Contract Billing - ${inv.customerName || 'Client'} (${inv.bookingId})`,
          debitAccount: '1020 Accounts Receivable',
          creditAccount: '4010 Event Revenue (Venue & Catering)',
          amount: amt,
        });
      }

      // Payments received: Debit Cash & Bank (1010), Credit Accounts Receivable (1020)
      const paid = Number(inv.paidAmount || 0);
      if (paid > 0) {
        journalEntries.push({
          date: invDate,
          ref: `RCP-${inv.invoiceId || inv.bookingId}`,
          description: `Payment Collection - ${inv.customerName || 'Client'}`,
          debitAccount: '1010 Cash & Bank',
          creditAccount: '1020 Accounts Receivable',
          amount: paid,
        });
      }
    });

    // Fallback if no explicit invoices: map bookings
    if (filteredData.invoices.length === 0 && filteredData.bookings.length > 0) {
      filteredData.bookings.forEach((b) => {
        const isCancelled = b.status === 'Cancelled' || (b.paymentStatus as string) === 'Refunded';
        const bDate = b.date || new Date().toISOString().slice(0, 10);
        if (isCancelled) {
          const crec: any = b.cancellationRecord || {};
          const retainedFee = Number(crec.deduction_amount ?? crec.amount_used ?? 0);
          const retainedCredit = Number(crec.retained_credit ?? 0);
          if (retainedFee > 0) {
            journalEntries.push({
              date: bDate,
              ref: `CANC-${b.bookingRef}`,
              description: `Cancellation Fee Retained - ${b.customerName}`,
              debitAccount: '1010 Cash & Bank',
              creditAccount: '4050 Cancellation & Forfeiture Fees',
              amount: retainedFee,
            });
          }
          if (retainedCredit > 0) {
            journalEntries.push({
              date: bDate,
              ref: `CRED-${b.bookingRef}`,
              description: `Paused Booking Credit Held - ${b.customerName}`,
              debitAccount: '1010 Cash & Bank',
              creditAccount: '2025 Customer Retained Credits (Unearned)',
              amount: retainedCredit,
            });
          }
          return;
        }

        const amt = Number(b.amount || 0);
        const paid = Number(b.advancePayment || 0);
        if (amt > 0) {
          journalEntries.push({
            date: bDate,
            ref: b.bookingRef,
            description: `Event Contract - ${b.customerName} (${b.hallName})`,
            debitAccount: '1020 Accounts Receivable',
            creditAccount: '4010 Event Revenue (Venue & Catering)',
            amount: amt,
          });
        }
        if (paid > 0) {
          journalEntries.push({
            date: bDate,
            ref: `RCP-${b.bookingRef}`,
            description: `Advance Collection - ${b.customerName}`,
            debitAccount: '1010 Cash & Bank',
            creditAccount: '1020 Accounts Receivable',
            amount: paid,
          });
        }
      });
    }

    // 2. Security Deposits Held (Liability)
    filteredData.deposits
      .filter((d) => d.status === 'Held')
      .forEach((d) => {
        const depAmt = Number(d.depositHeld ?? d.deposit_held ?? 0);
        if (depAmt > 0) {
          journalEntries.push({
            date: d.eventDate || d.event_date || new Date().toISOString().slice(0, 10),
            ref: d.settlementRef || d.settlement_ref || `DEP-${d.bookingRef || d.id}`,
            description: `Security Deposit Held - ${d.customerName || d.customer_name} (${d.bookingRef || d.booking_ref})`,
            debitAccount: '1010 Cash & Bank',
            creditAccount: '2020 Customer Security Deposits Held',
            amount: depAmt,
          });
        }
      });

    // 3. Expenses incurred: Debit Expense Category (50xx), Credit Cash & Bank (1010) or Accounts Payable (2010)
    filteredData.expenses.forEach((exp) => {
      const amt = Number(exp.amount || 0);
      if (amt <= 0) return;
      let debitAcc = '5040 General Hall & Operations Expense';
      if (exp.category === 'Food' || exp.category === 'Kitchen Pantry') debitAcc = '5010 Direct Kitchen & Food Procurement';
      else if (exp.category?.includes('Vendor') || exp.category?.includes('Supplier')) debitAcc = '5015 Supplier & Vendor Purchases';
      else if (exp.category === 'Outside Waiters') debitAcc = '5020 Outside Waiters & Event Labor';
      else if (exp.category === 'Staff Payroll / Salaries' || exp.category === 'Staff' || exp.category?.includes('Salary') || exp.category?.includes('Payroll')) {
        debitAcc = '5025 Staff Salaries & Payroll Expense';
      }
      else if (exp.category === 'Operational Funds') debitAcc = '5030 Operational Floor Disbursements';
      else if (exp.category === 'Decor') debitAcc = '5050 Stage & Floral Setup Cost';
      else if (exp.category === 'Utilities') debitAcc = '5060 Utilities (Electricity, Gas, Water)';
      else if (exp.category === 'Maintenance') debitAcc = '5070 Facility Maintenance & Repairs';
      else if (exp.category === 'Supplies') debitAcc = '5080 Event Supplies & Consumables';

      const isUnpaid = exp.status === 'Pending' || exp.status === 'Unpaid';
      journalEntries.push({
        date: exp.date || new Date().toISOString().slice(0, 10),
        ref: exp.expenseRef || `EXP-${exp.id}`,
        description: `${exp.category}: ${exp.description || exp.vendor || 'Expense'} (${exp.bookingRef || 'General'})`,
        debitAccount: debitAcc,
        creditAccount: isUnpaid ? '2010 Accounts Payable (Vendors & Suppliers)' : '1010 Cash & Bank',
        amount: amt,
      });
    });

    // 4. Unpaid Vendor Bills (Accounts Payable)
    if (selectedEventRef === 'All Events') {
      vendors.forEach((v) => {
        const bal = Math.max(0, Number(v.balanceDue ?? v.balance_due ?? 0));
        if (bal > 0) {
          journalEntries.push({
            date: endDate || new Date().toISOString().slice(0, 10),
            ref: `AP-${v.vendorId || v.vendor_id || v.id}`,
            description: `Unpaid Trade Payable - ${v.businessName || v.business_name} (${v.category})`,
            debitAccount: '5015 Supplier & Vendor Purchases',
            creditAccount: '2010 Accounts Payable (Vendors & Suppliers)',
            amount: bal,
          });
        }
      });

      // 5. Pantry Inventory Valuation
      if (filteredData.inventoryAssetValue > 0) {
        journalEntries.push({
          date: endDate || new Date().toISOString().slice(0, 10),
          ref: 'INV-VAL',
          description: 'Kitchen & Pantry Stock on Hand Valuation',
          debitAccount: '1030 Kitchen & Pantry Asset Inventory',
          creditAccount: '3020 Capital & Inventory Reserve',
          amount: filteredData.inventoryAssetValue,
        });
      }
    }

    // Build Ledgers from journal entries
    const ledgerMap: Record<
      string,
      { code: string; name: string; type: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense'; debits: number; credits: number; transactions: any[] }
    > = {
      '1010 Cash & Bank': { code: '1010', name: 'Cash & Bank', type: 'Asset', debits: 0, credits: 0, transactions: [] },
      '1020 Accounts Receivable': { code: '1020', name: 'Accounts Receivable', type: 'Asset', debits: 0, credits: 0, transactions: [] },
      '1030 Kitchen & Pantry Asset Inventory': { code: '1030', name: 'Kitchen & Pantry Asset Inventory', type: 'Asset', debits: 0, credits: 0, transactions: [] },
      '2010 Accounts Payable (Vendors & Suppliers)': { code: '2010', name: 'Accounts Payable (Vendors & Suppliers)', type: 'Liability', debits: 0, credits: 0, transactions: [] },
      '2020 Customer Security Deposits Held': { code: '2020', name: 'Customer Security Deposits Held', type: 'Liability', debits: 0, credits: 0, transactions: [] },
      '2025 Customer Retained Credits (Unearned)': { code: '2025', name: 'Customer Retained Credits (Unearned)', type: 'Liability', debits: 0, credits: 0, transactions: [] },
      '3020 Capital & Inventory Reserve': { code: '3020', name: 'Capital & Inventory Reserve', type: 'Equity', debits: 0, credits: 0, transactions: [] },
      '4010 Event Revenue (Venue & Catering)': { code: '4010', name: 'Event Revenue (Venue & Catering)', type: 'Revenue', debits: 0, credits: 0, transactions: [] },
      '4050 Cancellation & Forfeiture Fees': { code: '4050', name: 'Cancellation & Forfeiture Fees', type: 'Revenue', debits: 0, credits: 0, transactions: [] },
      '5010 Direct Kitchen & Food Procurement': { code: '5010', name: 'Direct Kitchen & Food Procurement', type: 'Expense', debits: 0, credits: 0, transactions: [] },
      '5015 Supplier & Vendor Purchases': { code: '5015', name: 'Supplier & Vendor Purchases', type: 'Expense', debits: 0, credits: 0, transactions: [] },
      '5020 Outside Waiters & Event Labor': { code: '5020', name: 'Outside Waiters & Event Labor', type: 'Expense', debits: 0, credits: 0, transactions: [] },
      '5025 Staff Salaries & Payroll Expense': { code: '5025', name: 'Staff Salaries & Payroll Expense', type: 'Expense', debits: 0, credits: 0, transactions: [] },
      '5030 Operational Floor Disbursements': { code: '5030', name: 'Operational Floor Disbursements', type: 'Expense', debits: 0, credits: 0, transactions: [] },
      '5040 General Hall & Operations Expense': { code: '5040', name: 'General Hall & Operations Expense', type: 'Expense', debits: 0, credits: 0, transactions: [] },
      '5050 Stage & Floral Setup Cost': { code: '5050', name: 'Stage & Floral Setup Cost', type: 'Expense', debits: 0, credits: 0, transactions: [] },
      '5060 Utilities (Electricity, Gas, Water)': { code: '5060', name: 'Utilities (Electricity, Gas, Water)', type: 'Expense', debits: 0, credits: 0, transactions: [] },
      '5070 Facility Maintenance & Repairs': { code: '5070', name: 'Facility Maintenance & Repairs', type: 'Expense', debits: 0, credits: 0, transactions: [] },
      '5080 Event Supplies & Consumables': { code: '5080', name: 'Event Supplies & Consumables', type: 'Expense', debits: 0, credits: 0, transactions: [] },
    };

    journalEntries.forEach((entry) => {
      if (!ledgerMap[entry.debitAccount]) {
        ledgerMap[entry.debitAccount] = {
          code: entry.debitAccount.slice(0, 4),
          name: entry.debitAccount,
          type: 'Expense',
          debits: 0,
          credits: 0,
          transactions: [],
        };
      }
      ledgerMap[entry.debitAccount].debits += entry.amount;
      ledgerMap[entry.debitAccount].transactions.push({
        date: entry.date,
        ref: entry.ref,
        desc: entry.description,
        debit: entry.amount,
        credit: 0,
      });

      if (!ledgerMap[entry.creditAccount]) {
        ledgerMap[entry.creditAccount] = {
          code: entry.creditAccount.slice(0, 4),
          name: entry.creditAccount,
          type: 'Liability',
          debits: 0,
          credits: 0,
          transactions: [],
        };
      }
      ledgerMap[entry.creditAccount].credits += entry.amount;
      ledgerMap[entry.creditAccount].transactions.push({
        date: entry.date,
        ref: entry.ref,
        desc: entry.description,
        debit: 0,
        credit: entry.amount,
      });
    });

    // Trial Balance items
    const trialBalanceItems = Object.entries(ledgerMap)
      .filter(([_, acc]) => acc.debits > 0 || acc.credits > 0)
      .map(([accName, acc]) => {
        const net = acc.debits - acc.credits;
        return {
          account: accName,
          code: acc.code,
          type: acc.type,
          debit: net > 0 ? net : 0,
          credit: net < 0 ? Math.abs(net) : 0,
        };
      });

    const totalTBDebits = trialBalanceItems.reduce((s, i) => s + i.debit, 0);
    const totalTBCredits = trialBalanceItems.reduce((s, i) => s + i.credit, 0);

    // Balance Sheet items directly derived from Ledger Accounts (100% consistent)
    const cashLedger = ledgerMap['1010 Cash & Bank'];
    const cashBalance = cashLedger.debits - cashLedger.credits;
    const arLedger = ledgerMap['1020 Accounts Receivable'];
    const arBalance = Math.max(0, arLedger.debits - arLedger.credits);
    const inventoryBalance = filteredData.inventoryAssetValue;

    const assetCash = Math.max(0, cashBalance);
    const totalAssets = assetCash + arBalance + inventoryBalance;

    const apLedger = ledgerMap['2010 Accounts Payable (Vendors & Suppliers)'];
    const accountsPayable = Math.max(0, apLedger.credits - apLedger.debits);
    const securityDeposits = filteredData.securityDepositsHeld;
    const retainedCredits = filteredData.retainedCreditsLiability;
    const liabilityOverdraft = cashBalance < 0 ? Math.abs(cashBalance) : 0;
    const totalLiabilities = accountsPayable + securityDeposits + retainedCredits + liabilityOverdraft;

    const retainedEarnings = filteredData.netProfit;
    const capitalReserve = inventoryBalance;
    const totalEquity = retainedEarnings + capitalReserve;
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

    // P&L Direct Costs (COGS) vs Operating Overhead (OPEX)
    const cogsCodes = ['5010', '5015', '5020', '5050'];
    const cogsItems = Object.values(ledgerMap)
      .filter((a) => cogsCodes.includes(a.code) && a.debits > 0)
      .map((a) => ({ code: a.code, name: a.name, amount: a.debits - a.credits }));
    const totalCOGS = cogsItems.reduce((s, i) => s + i.amount, 0);

    const opexItems = Object.values(ledgerMap)
      .filter((a) => a.type === 'Expense' && !cogsCodes.includes(a.code) && a.debits > 0)
      .map((a) => ({ code: a.code, name: a.name, amount: a.debits - a.credits }));
    const totalOPEX = opexItems.reduce((s, i) => s + i.amount, 0);

    const grossProfit = filteredData.recognizedRevenue - totalCOGS;
    const grossMarginPct =
      filteredData.recognizedRevenue > 0
        ? ((grossProfit / filteredData.recognizedRevenue) * 100).toFixed(1)
        : '0.0';

    return {
      journalEntries,
      ledgerMap,
      trialBalanceItems,
      totalTBDebits,
      totalTBCredits,
      cashBalance,
      assetCash,
      arBalance,
      inventoryBalance,
      accountsPayable,
      securityDeposits,
      retainedCredits,
      liabilityOverdraft,
      totalAssets,
      totalLiabilities,
      retainedEarnings,
      capitalReserve,
      totalEquity,
      totalLiabilitiesAndEquity,
      cogsItems,
      totalCOGS,
      opexItems,
      totalOPEX,
      grossProfit,
      grossMarginPct,
    };
  }, [filteredData, vendors, selectedEventRef, endDate]);

  const handleExportCSV = () => {
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines: string[] = [];
    const addRow = (cols: unknown[]) => lines.push(cols.map(esc).join(','));
    const addBlank = () => lines.push('');

    const biz = systemSettings?.businessName || systemSettings?.business_name || 'Mehar Palace Marquee';
    const periodLabel = startDate || endDate ? `${startDate || 'Inception'} to ${endDate || 'Present'}` : 'All Recorded Dates';

    // Standard Formatted Header
    addRow([biz]);
    addRow([reportTitles[activeReport]]);
    addRow(['Period', periodLabel, 'Scope', selectedEventRef, 'Generated', new Date().toLocaleString()]);
    addBlank();

    const cashLedger = doubleEntryData.ledgerMap['1010 Cash & Bank'];
    const cashTxns = cashLedger?.transactions || [];

    const appendCashFlowSection = () => {
      addRow(['=== FULL CASH FLOW LEDGER (1010 CASH & BANK) ===']);
      addRow(['Date', 'Reference', 'Particulars', 'Cash Inflow (PKR)', 'Cash Outflow (PKR)', 'Running Cash Balance (PKR)']);
      let runningCash = 0;
      let totalIn = 0;
      let totalOut = 0;
      cashTxns.forEach((tx: any) => {
        const inflow = Number(tx.debit || 0);
        const outflow = Number(tx.credit || 0);
        totalIn += inflow;
        totalOut += outflow;
        runningCash += inflow - outflow;
        addRow([tx.date, tx.ref, tx.desc, inflow, outflow, runningCash]);
      });
      addRow(['TOTAL CASH FLOW', '', `${cashTxns.length} Cash Transactions`, totalIn, totalOut, runningCash]);
    };

    if (activeReport === 'general-journal') {
      addRow(['Date', 'Txn Ref', 'Description', 'Debit Account', 'Credit Account', 'Debit (PKR)', 'Credit (PKR)']);
      let totalAmt = 0;
      doubleEntryData.journalEntries.forEach((e) => {
        totalAmt += e.amount;
        addRow([e.date, e.ref, e.description, e.debitAccount, e.creditAccount, e.amount, e.amount]);
      });
      addRow(['TOTAL', `${doubleEntryData.journalEntries.length} Entries`, '', '', '', totalAmt, totalAmt]);
    } else if (activeReport === 'trial-balance') {
      addRow(['Account Code', 'Account Title', 'Account Type', 'Debit Balance (PKR)', 'Credit Balance (PKR)']);
      doubleEntryData.trialBalanceItems.forEach((i) => {
        addRow([i.code, i.account, i.type, i.debit, i.credit]);
      });
      addRow(['TOTAL', 'TOTAL EQUILIBRIUM', '', doubleEntryData.totalTBDebits, doubleEntryData.totalTBCredits]);
    } else if (activeReport === 'balance-sheet') {
      addRow(['Section', 'Account Code & Title', 'Amount (PKR)']);
      addRow(['ASSETS', '1010 Cash in Hand & Bank Accounts', doubleEntryData.assetCash]);
      addRow(['ASSETS', '1020 Accounts Receivable (Client Contract Balances)', doubleEntryData.arBalance]);
      addRow(['ASSETS', '1030 Kitchen & Pantry Asset Inventory', doubleEntryData.inventoryBalance]);
      addRow(['TOTAL ASSETS', '', doubleEntryData.totalAssets]);
      addBlank();
      addRow(['LIABILITIES', '2010 Accounts Payable (Vendors & Suppliers)', doubleEntryData.accountsPayable]);
      addRow(['LIABILITIES', '2020 Customer Security Deposits Held', doubleEntryData.securityDeposits]);
      addRow(['LIABILITIES', '2025 Customer Retained Credits (Unearned Revenue)', doubleEntryData.retainedCredits]);
      addRow(['LIABILITIES', '2030 Bank Overdraft / Operational Credit Due', doubleEntryData.liabilityOverdraft]);
      addRow(['TOTAL LIABILITIES', '', doubleEntryData.totalLiabilities]);
      addBlank();
      addRow(['EQUITY', '3010 Retained Operating Earnings (Period Net Profit)', doubleEntryData.retainedEarnings]);
      addRow(['EQUITY', '3020 Capital & Inventory Reserve', doubleEntryData.capitalReserve]);
      addRow(['TOTAL EQUITY', '', doubleEntryData.totalEquity]);
      addRow(['TOTAL LIABILITIES & EQUITY', '', doubleEntryData.totalLiabilitiesAndEquity]);
      addBlank();
      appendCashFlowSection();
    } else if (activeReport === 'general-ledger') {
      addRow(['Account Code', 'Account Name', 'Date', 'Ref', 'Particulars', 'Debit (PKR)', 'Credit (PKR)', 'Running Balance (PKR)']);
      Object.values(doubleEntryData.ledgerMap)
        .filter((acc) => acc.transactions.length > 0)
        .forEach((acc) => {
          let running = 0;
          acc.transactions.forEach((tx: any) => {
            running += Number(tx.debit || 0) - Number(tx.credit || 0);
            addRow([acc.code, acc.name, tx.date, tx.ref, tx.desc, tx.debit || 0, tx.credit || 0, running]);
          });
          const net = acc.debits - acc.credits;
          addRow([acc.code, `${acc.name} (TOTAL)`, '', '', `Net: ${net >= 0 ? 'Dr' : 'Cr'} Rs. ${Math.abs(net).toLocaleString()}`, acc.debits, acc.credits, net]);
        });
    } else if (activeReport === 'profit-loss') {
      addRow(['Category', 'Line Item / Account', 'Sub-Amount (PKR)', 'Section Total (PKR)']);
      addRow(['1. OPERATING REVENUE', 'Gross Recognized Revenue', '', filteredData.recognizedRevenue]);
      addRow(['Revenue', 'Hall Venue Base Rentals', filteredData.hallRentRevenue, '']);
      addRow(['Revenue', 'Catering & Menu Packages', filteredData.cateringRevenue, '']);
      addRow(['Revenue', 'Stage Decor, DJ & Sound Services', filteredData.decorDjRevenue, '']);
      addRow(['Revenue', 'Overtime & Live Extra Services', filteredData.otherExtrasRevenue, '']);
      addRow(['Revenue', 'Cancellation & Forfeiture Fees Retained', filteredData.cancellationFeeRevenue, '']);
      addRow(['Revenue', 'Less: Direct Client Discounts Given', -filteredData.totalDiscounts, '']);
      addBlank();
      addRow(['2. COST OF EVENT SERVICES (COGS)', 'Total Direct Costs', '', doubleEntryData.totalCOGS]);
      doubleEntryData.cogsItems.forEach((item) => addRow(['COGS', item.name, item.amount, '']));
      addRow(['GROSS PROFIT', `Gross Margin: ${doubleEntryData.grossMarginPct}%`, '', doubleEntryData.grossProfit]);
      addBlank();
      addRow(['3. OPERATING EXPENSES (OPEX)', 'Total Operating Overhead', '', doubleEntryData.totalOPEX]);
      doubleEntryData.opexItems.forEach((item) => addRow(['OPEX', item.name, item.amount, '']));
      addRow(['NET OPERATING PROFIT (EBITDA)', `Net Margin: ${filteredData.profitMargin}%`, '', filteredData.netProfit]);
      addBlank();
      appendCashFlowSection();
    } else {
      // Overview: Executive Summary + Monthly Breakdown + Full Cash Flow + Itemized Bookings + Itemized Expenses
      addRow(['=== EXECUTIVE SUMMARY ===']);
      addRow(['Metric', 'Amount / Value']);
      addRow(['Gross Recognized Revenue (PKR)', filteredData.recognizedRevenue]);
      addRow(['Cash Collected (PKR)', filteredData.cashCollected]);
      addRow(['Client Receivables Due (PKR)', filteredData.receivables]);
      addRow(['Total Incurred Expenses (PKR)', filteredData.totalExpenses]);
      addRow(['Net Operating Profit (PKR)', filteredData.netProfit]);
      addRow(['Net Profit Margin (%)', `${filteredData.profitMargin}%`]);
      addBlank();

      addRow(['=== MONTHLY FINANCIAL SUMMARY ===']);
      addRow(['Month', 'Total Bookings', 'Gross Revenue (PKR)', 'Total Expenses (PKR)', 'Net Profit (PKR)']);
      monthlySummary.forEach((m) => {
        addRow([m.month, m.totalBookings, m.grossRevenue, m.totalExpenses, m.netProfit]);
      });
      addBlank();

      appendCashFlowSection();
      addBlank();

      addRow(['=== ITEMIZED BOOKINGS / EVENT REVENUE ===']);
      addRow(['Booking Ref', 'Event Date', 'Customer Name', 'Hall', 'Status', 'Contract Amount (PKR)', 'Paid / Advance (PKR)', 'Balance Due (PKR)']);
      filteredData.bookings.forEach((b) => {
        const amt = Number(b.amount || 0);
        const paid = Number(b.advancePayment || 0);
        const bal = b.status === 'Cancelled' || b.status === 'Paused' ? 0 : Math.max(0, amt - paid);
        addRow([b.bookingRef, b.date, b.customerName, b.hallName, b.status, amt, paid, bal]);
      });
      addBlank();

      addRow(['=== ITEMIZED OPERATIONAL EXPENSES ===']);
      addRow(['Date', 'Expense Ref', 'Category', 'Description', 'Paid To / Vendor', 'Booking Ref', 'Status', 'Amount (PKR)']);
      filteredData.expenses.forEach((exp) => {
        addRow([
          exp.date,
          exp.expenseRef || `EXP-${exp.id}`,
          exp.category,
          exp.description || '',
          exp.paidTo || exp.vendor || '',
          exp.bookingRef || 'General',
          exp.status || 'Paid',
          Number(exp.amount || 0),
        ]);
      });
    }

    const csvContent = `\uFEFF${lines.join('\n')}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filePeriod = startDate || endDate ? `${startDate || 'start'}_to_${endDate || 'present'}` : 'all_time';
    link.href = url;
    link.download = `${biz.replace(/\s+/g, '_')}_${activeReport}_${filePeriod}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const reportTitles: Record<ReportType, string> = {
    overview: 'EXECUTIVE FINANCIAL OVERVIEW & SUMMARY',
    'balance-sheet': 'STATEMENT OF FINANCIAL POSITION (BALANCE SHEET)',
    'general-journal': 'GENERAL JOURNAL (CHRONOLOGICAL AUDIT LEDGER)',
    'general-ledger': 'GENERAL LEDGER (T-ACCOUNT STATEMENTS)',
    'trial-balance': 'TRIAL BALANCE (DEBIT & CREDIT EQUILIBRIUM)',
    'profit-loss': 'STATEMENT OF PROFIT OR LOSS (INCOME STATEMENT)',
  };

  const handleDownloadPDF = () => {
    const prevTitle = document.title;
    const biz = (systemSettings?.businessName || systemSettings?.business_name || 'Mehar_Palace').replace(/\s+/g, '_');
    const periodLabel = startDate || endDate ? `${startDate || 'Start'}_to_${endDate || 'Present'}` : 'All_Time';
    document.title = `${biz}_${activeReport}_${periodLabel}`;
    window.print();
    setTimeout(() => {
      document.title = prevTitle;
    }, 500);
  };

  const applyPeriodPreset = (preset: 'this-month' | 'last-month' | 'this-year' | 'all-time') => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const pad = (n: number) => String(n).padStart(2, '0');
    if (preset === 'this-month') {
      const lastDay = new Date(y, m + 1, 0).getDate();
      setStartDate(`${y}-${pad(m + 1)}-01`);
      setEndDate(`${y}-${pad(m + 1)}-${pad(lastDay)}`);
    } else if (preset === 'last-month') {
      const lm = m === 0 ? 11 : m - 1;
      const ly = m === 0 ? y - 1 : y;
      const lastDay = new Date(ly, lm + 1, 0).getDate();
      setStartDate(`${ly}-${pad(lm + 1)}-01`);
      setEndDate(`${ly}-${pad(lm + 1)}-${pad(lastDay)}`);
    } else if (preset === 'this-year') {
      setStartDate(`${y}-01-01`);
      setEndDate(`${y}-12-31`);
    } else {
      setStartDate('');
      setEndDate('');
    }
  };

  const businessName = systemSettings?.businessName || systemSettings?.business_name || 'MEHAR PALACE MARQUEE';
  const businessAddress =
    systemSettings?.headOfficeAddress ||
    systemSettings?.head_office_address ||
    'Main Canal Road, near PSO Petrol Pump, Fateh Garh Mughalpura, Lahore, 54000';
  const businessPhone = systemSettings?.contactPhone || systemSettings?.contact_phone || '0321 1000806';
  const periodDisplay =
    startDate || endDate
      ? `Period: ${startDate || 'Inception'} to ${endDate || 'Present'}`
      : 'Period: Cumulative (All Recorded Dates)';

  const reportTabs: Array<{ id: ReportType; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'overview', label: 'Financial Overview', icon: BarChart3 },
    { id: 'balance-sheet', label: 'Balance Sheet', icon: Scale },
    { id: 'general-journal', label: 'General Journal', icon: BookOpen },
    { id: 'general-ledger', label: 'General Ledger', icon: Layers },
    { id: 'trial-balance', label: 'Trial Balance', icon: CheckCircle2 },
    { id: 'profit-loss', label: 'Full P&L / Income', icon: DollarSign },
  ];

  return (
    <div className="space-y-6">
      {/* Top Section: Centered Heading & Global Date/Event Controls */}
      <div className="no-print flex flex-col items-center gap-4">
        <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-slate-900 tracking-tight text-center">
          Comprehensive Financial &amp; Accounting Reports
        </h1>

        <div className="flex flex-wrap items-center justify-center gap-2 w-full">
          {/* Quick Period Presets */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => applyPeriodPreset('this-month')}
              className="px-2 py-1 text-[11px] font-semibold rounded text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => applyPeriodPreset('last-month')}
              className="px-2 py-1 text-[11px] font-semibold rounded text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Last Month
            </button>
            <button
              type="button"
              onClick={() => applyPeriodPreset('this-year')}
              className="px-2 py-1 text-[11px] font-semibold rounded text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              This Year
            </button>
            <button
              type="button"
              onClick={() => applyPeriodPreset('all-time')}
              className="px-2 py-1 text-[11px] font-semibold rounded text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              All Time
            </button>
          </div>

          {/* Event Filter */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-2xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              aria-label="Event Filter"
              value={selectedEventRef}
              onChange={(e) => setSelectedEventRef(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer max-w-[180px] truncate"
            >
              <option value="All Events">All Events (Cumulative)</option>
              {bookings.map((b) => (
                <option key={b.id || b.bookingRef} value={b.bookingRef}>
                  {b.bookingRef} — {b.customerName}
                </option>
              ))}
            </select>
          </div>

          {/* Date-to-Date Filter */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              aria-label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs font-mono text-slate-700 bg-transparent focus:outline-none"
            />
            <span className="text-xs text-slate-400">–</span>
            <input
              type="date"
              aria-label="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs font-mono text-slate-700 bg-transparent focus:outline-none"
            />
          </div>

          {/* Actions */}
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            Download PDF
          </button>
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Top Report Type Navigation Tabs */}
      <div className="no-print bg-white border border-slate-200 rounded-xl shadow-2xs p-1.5 overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {reportTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeReport === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveReport(tab.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-teal-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* PRINTABLE / PDF REPORT CONTAINER */}
      <div className="printable-receipt-area space-y-6">
        {/* Official PDF / Print Letterhead: Left Logo | Mid Hall Name & Report Info | Right Logo */}
        <div className="hidden print:flex items-center justify-between gap-4 pb-4 mb-4 border-b-2 border-slate-900">
          <div className="w-20 h-20 flex items-center justify-start shrink-0">
            <img src="/logo.png" alt="Hall Logo Left" className="h-16 w-16 object-contain" />
          </div>
          <div className="flex-1 text-center">
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900 uppercase font-['Plus_Jakarta_Sans']">
              {businessName}
            </h2>
            <p className="text-[10px] text-slate-600 mt-0.5">
              {businessAddress} &bull; Tel: {businessPhone}
            </p>
            <div className="mt-2 inline-block px-3 py-0.5 rounded bg-slate-900 text-white text-[11px] font-bold tracking-wider uppercase">
              {reportTitles[activeReport]}
            </div>
            <p className="text-[11px] font-mono text-slate-700 mt-1 font-semibold">
              {periodDisplay} &bull; Scope: {selectedEventRef}
            </p>
          </div>
          <div className="w-20 h-20 flex items-center justify-end shrink-0">
            <img src="/logo.png" alt="Hall Logo Right" className="h-16 w-16 object-contain" />
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Gross Recognized Revenue
            </span>
            <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-teal-700" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold font-mono tabular-nums text-slate-900">
            Rs. {filteredData.recognizedRevenue.toLocaleString()}
          </p>
          <span className="text-[11px] text-teal-700 mt-1 block">
            Collected: Rs. {filteredData.cashCollected.toLocaleString()} &bull; Due: Rs. {filteredData.receivables.toLocaleString()}
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Incurred Expenses
            </span>
            <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-rose-600" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold font-mono tabular-nums text-rose-600">
            Rs. {filteredData.totalExpenses.toLocaleString()}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Food, Waiters, Decor &amp; Overheads</span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Net Operating Profit
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold font-mono tabular-nums text-emerald-700">
            Rs. {filteredData.netProfit.toLocaleString()}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Revenue less direct event costs</span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Net Profit Margin
            </span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
              <Activity className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold font-mono tabular-nums text-slate-900">
            {filteredData.profitMargin}%
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Operating efficiency ratio</span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* VIEW 1: OVERVIEW TAB (CHARTS & MONTHLY SUMMARY) */}
      {/* ============================================================== */}
      {activeReport === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left Chart (2/3 width) */}
            <section className="lg:col-span-2 bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-['Plus_Jakarta_Sans'] text-base font-semibold text-slate-900">
                    Revenue vs Expenses Trend
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Monthly comparison of gross contract bookings and operational cash outlays
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-teal-700" />
                    Revenue
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-rose-500" />
                    Expenses
                  </span>
                </div>
              </div>

              <div className="relative h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData} margin={{ top: 10, right: 16, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#0f766e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Right Chart (1/3 width) */}
            <section className="lg:col-span-1 bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs flex flex-col">
              <div className="mb-4">
                <h2 className="font-['Plus_Jakarta_Sans'] text-base font-semibold text-slate-900">
                  Expense Distribution
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Categorical direct cost share</p>
              </div>

              <div className="relative h-72 w-full flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseBreakdownData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={56}
                      outerRadius={84}
                      paddingAngle={2}
                    />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          {/* Monthly Breakdown Table */}
          <section className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-['Plus_Jakarta_Sans'] text-base font-semibold text-slate-900">
                Monthly Financial Ledger Summary
              </h2>
              <span className="text-xs font-mono text-slate-400">{monthlySummary.length} periods</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-5">Month / Period</th>
                    <th className="py-3.5 px-5">Total Events</th>
                    <th className="py-3.5 px-5">Gross Revenue</th>
                    <th className="py-3.5 px-5">Total Expenses</th>
                    <th className="py-3.5 px-5">Net Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {monthlySummary.map((row) => (
                    <tr key={row.month} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5 font-medium text-slate-900">{row.month}</td>
                      <td className="py-3.5 px-5 font-mono text-slate-700">{row.totalBookings}</td>
                      <td className="py-3.5 px-5 font-mono tabular-nums text-teal-700 font-semibold">
                        Rs. {row.grossRevenue.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-5 font-mono tabular-nums text-rose-600 font-semibold">
                        Rs. {row.totalExpenses.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-5 font-mono tabular-nums text-emerald-700 font-semibold">
                        Rs. {row.netProfit.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 2: BALANCE SHEET */}
      {/* ============================================================== */}
      {activeReport === 'balance-sheet' && (
        <section className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-slate-50/60">
            <div>
              <h2 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-slate-900">
                Balance Sheet Statement of Financial Position
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Assets, Liabilities &amp; Equity as of {endDate || new Date().toISOString().slice(0, 10)}
              </p>
            </div>
            {Math.round(doubleEntryData.totalAssets) === Math.round(doubleEntryData.totalLiabilitiesAndEquity) ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5" /> Balanced Accounting Equation
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold border border-rose-300">
                Out of Balance (Diff: Rs. {Math.abs(Math.round(doubleEntryData.totalAssets - doubleEntryData.totalLiabilitiesAndEquity)).toLocaleString()})
              </div>
            )}
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
            {/* ASSETS COLUMN */}
            <div className="space-y-4">
              <div className="border-b-2 border-teal-800 pb-2 flex justify-between items-center">
                <h3 className="font-bold text-teal-900 uppercase text-xs tracking-wider">
                  Assets (Current &amp; Operational)
                </h3>
                <span className="font-mono text-xs font-semibold text-slate-500">Debit Balance</span>
              </div>
              <table className="w-full text-xs">
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  <tr>
                    <td className="py-2.5 font-medium">1010 Cash in Hand &amp; Bank Accounts</td>
                    <td className="py-2.5 text-right font-mono font-bold text-slate-900">
                      Rs. {doubleEntryData.assetCash.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-medium">1020 Accounts Receivable (Client Contract Balances)</td>
                    <td className="py-2.5 text-right font-mono font-bold text-slate-900">
                      Rs. {doubleEntryData.arBalance.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-medium">1030 Kitchen &amp; Pantry Asset Inventory</td>
                    <td className="py-2.5 text-right font-mono font-bold text-slate-900">
                      Rs. {doubleEntryData.inventoryBalance.toLocaleString()}
                    </td>
                  </tr>
                  <tr className="bg-teal-50/80 font-bold text-teal-950 border-t-2 border-teal-800">
                    <td className="py-3 text-sm">TOTAL ASSETS:</td>
                    <td className="py-3 text-right font-mono text-base">
                      Rs. {doubleEntryData.totalAssets.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* LIABILITIES & EQUITY COLUMN */}
            <div className="space-y-4">
              <div className="border-b-2 border-indigo-800 pb-2 flex justify-between items-center">
                <h3 className="font-bold text-indigo-900 uppercase text-xs tracking-wider">
                  Liabilities &amp; Owner&apos;s Equity
                </h3>
                <span className="font-mono text-xs font-semibold text-slate-500">Credit Balance</span>
              </div>
              <table className="w-full text-xs">
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  <tr className="bg-slate-50/70">
                    <td colSpan={2} className="py-1.5 font-bold text-[11px] uppercase tracking-wider text-slate-500">
                      Current Liabilities
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium">2010 Accounts Payable (Vendors &amp; Suppliers)</td>
                    <td className="py-2 text-right font-mono font-semibold text-slate-900">
                      Rs. {doubleEntryData.accountsPayable.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium">2020 Customer Security Deposits Held</td>
                    <td className="py-2 text-right font-mono font-semibold text-slate-900">
                      Rs. {doubleEntryData.securityDeposits.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium">2025 Customer Retained Credits (Unearned Revenue)</td>
                    <td className="py-2 text-right font-mono font-semibold text-slate-900">
                      Rs. {doubleEntryData.retainedCredits.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium">2030 Bank Overdraft / Operational Credit Due</td>
                    <td className="py-2 text-right font-mono font-semibold text-slate-900">
                      Rs. {doubleEntryData.liabilityOverdraft.toLocaleString()}
                    </td>
                  </tr>
                  <tr className="bg-slate-50/90 font-semibold text-slate-800">
                    <td className="py-2">Total Current Liabilities</td>
                    <td className="py-2 text-right font-mono">
                      Rs. {doubleEntryData.totalLiabilities.toLocaleString()}
                    </td>
                  </tr>
                  <tr className="bg-slate-50/70">
                    <td colSpan={2} className="py-1.5 font-bold text-[11px] uppercase tracking-wider text-slate-500">
                      Owner&apos;s Equity
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium">3010 Retained Operating Earnings (Period Net Profit)</td>
                    <td className="py-2 text-right font-mono font-bold text-slate-900">
                      Rs. {doubleEntryData.retainedEarnings.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium">3020 Capital &amp; Inventory Reserve</td>
                    <td className="py-2 text-right font-mono font-semibold text-slate-900">
                      Rs. {doubleEntryData.capitalReserve.toLocaleString()}
                    </td>
                  </tr>
                  <tr className="bg-indigo-50/80 font-bold text-indigo-950 border-t-2 border-indigo-800">
                    <td className="py-3 text-sm">TOTAL LIABILITIES &amp; EQUITY:</td>
                    <td className="py-3 text-right font-mono text-base">
                      Rs. {doubleEntryData.totalLiabilitiesAndEquity.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* VIEW 3: GENERAL JOURNAL */}
      {/* ============================================================== */}
      {activeReport === 'general-journal' && (
        <section className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
            <div>
              <h2 className="font-['Plus_Jakarta_Sans'] text-base font-semibold text-slate-900">
                General Journal (Chronological Audit Ledger)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Every event billing contract, customer payment receipt, and expense disbursement in double entry format
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {doubleEntryData.journalEntries.length} entries
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100 text-slate-600 uppercase font-semibold">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Txn Ref</th>
                  <th className="py-3 px-4">Account Titles &amp; Description</th>
                  <th className="py-3 px-4 text-right font-mono">Debit (PKR)</th>
                  <th className="py-3 px-4 text-right font-mono">Credit (PKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-mono">
                {doubleEntryData.journalEntries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No journal entries found for selected criteria.
                    </td>
                  </tr>
                ) : (
                  doubleEntryData.journalEntries.map((e, idx) => (
                    <React.Fragment key={`entry-${idx}`}>
                      {/* Debit Line */}
                      <tr className="bg-white hover:bg-slate-50">
                        <td className="py-2.5 px-4 text-slate-500 font-normal">{e.date}</td>
                        <td className="py-2.5 px-4 font-bold text-teal-800">{e.ref}</td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">{e.debitAccount}</td>
                        <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                          Rs. {e.amount.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-4 text-right text-slate-300">-</td>
                      </tr>
                      {/* Credit Line */}
                      <tr className="bg-slate-50/40 hover:bg-slate-50">
                        <td className="py-1.5 px-4"></td>
                        <td className="py-1.5 px-4"></td>
                        <td className="py-1.5 px-4 pl-10 text-slate-700">
                          To {e.creditAccount}
                          <p className="text-[11px] text-slate-400 italic mt-0.5 font-sans">
                            ({e.description})
                          </p>
                        </td>
                        <td className="py-1.5 px-4 text-right text-slate-300">-</td>
                        <td className="py-1.5 px-4 text-right font-bold text-teal-800">
                          Rs. {e.amount.toLocaleString()}
                        </td>
                      </tr>
                    </React.Fragment>
                  ))
                )}
              </tbody>
              {doubleEntryData.journalEntries.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-100 font-bold text-slate-950 border-t-2 border-slate-300 text-sm">
                    <td colSpan={3} className="py-3 px-4 font-sans">
                      TOTAL JOURNAL TURNOVER ({doubleEntryData.journalEntries.length} Entries):
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      Rs. {doubleEntryData.journalEntries.reduce((s, e) => s + e.amount, 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-teal-800">
                      Rs. {doubleEntryData.journalEntries.reduce((s, e) => s + e.amount, 0).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* VIEW 4: GENERAL LEDGER (LEDGERS) */}
      {/* ============================================================== */}
      {activeReport === 'general-ledger' && (
        <div className="space-y-6">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h2 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-slate-900">
              General Ledger Accounts (T-Accounts)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Individual T-account statements tracking net cumulative balance per chart of accounts.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {Object.entries(doubleEntryData.ledgerMap)
              .filter(([_, acc]) => acc.transactions.length > 0)
              .map(([accKey, acc]) => {
                const netBalance = acc.debits - acc.credits;
                return (
                  <div
                    key={accKey}
                    className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden"
                  >
                    <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-teal-700 font-bold">
                          Code: {acc.code}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{acc.name}</h4>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                          Net Balance
                        </span>
                        <span
                          className={`font-mono text-sm font-bold ${
                            netBalance >= 0 ? 'text-slate-900' : 'text-teal-800'
                          }`}
                        >
                          Rs. {Math.abs(netBalance).toLocaleString()}{' '}
                          <span className="text-[10px] font-normal text-slate-500">
                            {netBalance >= 0 ? '(Dr)' : '(Cr)'}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto print:max-h-none print:overflow-visible">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                          <tr>
                            <th className="py-2 px-3">Date</th>
                            <th className="py-2 px-3">Particulars</th>
                            <th className="py-2 px-3 text-right font-mono">Debit</th>
                            <th className="py-2 px-3 text-right font-mono">Credit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                          {acc.transactions.map((tx: any, tIdx: number) => (
                            <tr key={`tx-${tIdx}`}>
                              <td className="py-2 px-3 text-slate-400 font-sans whitespace-nowrap">{tx.date}</td>
                              <td className="py-2 px-3 font-sans font-medium text-slate-800 truncate max-w-[180px] print:whitespace-normal print:max-w-none">
                                {tx.desc}
                              </td>
                              <td className="py-2 px-3 text-right whitespace-nowrap">
                                {tx.debit > 0 ? `Rs. ${tx.debit.toLocaleString()}` : '-'}
                              </td>
                              <td className="py-2 px-3 text-right whitespace-nowrap">
                                {tx.credit > 0 ? `Rs. ${tx.credit.toLocaleString()}` : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-50 border-t border-slate-300 font-bold text-slate-900 font-mono">
                            <td colSpan={2} className="py-2 px-3 font-sans text-xs uppercase text-slate-600">
                              Account Totals
                            </td>
                            <td className="py-2 px-3 text-right whitespace-nowrap">
                              Rs. {acc.debits.toLocaleString()}
                            </td>
                            <td className="py-2 px-3 text-right whitespace-nowrap text-teal-800">
                              Rs. {acc.credits.toLocaleString()}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 5: TRIAL BALANCE */}
      {/* ============================================================== */}
      {activeReport === 'trial-balance' && (
        <section className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-slate-50/60">
            <div>
              <h2 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-slate-900">
                Trial Balance (Arithmetic Balance Verification)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Summary of debit and credit balances verifying debit-credit equilibrium
              </p>
            </div>
            {Math.round(doubleEntryData.totalTBDebits) === Math.round(doubleEntryData.totalTBCredits) ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-bold border border-teal-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" /> &Sigma; Debit = &Sigma; Credit Verified
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold border border-rose-300">
                Out of Balance (Diff: Rs. {Math.abs(Math.round(doubleEntryData.totalTBDebits - doubleEntryData.totalTBCredits)).toLocaleString()})
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100 text-slate-600 uppercase font-semibold">
                  <th className="py-3 px-5">Code</th>
                  <th className="py-3 px-5">Account Description</th>
                  <th className="py-3 px-5 text-right font-mono">Debit Balance (PKR)</th>
                  <th className="py-3 px-5 text-right font-mono">Credit Balance (PKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-mono text-sm">
                {doubleEntryData.trialBalanceItems.map((item, idx) => (
                  <tr key={`tb-${idx}`} className="hover:bg-slate-50">
                    <td className="py-3 px-5 text-slate-400 font-bold">{item.code}</td>
                    <td className="py-3 px-5 font-sans font-medium text-slate-900">{item.account}</td>
                    <td className="py-3 px-5 text-right font-semibold">
                      {item.debit > 0 ? `Rs. ${item.debit.toLocaleString()}` : '-'}
                    </td>
                    <td className="py-3 px-5 text-right font-semibold text-teal-800">
                      {item.credit > 0 ? `Rs. ${item.credit.toLocaleString()}` : '-'}
                    </td>
                  </tr>
                ))}
                {/* Total row */}
                <tr className="bg-slate-100 font-bold text-slate-950 border-t-2 border-slate-300 text-base">
                  <td colSpan={2} className="py-3.5 px-5 font-sans">TOTAL EQUILIBRIUM:</td>
                  <td className="py-3.5 px-5 text-right font-mono">
                    Rs. {doubleEntryData.totalTBDebits.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-5 text-right font-mono text-teal-800">
                    Rs. {doubleEntryData.totalTBCredits.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* VIEW 6: PROFIT & LOSS / FULL INCOME STATEMENT */}
      {/* ============================================================== */}
      {activeReport === 'profit-loss' && (
        <section className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-slate-50/60">
            <div>
              <h2 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-slate-900">
                Full Statement of Profit or Loss (Income Statement)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Accrual recognized event revenues less direct operating expenditures
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 uppercase font-semibold block">Scope</span>
              <span className="font-bold text-teal-900 text-xs">{selectedEventRef}</span>
            </div>
          </div>

          <div className="p-6">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100 text-slate-600 uppercase font-semibold">
                  <th className="py-2.5 px-4">Financial Item / Description</th>
                  <th className="py-2.5 px-4 text-right font-mono">Account Breakdown</th>
                  <th className="py-2.5 px-4 text-right font-mono">Net PKR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 text-sm">
                {/* 1. Operating Revenue */}
                <tr className="bg-teal-50/50 font-bold text-teal-950">
                  <td className="py-3 px-4">1. OPERATING REVENUE (INFLOWS)</td>
                  <td></td>
                  <td className="py-3 px-4 text-right font-mono text-teal-800">
                    Rs. {filteredData.recognizedRevenue.toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-8 font-sans text-xs text-slate-600">
                    &bull; Hall Venue Base Rentals
                  </td>
                  <td className="py-2 px-4 text-right font-mono text-xs text-slate-500">
                    Rs. {filteredData.hallRentRevenue.toLocaleString()}
                  </td>
                  <td></td>
                </tr>
                {filteredData.cateringRevenue > 0 && (
                  <tr>
                    <td className="py-2 px-8 font-sans text-xs text-slate-600">
                      &bull; Catering &amp; Menu Packages
                    </td>
                    <td className="py-2 px-4 text-right font-mono text-xs text-slate-500">
                      Rs. {filteredData.cateringRevenue.toLocaleString()}
                    </td>
                    <td></td>
                  </tr>
                )}
                {filteredData.decorDjRevenue > 0 && (
                  <tr>
                    <td className="py-2 px-8 font-sans text-xs text-slate-600">
                      &bull; Stage Decor, DJ &amp; Sound Services
                    </td>
                    <td className="py-2 px-4 text-right font-mono text-xs text-slate-500">
                      Rs. {filteredData.decorDjRevenue.toLocaleString()}
                    </td>
                    <td></td>
                  </tr>
                )}
                {filteredData.otherExtrasRevenue > 0 && (
                  <tr>
                    <td className="py-2 px-8 font-sans text-xs text-slate-600">
                      &bull; Overtime &amp; Live Extra Services
                    </td>
                    <td className="py-2 px-4 text-right font-mono text-xs text-slate-500">
                      Rs. {filteredData.otherExtrasRevenue.toLocaleString()}
                    </td>
                    <td></td>
                  </tr>
                )}
                {filteredData.cancellationFeeRevenue > 0 && (
                  <tr>
                    <td className="py-2 px-8 font-sans text-xs text-slate-600">
                      &bull; Cancellation &amp; Forfeiture Fees Retained
                    </td>
                    <td className="py-2 px-4 text-right font-mono text-xs text-slate-500">
                      Rs. {filteredData.cancellationFeeRevenue.toLocaleString()}
                    </td>
                    <td></td>
                  </tr>
                )}
                <tr>
                  <td className="py-2 px-8 font-sans text-xs text-rose-600">
                    &bull; Less: Direct Client Discounts Given
                  </td>
                  <td className="py-2 px-4 text-right font-mono text-xs text-rose-600">
                    - Rs. {filteredData.totalDiscounts.toLocaleString()}
                  </td>
                  <td></td>
                </tr>

                {/* 2. Cost of Event Services (COGS) */}
                <tr className="bg-amber-50/50 font-bold text-amber-950">
                  <td className="py-3 px-4">2. COST OF EVENT SERVICES (DIRECT COSTS / COGS)</td>
                  <td></td>
                  <td className="py-3 px-4 text-right font-mono text-rose-600">
                    (Rs. {doubleEntryData.totalCOGS.toLocaleString()})
                  </td>
                </tr>
                {doubleEntryData.cogsItems.map((item) => (
                  <tr key={item.code}>
                    <td className="py-2 px-8 font-sans text-xs text-slate-600">
                      &bull; {item.name}
                    </td>
                    <td className="py-2 px-4 text-right font-mono text-xs text-slate-500">
                      Rs. {item.amount.toLocaleString()}
                    </td>
                    <td></td>
                  </tr>
                ))}

                {/* Gross Profit */}
                <tr className="bg-slate-50 font-bold text-slate-900 border-y border-slate-200">
                  <td className="py-3 px-4">GROSS PROFIT</td>
                  <td className="py-3 px-4 text-right font-mono text-xs text-teal-700">
                    {doubleEntryData.grossMarginPct}% Gross Margin
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-teal-800">
                    Rs. {doubleEntryData.grossProfit.toLocaleString()}
                  </td>
                </tr>

                {/* 3. Operating Overhead Expenses (OPEX) */}
                <tr className="bg-rose-50/50 font-bold text-rose-950">
                  <td className="py-3 px-4">3. OPERATING EXPENSES (PAYROLL, UTILITIES &amp; OVERHEAD)</td>
                  <td></td>
                  <td className="py-3 px-4 text-right font-mono text-rose-600">
                    (Rs. {doubleEntryData.totalOPEX.toLocaleString()})
                  </td>
                </tr>
                {doubleEntryData.opexItems.map((item) => (
                  <tr key={item.code}>
                    <td className="py-2 px-8 font-sans text-xs text-slate-600">
                      &bull; {item.name}
                    </td>
                    <td className="py-2 px-4 text-right font-mono text-xs text-slate-500">
                      Rs. {item.amount.toLocaleString()}
                    </td>
                    <td></td>
                  </tr>
                ))}

                {/* Final Net Profit */}
                <tr className="bg-emerald-50 font-bold text-emerald-950 border-t-2 border-emerald-800 text-base">
                  <td className="py-4 px-4 font-['Plus_Jakarta_Sans']">
                    NET OPERATING PROFIT (EBITDA):
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-xs text-emerald-700">
                    {filteredData.profitMargin}% Net Margin
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-lg text-emerald-800">
                    Rs. {filteredData.netProfit.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

        {/* Official PDF / Print Signature Footer */}
        <div className="hidden print:flex items-end justify-between pt-8 mt-8 border-t border-slate-300 text-[11px] text-slate-600">
          <div>
            <p className="font-semibold text-slate-800">{businessName}</p>
            <p>Generated on: {new Date().toLocaleString()}</p>
          </div>
          <div className="text-center">
            <div className="w-40 border-b border-slate-800 mb-1" />
            <p className="font-semibold text-slate-800">Accounts Officer</p>
          </div>
          <div className="text-right">
            <div className="w-40 border-b border-slate-800 mb-1 ml-auto" />
            <p className="font-semibold text-slate-800">Director / Managing Partner</p>
          </div>
        </div>
      </div>
    </div>
  );
};
