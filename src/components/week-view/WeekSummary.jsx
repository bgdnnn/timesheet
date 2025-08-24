import React, { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

/**
 * Accepts either `entries` or `weekEntries`.
 * Props:
 * - weekStart: Date
 * - entries | weekEntries: array of time entries for the selected week
 * - user: { hourly_rate?: number }
 * - payslip: { gross_pay, paye_tax, national_insurance, pension, net_pay } | null
 * - earnings: { gross_pay, paye_tax, national_insurance, pension, net_pay } | null
 * - onReplacePayslip: () => void
 */
export default function WeekSummary(props) {
  const { weekStart, user, payslip, earnings, onReplacePayslip } = props;
  const entries = props.entries ?? props.weekEntries ?? [];

  const totalHours = useMemo(() => {
    if (!entries || entries.length === 0) return 0;
    return entries.reduce(
      (sum, e) =>
        sum +
        Number.parseFloat(e.hours_worked || 0) +
        Number.parseFloat(e.travel_time || 0),
      0
    );
  }, [entries]);

  const [hourlyRate, setHourlyRate] = useState("");

  useEffect(() => {
    const userRate =
      user && user.hourly_rate != null ? Number(user.hourly_rate) : null;
    if (userRate && userRate > 0) setHourlyRate(String(userRate));
    else setHourlyRate("");
  }, [user]);

  const hoursNum = totalHours;
  const usingPayslip = Boolean(payslip && payslip.gross_pay != null);
  const usingEarnings = Boolean(earnings && earnings.gross_pay != null);

  const source = usingPayslip ? "Payslip (OCR)" : usingEarnings ? "Calculated" : "—";

  const gross = usingPayslip
    ? Number(payslip.gross_pay)
    : usingEarnings
    ? Number(earnings.gross_pay)
    : 0;

  const payeTax = usingPayslip
    ? Number(payslip.paye_tax || 0)
    : usingEarnings
    ? Number(earnings.paye_tax || 0)
    : null;
  const niEmp = usingPayslip
    ? Number(payslip.national_insurance || 0)
    : usingEarnings
    ? Number(earnings.national_insurance || 0)
    : null;
  const pensionEmp = usingPayslip
    ? Number(payslip.pension || 0)
    : usingEarnings
    ? Number(earnings.pension || 0)
    : null;
  const netPay = usingPayslip
    ? Number(payslip.net_pay || 0)
    : usingEarnings
    ? Number(earnings.net_pay || 0)
    : null;

  return (
    <div className="mt-4 rounded-2xl border border-white/20 bg-white/5 p-4 md:p-6 text-white">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
        <div className="col-span-1">
          <div className="text-xs text-gray-300 mb-1">Week</div>
          <div className="text-sm md:text-base font-semibold">
            {format(weekStart, "dd LLL yyyy")}
          </div>
        </div>

        <div className="col-span-1">
          <div className="text-xs text-gray-300 mb-1">Hours</div>
          <div className="rounded-lg bg-white/10 border border-white/20 px-3 py-2">
            {hoursNum.toFixed(2)} h
          </div>
        </div>

        <div className="col-span-1">
          <label className="text-xs text-gray-300 mb-1 block">
            Hourly rate (£)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
            className="w-full rounded-lg bg-white/10 border border-white/20 px-3 py-2 outline-none"
            placeholder="0.00"
          />
        </div>

        <div className="col-span-1">
          <div className="text-xs text-gray-300 mb-1">Gross (£)</div>
          <div className="rounded-lg bg-white/10 border border-white/20 px-3 py-2">
            £{gross.toFixed(2)}
          </div>
        </div>

        <div className="col-span-2 md:text-right flex md:justify-end">
          <Button
            onClick={onReplacePayslip}
            className="bg-white/15 hover:bg-white/25 text-white border border-white/20"
          >
            Replace payslip
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
        <div className="rounded-lg bg-white/10 border border-white/20 px-3 py-3">
          <div className="text-xs text-gray-300 mb-1">PAYE Tax</div>
          <div className="text-base font-semibold">
            {payeTax != null ? <>£{payeTax.toFixed(2)}</> : <span className="text-gray-400">—</span>}
          </div>
        </div>

        <div className="rounded-lg bg-white/10 border border-white/20 px-3 py-3">
          <div className="text-xs text-gray-300 mb-1">NI (Employee)</div>
          <div className="text-base font-semibold">
            {niEmp != null ? <>£{niEmp.toFixed(2)}</> : <span className="text-gray-400">—</span>}
          </div>
        </div>

        <div className="rounded-lg bg-white/10 border border-white/20 px-3 py-3">
          <div className="text-xs text-gray-300 mb-1">Pension (You)</div>
          <div className="text-base font-semibold">
            {pensionEmp != null ? <>£{pensionEmp.toFixed(2)}</> : <span className="text-gray-400">—</span>}
          </div>
        </div>

        <div className="rounded-lg bg-white/10 border border-white/20 px-3 py-3">
          <div className="text-xs text-gray-300 mb-1">Net Pay</div>
          <div className="text-base font-semibold">
            {netPay != null ? `£${netPay.toFixed(2)}` : <span className="text-gray-400">—</span>}
          </div>
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-300">
        Source:{" "}
        <span className="text-white font-semibold">
          {source}
        </span>
      </div>
    </div>
  );
}
