import React, { useEffect, useState } from "react";
import { client } from "@/api/timesheetClient";
import { User as UserEntity } from "@/api/entities";
import { RefreshCw, TrendingUp, Wallet, Landmark, PiggyBank, Gavel } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProfileModal from "@/components/profile/ProfileModal.jsx";
import { AnimatePresence } from "framer-motion";

const GlassCard = ({ children, className = "" }) => (
  <div className={`bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg p-6 ${className}`}>
    {children}
  </div>
);

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" });
  } catch (e) {
    return dateStr;
  }
};

const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(Number(val || 0));
};

const EarningCard = ({ title, value, icon: Icon, colorClass = "text-white" }) => (
    <GlassCard className="flex flex-col justify-between h-full">
        <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-300 uppercase tracking-wider">{title}</span>
            <div className={`p-2 rounded-xl bg-white/5 border border-white/10`}>
                <Icon className={`h-5 w-5 ${colorClass}`} />
            </div>
        </div>
        <div>
            <span className="text-3xl font-bold">{formatCurrency(value)}</span>
        </div>
    </GlassCard>
);

export default function Earnings() {
  const [user, setUser] = useState(null);
  const [ytd, setYtd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState("");

  async function fetchData(year) {
    try {
      const url = year ? `/earnings/ytd?tax_year=${year}` : "/earnings/ytd";
      const [ytdData, userData] = await Promise.all([
        client.fetchJson(url),
        UserEntity.me()
      ]);
      setYtd(ytdData);
      setUser(userData);
      
      // Auto-initialize selectedYear with whatever the backend selected
      if (!year && ytdData && ytdData.selected_year) {
        setSelectedYear(ytdData.selected_year);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }

  useEffect(() => {
    async function init() {
        setLoading(true);
        await fetchData(selectedYear);
        setLoading(false);
    }
    init();
  }, [selectedYear]);

  if (loading) {
    return (
        <div className="flex items-center justify-center h-[60vh]">
            <RefreshCw className="h-8 w-8 animate-spin text-white/50" />
        </div>
    );
  }

  const isSelfEmployed = user?.employment_type === "self_employed";
  const hasData = ytd && ytd.gross_pay > 0;

  return (
    <div className="text-white space-y-8">
      <AnimatePresence>
        {isProfileModalOpen && (
          <ProfileModal
            isOpen={isProfileModalOpen}
            onClose={() => setIsProfileModalOpen(false)}
            user={user}
            onSave={async () => {
              await fetchData(selectedYear);
              setIsProfileModalOpen(false);
            }}
          />
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Year-to-Date Earnings</h1>
          <p className="text-gray-300 mt-1">
            {isSelfEmployed 
              ? "Calculated from your logged hours and self-employment settings."
              : "Calculated directly from your uploaded payslips."}
          </p>
        </div>
        {ytd?.available_years && ytd.available_years.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-300">Tax Year:</span>
            <select
              value={selectedYear || ytd.selected_year}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2 text-white font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              {ytd.available_years.map((yr) => (
                <option key={yr} value={yr} className="bg-slate-900 text-white">
                  Tax Year {yr}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
            <Landmark className="h-16 w-16 text-white/20 mb-4" />
            <h2 className="text-xl font-bold mb-2">No Earnings Data</h2>
            <p className="text-gray-300 max-w-md">
                We couldn&apos;t find any earnings data for this tax year. 
                {isSelfEmployed 
                  ? "Logged hours will automatically appear here once you&apos;ve set your hourly rate."
                  : "Please upload a payslip or enter payslip data manually in the Week View."}
            </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <EarningCard title="Gross Pay" value={ytd.gross_pay} icon={TrendingUp} colorClass="text-emerald-400" />
            <EarningCard title="Net Pay" value={ytd.net_pay} icon={Wallet} colorClass="text-sky-400" />
            <EarningCard 
                title={isSelfEmployed ? "Tax (20%)" : "PAYE Tax"} 
                value={ytd.paye_tax} 
                icon={Landmark} 
                colorClass="text-rose-400" 
            />
            {isSelfEmployed ? (
                <EarningCard title="Guild Tax" value={ytd.guild_tax} icon={Gavel} colorClass="text-amber-400" />
            ) : (
                <>
                    <EarningCard title="National Insurance" value={ytd.national_insurance} icon={ShieldCheck} colorClass="text-amber-400" />
                    <EarningCard title="Pension" value={ytd.pension} icon={PiggyBank} colorClass="text-purple-400" />
                </>
            )}
          </div>

          {!isSelfEmployed && (
            <GlassCard className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h2 className="text-xl font-semibold">Yearly Payslips Breakdown</h2>
                <span className="text-sm text-gray-400">
                  {ytd.breakdown?.length || 0} {ytd.breakdown?.length === 1 ? "Payslip" : "Payslips"}
                </span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-white/20 bg-white/5">
                <table className="min-w-full text-sm">
                  <thead className="bg-white/10 text-gray-300 font-medium">
                    <tr>
                      <th className="text-left px-4 py-3">Tax Week</th>
                      <th className="text-left px-4 py-3">Process Date</th>
                      <th className="text-right px-4 py-3">Gross Pay</th>
                      <th className="text-right px-4 py-3">PAYE Tax</th>
                      <th className="text-right px-4 py-3">National Insurance</th>
                      <th className="text-right px-4 py-3">Pension</th>
                      <th className="text-right px-4 py-3">Deductions</th>
                      <th className="text-right px-4 py-3 font-semibold text-emerald-400">Net Pay</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {ytd.breakdown && ytd.breakdown.length > 0 ? (
                      ytd.breakdown.map((item) => (
                        <tr key={item.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 font-medium text-sky-400">
                            Week {item.tax_week} <span className="text-xs text-gray-500 font-normal">({item.tax_year})</span>
                          </td>
                          <td className="px-4 py-3 text-gray-300">
                            {formatDate(item.process_date)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {formatCurrency(item.gross_pay)}
                          </td>
                          <td className="px-4 py-3 text-right text-rose-400">
                            {formatCurrency(item.paye_tax)}
                          </td>
                          <td className="px-4 py-3 text-right text-amber-400">
                            {formatCurrency(item.national_insurance)}
                          </td>
                          <td className="px-4 py-3 text-right text-purple-400">
                            {formatCurrency(item.pension)}
                          </td>
                          <td className="px-4 py-3 text-right text-rose-300">
                            {formatCurrency(item.deductions_total)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-emerald-400">
                            {formatCurrency(item.net_pay)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="px-4 py-8 text-center text-gray-400">
                          No payslips uploaded yet for this tax year.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          )}

          <GlassCard className="bg-blue-500/10 border-blue-500/20">
            <div className="flex gap-4">
                <div className="mt-1">
                    <Landmark className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-blue-100 mb-1">Tax Year Information</h3>
                    <p className="text-sm text-blue-200/70 leading-relaxed">
                        These figures represent your cumulative earnings and deductions for the current UK tax year (starting April 6th). 
                        {isSelfEmployed 
                          ? " Calculations are based on all time entries logged since April 6th."
                          : " Calculations are based entirely on actual payslip data."}
                    </p>
                </div>
            </div>
          </GlassCard>
        </>
      )}
    </div>
  );
}

const ShieldCheck = (props) => (
    <svg 
        {...props} 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
    >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
        <path d="m9 12 2 2 4-4" />
    </svg>
);
