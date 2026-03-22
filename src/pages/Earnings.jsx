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

const EarningCard = ({ title, value, icon: Icon, colorClass = "text-white" }) => (
    <GlassCard className="flex flex-col justify-between h-full">
        <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-300 uppercase tracking-wider">{title}</span>
            <div className={`p-2 rounded-xl bg-white/5 border border-white/10`}>
                <Icon className={`h-5 w-5 ${colorClass}`} />
            </div>
        </div>
        <div>
            <span className="text-3xl font-bold">£{Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
    </GlassCard>
);

export default function Earnings() {
  const [user, setUser] = useState(null);
  const [ytd, setYtd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  async function fetchData() {
    try {
      const [ytdData, userData] = await Promise.all([
        client.fetchJson("/earnings/ytd"),
        UserEntity.me()
      ]);
      setYtd(ytdData);
      setUser(userData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }

  useEffect(() => {
    async function init() {
        setLoading(true);
        await fetchData();
        setLoading(false);
    }
    init();
  }, []);

  const handleRecalculate = async () => {
    if (!user?.wage) {
      if (confirm("You haven't set your hourly wage yet. Earnings cannot be calculated accurately without it. Would you like to set it now?")) {
        setIsProfileModalOpen(true);
      }
      return;
    }
    setIsCalculating(true);
    try {
        await client.fetchJson("/earnings/recalculate", { method: "POST" });
        await fetchData();
    } catch (error) {
        console.error("Recalculation failed:", error);
    } finally {
        setIsCalculating(false);
    }
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center h-[60vh]">
            <RefreshCw className="h-8 w-8 animate-spin text-white/50" />
        </div>
    );
  }

  const isSelfEmployed = user?.employment_type === "self_employed";

  if (!ytd || (ytd.gross_pay == 0 && !isCalculating)) {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
            <Landmark className="h-16 w-16 text-white/20 mb-4" />
            <h2 className="text-xl font-bold mb-2">No Earnings Data</h2>
            <p className="text-gray-300 mb-6 max-w-md">
                We couldn't find any earnings data for this tax year. 
                {isSelfEmployed 
                  ? "Logged hours will automatically appear here once you've set your hourly rate."
                  : "Please upload a payslip or enter payslip data manually in the Week View."}
            </p>
            <Button onClick={handleRecalculate} disabled={isCalculating} className="bg-white/20 hover:bg-white/30 backdrop-blur-lg border border-white/30">
                <RefreshCw className={`mr-2 h-4 w-4 ${isCalculating ? 'animate-spin' : ''}`} />
                {isCalculating ? 'Recalculating...' : 'Try Recalculating'}
            </Button>
        </div>
    );
  }

  return (
    <div className="text-white space-y-8">
      <AnimatePresence>
        {isProfileModalOpen && (
          <ProfileModal
            isOpen={isProfileModalOpen}
            onClose={() => setIsProfileModalOpen(false)}
            user={user}
            onSave={async () => {
              await fetchData();
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
              : "Calculated from your latest payslip and subsequent time entries."}
          </p>
        </div>
        <Button 
            onClick={handleRecalculate} 
            disabled={isCalculating}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-lg border border-white/30 h-11 px-6"
        >
          <RefreshCw className={`mr-2 h-5 w-5 ${isCalculating ? 'animate-spin' : ''}`} />
          {isCalculating ? 'Recalculating...' : 'Recalculate All'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <EarningCard title="Gross Pay" value={ytd.gross_pay} icon={TrendingUp} colorClass="text-emerald-400" />
        <EarningCard title="Net Pay" value={ytd.net_pay} icon={Wallet} colorClass="text-cyan-400" />
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
                      : " Calculations are based on your latest payslip and all subsequent time entries."}
                </p>
            </div>
        </div>
      </GlassCard>
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
