import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { Payslips } from "@/api/entities";
import { format } from "date-fns";

// Reusing ModalOverlay and ModalContent from ProfileModal for consistent styling
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
    className={`relative bg-gray-800/50 backdrop-blur-2xl border border-white/20 text-white rounded-2xl shadow-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto ${className || ""}`}
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

export default function PayslipManualEntryModal({ isOpen, onClose, onSave, initialData }) {
  const [taxCode, setTaxCode] = useState("");
  const [totalGrossPay, setTotalGrossPay] = useState("");
  const [grossForTax, setGrossForTax] = useState("");
  const [payeTax, setPayeTax] = useState("");
  const [nationalInsurance, setNationalInsurance] = useState("");
  const [pension, setPension] = useState("");
  const [taxPeriod, setTaxPeriod] = useState("");
  const [ytdGross, setYtdGross] = useState("");
  const [ytdTax, setYtdTax] = useState("");
  const [ytdNi, setYtdNi] = useState("");
  const [calculatedNetPay, setCalculatedNetPay] = useState("");
  const [deductionsTotal, setDeductionsTotal] = useState("");
  const [processDate, setProcessDate] = useState(""); // Format 'DD/MM/YYYY'

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const paye = parseFloat(payeTax) || 0;
    const ni = parseFloat(nationalInsurance) || 0;
    const pen = parseFloat(pension) || 0;
    const calculatedTotal = (paye + ni + pen).toFixed(2);
    setDeductionsTotal(calculatedTotal);
  }, [payeTax, nationalInsurance, pension]);

  useEffect(() => {
    if (initialData) {
      setTaxCode(initialData.tax_code || "");
      setTotalGrossPay(initialData.total_gross_pay || "");
      setGrossForTax(initialData.gross_for_tax || "");
      setPayeTax(initialData.paye_tax || "");
      setNationalInsurance(initialData.national_insurance || "");
      setPension(initialData.pension || "");
      setTaxPeriod(initialData.tax_period || "");
      setYtdGross(initialData.ytd_gross || "");
      setYtdTax(initialData.ytd_tax || "");
      setYtdNi(initialData.ytd_ni || "");
      setCalculatedNetPay(initialData.calculated_net_pay || "");
      setDeductionsTotal(initialData.deductions_total || "");
      setProcessDate(initialData.process_date || format(new Date(), "dd/MM/yyyy"));
    } else {
        setProcessDate(format(new Date(), "dd/MM/yyyy"));
    }
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");

    try {
      const dataToSend = {
        tax_code: taxCode || "",
        total_gross_pay: parseFloat(totalGrossPay) || 0,
        gross_for_tax: parseFloat(grossForTax) || 0,
        paye_tax: parseFloat(payeTax) || 0,
        national_insurance: parseFloat(nationalInsurance) || 0,
        pension: parseFloat(pension) || 0,
        tax_period: parseInt(taxPeriod, 10) || 1,
        ytd_gross: parseFloat(ytdGross) || 0,
        ytd_tax: parseFloat(ytdTax) || 0,
        ytd_ni: parseFloat(ytdNi) || 0,
        calculated_net_pay: parseFloat(calculatedNetPay) || 0,
        deductions_total: parseFloat(deductionsTotal) || 0,
        process_date: processDate,
      };
      
      // Filter out null/empty values if the backend expects it, or ensure all are sent
      // For now, send all, as backend Pydantic model expects them.
      await Payslips.manualEntry(dataToSend);
      onSave && onSave(); // This will trigger fetchData in WeekView
      onClose && onClose();
    } catch (err) {
      console.error("Manual payslip entry failed:", err);
      setError("Could not save payslip data. Please check your inputs and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClose={onClose}>
      <ModalContent onClose={onClose} className="mx-4">
        <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 pr-8">
            {initialData?.source === 'ocr' ? 'Review Parsed Payslip' : 'Manual Payslip Entry'}
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          {error && (
            <div className="col-span-2 rounded-md bg-red-500/15 border border-red-500/40 px-3 py-2 text-sm">
              {error}
            </div>
          )}

          <div>
            <Label htmlFor="processDate">Process Date (DD/MM/YYYY)</Label>
            <Input id="processDate" type="text" value={processDate} onChange={(e) => setProcessDate(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="taxPeriod">Tax Period (Week No.)</Label>
            <Input id="taxPeriod" type="number" value={taxPeriod} onChange={(e) => setTaxPeriod(e.target.value)} required />
          </div>

          <div className="col-span-2 border-t border-white/20 pt-4 mt-4">
            <h3 className="text-lg font-semibold mb-2">Current Period Earnings</h3>
          </div>
          <div>
            <Label htmlFor="totalGrossPay">Total Gross Pay (£)</Label>
            <Input id="totalGrossPay" type="number" step="0.01" value={totalGrossPay} onChange={(e) => setTotalGrossPay(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="grossForTax">Gross for Tax (£)</Label>
            <Input id="grossForTax" type="number" step="0.01" value={grossForTax} onChange={(e) => setGrossForTax(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="payeTax">PAYE Tax (£)</Label>
            <Input id="payeTax" type="number" step="0.01" value={payeTax} onChange={(e) => setPayeTax(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="nationalInsurance">National Insurance (£)</Label>
            <Input id="nationalInsurance" type="number" step="0.01" value={nationalInsurance} onChange={(e) => setNationalInsurance(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="pension">Pension (£)</Label>
            <Input id="pension" type="number" step="0.01" value={pension} onChange={(e) => setPension(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="deductionsTotal">Total Deductions (£)</Label>
            <Input id="deductionsTotal" type="number" step="0.01" value={deductionsTotal} readOnly className="cursor-not-allowed" />
          </div>
          <div>
            <Label htmlFor="calculatedNetPay">Calculated Net Pay (£)</Label>
            <Input id="calculatedNetPay" type="number" step="0.01" value={calculatedNetPay} onChange={(e) => setCalculatedNetPay(e.target.value)} required />
          </div>
          
          <div className="col-span-2 border-t border-white/20 pt-4 mt-4">
            <h3 className="text-lg font-semibold mb-2">Year-to-Date (YTD) Figures</h3>
          </div>
          <div>
            <Label htmlFor="ytdGross">YTD Gross (£)</Label>
            <Input id="ytdGross" type="number" step="0.01" value={ytdGross} onChange={(e) => setYtdGross(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="ytdTax">YTD Tax (£)</Label>
            <Input id="ytdTax" type="number" step="0.01" value={ytdTax} onChange={(e) => setYtdTax(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="ytdNi">YTD National Insurance (£)</Label>
            <Input id="ytdNi" type="number" step="0.01" value={ytdNi} onChange={(e) => setYtdNi(e.target.value)} required />
          </div>


          <div className="col-span-2 flex justify-end gap-4 pt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-gray-400 hover:text-white hover:bg-white/10 rounded-lg px-4 md:px-6 py-2 transition-all text-sm md:text-base"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold rounded-lg px-4 md:px-6 py-2 transition-all text-sm md:text-base"
            >
              {isSaving ? "Saving..." : "Confirm Data"}
            </Button>
          </div>
        </form>
      </ModalContent>
    </ModalOverlay>
  );
}
