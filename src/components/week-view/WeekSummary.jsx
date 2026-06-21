import React, { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Edit2, Check, X } from "lucide-react";
import { Earnings } from "@/api/entities";

/**
 * Accepts either `entries` or `weekEntries`.
 */
export default function WeekSummary(props) {
  const { weekStart, user, payslip, earnings, onReplacePayslip, onUploadPayslip, onRefresh } = props;
  const fileInputRef = React.useRef(null);
  const entries = props.entries ?? props.weekEntries ?? [];

  const [isEditingWage, setIsEditingWage] = useState(false);
  const [tempWage, setTempWage] = useState("");

  useEffect(() => {
    if (earnings?.hourly_wage != null) {
      setTempWage(String(earnings.hourly_wage));
    } else if (user?.wage != null) {
      setTempWage(String(user.wage));
    }
  }, [earnings, user]);

  const handleSaveWage = async () => {
    try {
      await Earnings.updateWeekWage(format(weekStart, "yyyy-MM-dd"), parseFloat(tempWage));
      if (user?.is_calculator_enabled) {
        await Earnings.calculateWeek(format(weekStart, "yyyy-MM-dd"));
      }
      setIsEditingWage(false);
      onRefresh && onRefresh();
    } catch (err) {
      console.error("Failed to update week wage:", err);
      alert("Failed to update wage.");
    }
  };

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

  const hoursNum = totalHours;
  const usingPayslip = Boolean(payslip && payslip.gross_pay != null);
  const usingEarnings = Boolean(earnings && earnings.gross_pay != null);

  const currentEmploymentType = earnings?.employment_type || user?.employment_type || "employed";
  const isSelfEmployed = currentEmploymentType === "self_employed";

  const source = isSelfEmployed
    ? "Calculated"
    : usingPayslip 
    ? (payslip.source === "manual" ? "Manual Entry" : "Payslip (OCR)") 
    : usingEarnings 
    ? "Calculated Estimate" 
    : "—";

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
  const guildTax = isSelfEmployed && usingEarnings
    ? Number(earnings.guild_tax || 0)
    : null;
  const netPay = usingPayslip
    ? Number(payslip.net_pay || 0)
    : usingEarnings
    ? Number(earnings.net_pay || 0)
    : null;

  if (user && !user.is_calculator_enabled) {
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
                    <div className="text-xs text-gray-300 mb-1">Total Hours</div>
                    <div className="rounded-lg bg-white/10 border border-white/20 px-3 py-2 font-bold">
                        {hoursNum.toFixed(2)} h
                    </div>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-white/20 bg-white/5 p-4 md:p-6 text-white">
      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-3 gap-4 items-end">
        <div>
          <div className="text-xs text-gray-300 mb-1">Week</div>
          <div className="text-sm md:text-base font-semibold">
            {format(weekStart, "dd LLL yyyy")}
          </div>
          {earnings?.tax_week && (
            <div className="text-[10px] text-sky-400 font-bold uppercase tracking-wider mt-0.5">
              Tax Week {earnings.tax_week}
            </div>
          )}
        </div>

        <div>
          <div className="text-xs text-gray-300 mb-1">Hours</div>
          <div className="rounded-lg bg-white/10 border border-white/20 px-3 py-2">
            {hoursNum.toFixed(2)} h
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-300 mb-1">Gross (£)</div>
          <div className="rounded-lg bg-white/10 border border-white/20 px-3 py-2">
            £{gross.toFixed(2)}
          </div>
        </div>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-${isSelfEmployed ? 3 : 2} gap-4 mt-4`}>
        <div className="rounded-lg bg-white/10 border border-white/20 px-3 py-3">
          <div className="text-xs text-gray-300 mb-1">
            {isSelfEmployed ? "Tax (20%)" : "PAYE Tax"}
          </div>
          <div className="text-base font-semibold">
            {payeTax != null ? <>£{payeTax.toFixed(2)}</> : <span className="text-gray-400">—</span>}
          </div>
        </div>

        {isSelfEmployed && (
          <div className="rounded-lg bg-white/10 border border-white/20 px-3 py-3">
            <div className="text-xs text-gray-300 mb-1">Guild Tax</div>
            <div className="text-base font-semibold">
              {guildTax != null ? <>£{guildTax.toFixed(2)}</> : <span className="text-gray-400">—</span>}
            </div>
          </div>
        )}

        <div className="rounded-lg bg-white/10 border border-white/20 px-3 py-3">
          <div className="text-xs text-gray-300 mb-1">Net Pay</div>
          <div className="text-base font-semibold">
            {netPay != null ? `£${netPay.toFixed(2)}` : <span className="text-gray-400">—</span>}
          </div>
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-300 flex items-center gap-2">
        <span>Source:</span>
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
          usingPayslip 
            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
            : usingEarnings 
            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" 
            : "bg-white/5 text-gray-400 border border-white/10"
        }`}>
          {source}
        </span>
      </div>
    </div>
  );
}
