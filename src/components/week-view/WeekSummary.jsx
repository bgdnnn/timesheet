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
        <div className="wf-summary mt-6 rounded-3xl p-4 md:p-6 text-white">
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
    <section className="wf-summary mt-6 rounded-3xl p-4 md:p-6 text-white" aria-label="Weekly earnings summary">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] font-semibold text-teal-300/80 mb-1">The bigger picture</p>
          <h2 className="text-lg font-semibold tracking-tight">Week summary</h2>
          <p className="text-xs text-slate-400 mt-1">
            Starting {format(weekStart, "dd LLL yyyy")}
            {earnings?.tax_week ? ` · Tax week ${earnings.tax_week}` : ""}
          </p>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-[10px] font-semibold tracking-wide border ${
          usingPayslip ? "bg-emerald-400/10 text-emerald-300 border-emerald-400/20"
            : usingEarnings ? "bg-amber-400/10 text-amber-300 border-amber-400/20"
            : "bg-white/5 text-slate-400 border-white/10"
        }`}>
          Source: {source}
        </span>
      </div>
      <div className={`grid grid-cols-2 ${isSelfEmployed ? "lg:grid-cols-5" : "lg:grid-cols-4"} gap-3`}>
        <div className="wf-stat">
          <div className="wf-stat-label">Total hours</div>
          <div className="wf-stat-value">{hoursNum.toFixed(2)}<span className="text-sm text-slate-500 font-normal ml-1">h</span></div>
        </div>
        <div className="wf-stat">
          <div className="wf-stat-label">Gross pay</div>
          <div className="wf-stat-value">£{gross.toFixed(2)}</div>
        </div>
        <div className="wf-stat">
          <div className="wf-stat-label">{isSelfEmployed ? "Tax (20%)" : "PAYE tax"}</div>
          <div className="wf-stat-value">{payeTax != null ? `£${payeTax.toFixed(2)}` : "—"}</div>
        </div>
        {isSelfEmployed && (
          <div className="wf-stat">
            <div className="wf-stat-label">Guild tax</div>
            <div className="wf-stat-value">{guildTax != null ? `£${guildTax.toFixed(2)}` : "—"}</div>
          </div>
        )}
        <div className="wf-stat wf-stat-net">
          <div className="wf-stat-label text-teal-200/70">Net pay</div>
          <div className="wf-stat-value">{netPay != null ? `£${netPay.toFixed(2)}` : "—"}</div>
        </div>
      </div>
    </section>
  );
}
