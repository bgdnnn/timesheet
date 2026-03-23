import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { User as UserApi } from "@/api/entities";

const ModalOverlay = ({ children, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
    onClick={onClose}
  >
    {children}
  </motion.div>
);

const ModalContent = ({ children, onClose, className }) => (
  <motion.div
    initial={{ scale: 0.9, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    exit={{ scale: 0.9, opacity: 0 }}
    transition={{ type: "spring", stiffness: 300, damping: 30 }}
    className={`relative bg-gray-800/50 backdrop-blur-2xl border border-white/20 text-white rounded-2xl shadow-2xl p-8 w-full max-w-md ${className || ""}`}
    onClick={(e) => e.stopPropagation()}
  >
    <Button
      variant="ghost"
      size="icon"
      onClick={onClose}
      className="absolute top-4 right-4 text-gray-400 hover:text-white hover:bg-white/10 rounded-full"
    >
      <X className="h-5 w-5" />
    </Button>
    {children}
  </motion.div>
);

export default function ProfileModal({ isOpen, onClose, user, onSave }) {
  const [company, setCompany] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [isCalculatorEnabled, setIsCalculatorEnabled] = useState(true);
  const [employmentType, setEmploymentType] = useState("employed");
  const [guildTax, setGuildTax] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setCompany(user.company || "");
      setHourlyRate(user.wage != null ? String(user.wage) : "");
      setIsCalculatorEnabled(user.is_calculator_enabled ?? true);
      setEmploymentType(user.employment_type || "employed");
      setGuildTax(user.guild_tax != null ? String(user.guild_tax) : "");
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");

    try {
      await UserApi.updateMyUserData({
        company: company.trim(),
        wage:
          hourlyRate === "" ? null : Math.max(0, Number.parseFloat(hourlyRate)),
        is_calculator_enabled: isCalculatorEnabled,
        employment_type: employmentType,
        guild_tax: guildTax === "" ? null : Math.max(0, Number.parseFloat(guildTax)),
      });
      onSave && onSave();
      onClose && onClose();
    } catch (err) {
      console.error(err);
      setError("Could not save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClose={onClose}>
      <ModalContent onClose={onClose} className="mx-4 max-w-sm sm:max-w-md">
        <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 pr-8">Update Profile</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-500/15 border border-red-500/40 px-3 py-2 text-sm">
              {error}
            </div>
          )}

          <div>
            <Label className="text-sm md:text-base">Full Name</Label>
            <Input
              value={user?.full_name || ""}
              disabled
              className="mt-2 bg-white/5 border-white/10 text-gray-400 text-sm md:text-base h-9 md:h-10"
            />
          </div>

          <div>
            <Label className="text-sm md:text-base">Email</Label>
            <Input
              value={user?.email || ""}
              disabled
              className="mt-2 bg-white/5 border-white/10 text-gray-400 text-sm md:text-base h-9 md:h-10"
            />
          </div>

          <div>
            <Label htmlFor="company" className="text-sm md:text-base">Company</Label>
            <Input
              id="company"
              name="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Your company name"
              className="mt-2 bg-white/10 border-white/20 text-sm md:text-base h-9 md:h-10"
            />
          </div>

          <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl border border-white/10">
            <input
              id="isCalculatorEnabled"
              type="checkbox"
              checked={isCalculatorEnabled}
              onChange={(e) => setIsCalculatorEnabled(e.target.checked)}
              className="w-5 h-5 rounded border-white/20 bg-white/10 text-sky-500 focus:ring-sky-500/50"
            />
            <div className="flex flex-col">
              <Label htmlFor="isCalculatorEnabled" className="text-sm font-bold cursor-pointer">
                Enable Wage Calculator
              </Label>
              <span className="text-[10px] text-gray-400">
                Show earnings, taxes, and payslip summary
              </span>
            </div>
          </div>

          {isCalculatorEnabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              <div>
                <Label className="text-sm font-bold mb-2 block">Employment Type</Label>
                <div className="flex gap-4 p-1 bg-white/5 rounded-lg border border-white/10">
                   <button
                    type="button"
                    onClick={() => setEmploymentType("employed")}
                    className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${employmentType === "employed" ? "bg-sky-500 text-black" : "text-gray-400 hover:text-white"}`}
                   >
                     Employed
                   </button>
                   <button
                    type="button"
                    onClick={() => setEmploymentType("self_employed")}
                    className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${employmentType === "self_employed" ? "bg-sky-500 text-black" : "text-gray-400 hover:text-white"}`}
                   >
                     Self-Employed
                   </button>
                </div>
              </div>

              <div>
                <Label htmlFor="hourlyRate" className="text-sm md:text-base">Hourly rate (£)</Label>
                <Input
                  id="hourlyRate"
                  name="hourlyRate"
                  type="number"
                  step="0.50"
                  min="0"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  className="mt-2 bg-white/10 border-white/20 text-sm md:text-base h-9 md:h-10"
                />
              </div>

              {employmentType === "self_employed" && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Label htmlFor="guildTax" className="text-sm md:text-base">Guild Tax (£ per week)</Label>
                  <Input
                    id="guildTax"
                    name="guildTax"
                    type="number"
                    step="0.10"
                    min="0"
                    value={guildTax}
                    onChange={(e) => setGuildTax(e.target.value)}
                    placeholder="e.g. 15.00"
                    className="mt-2 bg-white/10 border-white/20 text-sm md:text-base h-9 md:h-10"
                  />
                </motion.div>
              )}
            </motion.div>
          )}

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-sky-500 hover:bg-sky-600 text-black font-bold rounded-lg px-4 md:px-6 py-2 transition-all text-sm md:text-base"
            >
              {isSaving ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </form>
      </ModalContent>
    </ModalOverlay>
  );
}
