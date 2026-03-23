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

  const source = usingPayslip ? (payslip.source === "manual" ? "Manual Entry" : "Payslip (OCR)") : usingEarnings ? "Calculated" : "—";

  const gross = usingEarnings
    ? Number(earnings.gross_pay)
    : usingPayslip
    ? Number(payslip.gross_pay)
    : 0;

  const payeTax = usingEarnings
    ? Number(earnings.paye_tax || 0)
    : usingPayslip
    ? Number(payslip.paye_tax || 0)
    : null;
  const niEmp = usingEarnings
    ? Number(earnings.national_insurance || 0)
    : usingPayslip
    ? Number(payslip.national_insurance || 0)
    : null;
  const pensionEmp = usingEarnings
    ? Number(earnings.pension || 0)
    : usingPayslip
    ? Number(payslip.pension || 0)
    : null;
  const guildTax = usingEarnings
    ? Number(earnings.guild_tax || 0)
    : null;
  const netPay = usingEarnings
    ? Number(earnings.net_pay || 0)
    : usingPayslip
    ? Number(payslip.net_pay || 0)
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

  const currentEmploymentType = earnings?.employment_type || user?.employment_type || "employed";
  const isSelfEmployed = currentEmploymentType === "self_employed";

  return (
    <div className="mt-4 rounded-2xl border border-white/20 bg-white/5 p-4 md:p-6 text-white">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
        <div className="col-span-1">
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

        <div className="col-span-1">
          <div className="text-xs text-gray-300 mb-1">Hours</div>
          <div className="rounded-lg bg-white/10 border border-white/20 px-3 py-2">
            {hoursNum.toFixed(2)} h
          </div>
        </div>

        <div className="col-span-1">
          <div className="text-xs text-gray-300 mb-1">Hourly Rate (£)</div>
          <div className={`rounded-lg bg-white/10 border border-white/20 px-3 py-2 flex items-center justify-between group ${earnings?.is_manual_wage ? 'border-sky-500/50' : ''}`}>
            {isEditingWage ? (
              <div className="flex items-center gap-1 w-full">
                <input
                  type="number"
                  step="0.01"
                  className="bg-transparent border-none text-white text-sm w-full focus:ring-0 p-0"
                  value={tempWage}
                  onChange={(e) => setTempWage(e.target.value)}
                  autoFocus
                />
                <button onClick={handleSaveWage} className="text-green-400 hover:text-green-300"><Check className="h-3 w-3" /></button>
                <button onClick={() => setIsEditingWage(false)} className="text-red-400 hover:text-red-300"><X className="h-3 w-3" /></button>
              </div>
            ) : (
              <>
                <span className="text-sm">
                  £{earnings?.hourly_wage != null ? Number(earnings.hourly_wage).toFixed(2) : "—"}
                </span>
                <button 
                  onClick={() => setIsEditingWage(true)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white"
                >
                  <Edit2 className="h-3 w-3" />
                </button>
              </>
            )}
          </div>
          {earnings?.is_manual_wage && !isEditingWage && (
            <div className="text-[9px] text-sky-400 mt-1 uppercase font-bold opacity-70">Manual Override</div>
          )}
        </div>



        <div className="col-span-1">
          <div className="text-xs text-gray-300 mb-1">Gross (£)</div>
          <div className="rounded-lg bg-white/10 border border-white/20 px-3 py-2">
            £{gross.toFixed(2)}
          </div>
        </div>

        <div className="col-span-2 md:text-right flex md:justify-end">
          <div className="flex gap-2">
            {!isSelfEmployed && (
              <Button
                onClick={onReplacePayslip}
                variant="outline"
                className="bg-transparent hover:bg-white/10 text-white border-white/20"
              >
                Enter Manual Payslip
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
        <div className="rounded-lg bg-white/10 border border-white/20 px-3 py-3">
          <div className="text-xs text-gray-300 mb-1">
            {isSelfEmployed ? "Tax (20%)" : "PAYE Tax"}
          </div>
          <div className="text-base font-semibold">
            {payeTax != null ? <>£{payeTax.toFixed(2)}</> : <span className="text-gray-400">—</span>}
          </div>
        </div>

        <div className="rounded-lg bg-white/10 border border-white/20 px-3 py-3">
          <div className="text-xs text-gray-300 mb-1">
            {isSelfEmployed ? "Guild Tax" : "NI (Employee)"}
          </div>
          <div className="text-base font-semibold">
            {isSelfEmployed ? (
               guildTax != null ? <>£{guildTax.toFixed(2)}</> : <span className="text-gray-400">—</span>
            ) : (
               niEmp != null ? <>£{niEmp.toFixed(2)}</> : <span className="text-gray-400">—</span>
            )}
          </div>
        </div>

        <div className="rounded-lg bg-white/10 border border-white/20 px-3 py-3">
          <div className="text-xs text-gray-300 mb-1">
            {isSelfEmployed ? "—" : "Pension (You)"}
          </div>
          <div className="text-base font-semibold">
            {isSelfEmployed ? (
               <span className="text-gray-400">N/A</span>
            ) : (
               pensionEmp != null ? <>£{pensionEmp.toFixed(2)}</> : <span className="text-gray-400">—</span>
            )}
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
