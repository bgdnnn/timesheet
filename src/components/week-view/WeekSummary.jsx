
import React from "react";
import { DollarSign, Clock, Car, Calculator } from "lucide-react";

const GlassCard = ({ children, className = "" }) => (
    <div className={`bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg ${className}`}>
        {children}
    </div>
);

const StatCard = ({ icon: Icon, label, value, className = "" }) => (
    <GlassCard className={`p-4 text-center ${className}`}>
        <Icon className="h-6 w-6 mx-auto mb-2 text-cyan-400" />
        <p className="text-sm text-gray-300 mb-1">{label}</p>
        <p className="text-xl font-bold">{value}</p>
    </GlassCard>
);

export default function WeekSummary({ weekEntries, weekStart, user }) {
    const currentWeekEntries = weekEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        return entryDate >= weekStart && entryDate < weekEnd;
    });

    const totalHoursWorked = currentWeekEntries.reduce((acc, entry) => acc + (entry.hours_worked || 0), 0);
    const totalTravelHours = currentWeekEntries.reduce((acc, entry) => acc + (entry.travel_time || 0), 0);
    const totalHours = totalHoursWorked + totalTravelHours;
    
    const hourlyWage = user?.wage || 0;
    const grossWage = totalHours * hourlyWage;
    const taxRate = 0.29; // 29%
    const netWage = grossWage * (1 - taxRate);

    return (
        <div className="mt-6 md:mt-8 space-y-4 md:space-y-6">
            <div className="text-center">
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">Weekly Summary</h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <StatCard 
                    icon={Clock} 
                    label="Hours Worked" 
                    value={`${totalHoursWorked.toFixed(1)}h`}
                />
                <StatCard 
                    icon={Car} 
                    label="Travel Hours" 
                    value={`${totalTravelHours.toFixed(1)}h`}
                />
                <StatCard 
                    icon={Calculator} 
                    label="Total Hours" 
                    value={`${totalHours.toFixed(1)}h`}
                    className="col-span-2 md:col-span-2"
                />
            </div>

            {hourlyWage > 0 && (
                <GlassCard className="p-4 md:p-6">
                    <div className="text-center mb-4">
                        <DollarSign className="h-6 w-6 md:h-8 md:w-8 mx-auto mb-2 text-green-400" />
                        <h3 className="text-base md:text-lg font-semibold text-white">Wage Calculation</h3>
                        <p className="text-xs md:text-sm text-gray-300">Based on £{hourlyWage.toFixed(2)}/hour</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 text-center">
                        <div className="bg-white/5 p-3 md:p-4 rounded-lg">
                            <p className="text-xs md:text-sm text-gray-300 mb-1">Gross Wage</p>
                            <p className="text-lg md:text-xl font-bold text-green-400">£{grossWage.toFixed(2)}</p>
                        </div>
                        
                        <div className="bg-white/5 p-3 md:p-4 rounded-lg">
                            <p className="text-xs md:text-sm text-gray-300 mb-1">Tax (29%)</p>
                            <p className="text-lg md:text-xl font-bold text-red-400">-£{(grossWage * taxRate).toFixed(2)}</p>
                        </div>
                        
                        <div className="bg-white/5 p-3 md:p-4 rounded-lg border border-cyan-400/30">
                            <p className="text-xs md:text-sm text-gray-300 mb-1">Net Wage</p>
                            <p className="text-xl md:text-2xl font-bold text-cyan-400">£{netWage.toFixed(2)}</p>
                        </div>
                    </div>
                </GlassCard>
            )}

            {hourlyWage === 0 && (
                <GlassCard className="p-4 md:p-6 text-center">
                    <DollarSign className="h-6 w-6 md:h-8 md:w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm md:text-base text-gray-300">
                        Set your hourly wage in your profile to see wage calculations
                    </p>
                </GlassCard>
            )}
        </div>
    );
}
