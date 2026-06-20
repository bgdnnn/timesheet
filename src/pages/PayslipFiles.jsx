import React, { useEffect, useState, useMemo, useRef } from "react";
import { format } from "date-fns";
import { 
  FileText, 
  Upload, 
  Trash2, 
  Eye, 
  EyeOff,
  Calendar, 
  Hash, 
  ArrowUpDown,
  RefreshCw,
  Plus,
  Download,
  X,
  Loader2,
  CheckCircle2,
  FilterX,
  ExternalLink,
  Mail,
  Key,
  Folder,
  Info,
  BookOpen,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { client } from "@/api/timesheetClient";
import { AnimatePresence, motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

const GlassCard = ({ children, className = "" }) => (
  <div className={`bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg p-6 ${className}`}>
    {children}
  </div>
);

const ModalOverlay = ({ children, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    onClick={onClose}
  >
    {children}
  </motion.div>
);

const ModalContent = ({ children, onClose, className = "" }) => (
  <motion.div
    initial={{ scale: 0.9, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    exit={{ scale: 0.9, opacity: 0 }}
    className={`bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl p-6 text-white ${className}`}
    onClick={(e) => e.stopPropagation()}
  >
    {children}
  </motion.div>
);

const getTaxYearString = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    let startYear, endYear;
    if (month < 4 || (month === 4 && day < 6)) {
        startYear = year - 1;
        endYear = year;
    } else {
        startYear = year;
        endYear = year + 1;
    }
    return `${String(startYear).slice(2)}-${String(endYear).slice(2)}`;
};

export default function PayslipFiles() {
  const isMobile = useIsMobile();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isP60UploadModalOpen, setIsP60UploadModalOpen] = useState(false);
  const [isUploading, setIsUpload] = useState(false);
  const [activeTab, setActiveTab] = useState("payslips");
  const [userProfile, setUserProfile] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [showAppPassword, setShowAppPassword] = useState(false);
  const [showPdfPassword, setShowPdfPassword] = useState(false);
  
  // Filtering & Sorting State
  const currentTaxYear = useMemo(() => getTaxYearString(new Date()), []);
  const [filterYear, setFilterYear] = useState("");
  const [filterWeek, setFilterWeek] = useState("");
  const [sortField, setSortField] = useState("date"); 
  const [sortOrder, setSortOrder] = useState("desc");

  // Bulk Upload State
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, status: "" });
  const bulkInputRef = useRef(null);

  // View Modal State
  const [viewPdfUrl, setViewPdfUrl] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Upload Form State
  const [selectedFile, setSelectedFile] = useState(null);
  const [processDate, setProcessDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [taxWeek, setTaxWeek] = useState("");
  const [taxYear, setTaxYear] = useState("");

  async function fetchFiles() {
    setLoading(true);
    try {
      const data = await client.fetchJson("/payslip-files");
      setFiles(data);
      return data;
    } catch (err) {
      console.error("Failed to fetch payslip files:", err);
      toast.error("Failed to load archive");
      return [];
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchFiles();
    client.fetchJson("/me")
      .then(data => setUserProfile(data))
      .catch(err => console.error("Failed to load user profile:", err));
  }, []);

  const handleProfileFieldChange = (field, value) => {
    setUserProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    const toastId = toast.loading("Saving configuration & verifying mailbox...");
    const oldFilesCount = files.length;
    try {
      const updated = await client.fetchJson("/me", {
        method: "PUT",
        body: {
          is_auto_upload_enabled: userProfile.is_auto_upload_enabled,
          auto_upload_provider: userProfile.auto_upload_provider || "gmail",
          auto_upload_folder: userProfile.auto_upload_folder || "",
          auto_upload_company: userProfile.auto_upload_company || "",
          auto_upload_email: userProfile.auto_upload_email || "",
          auto_upload_app_password: userProfile.auto_upload_app_password || "",
          pdf_password: userProfile.pdf_password || "",
        }
      });
      setUserProfile(updated);
      
      if (userProfile.is_auto_upload_enabled) {
        toast.success("Settings saved & mailbox verified!", { id: toastId });
        const newFiles = await fetchFiles();
        const addedCount = newFiles.length - oldFilesCount;
        setImportResult({ count: addedCount, success: true });
      } else {
        toast.success("Settings saved successfully!", { id: toastId });
        await fetchFiles();
      }
      
      setActiveTab("payslips");
    } catch (err) {
      console.error("Failed to save auto upload settings:", err);
      let errorMsg = "Failed to save settings";
      try {
        const match = err.message.match(/HTTP \d+: (\{.*\})/);
        if (match) {
          const parsed = JSON.parse(match[1]);
          if (parsed && parsed.detail) {
            errorMsg = parsed.detail;
          }
        }
      } catch (parseErr) {
        console.error("Failed to parse HTTP error detail:", parseErr);
      }
      toast.error(errorMsg, { id: toastId, duration: 8000 });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile || !taxWeek || !taxYear) {
        toast.error("Please fill all fields");
        return;
    }
    
    setIsUpload(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("process_date", processDate);
    formData.append("tax_week", taxWeek);
    formData.append("tax_year", taxYear);

    try {
      await client.fetchJson("/payslip-files/upload", {
        method: "POST",
        body: formData
      });
      toast.success("Payslip archived");
      setIsUploadModalOpen(false);
      setSelectedFile(null);
      setTaxWeek("");
      setTaxYear("");
      fetchFiles();
    } catch (err) {
      console.error("Upload failed:", err);
      toast.error("Upload failed");
    } finally {
      setIsUpload(false);
    }
  };

  const handleP60Upload = async (e) => {
    e.preventDefault();
    if (!selectedFile || !taxYear) {
        toast.error("Please fill all fields");
        return;
    }
    
    setIsUpload(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("process_date", processDate);
    formData.append("tax_week", "0");
    formData.append("tax_year", taxYear);

    try {
      await client.fetchJson("/payslip-files/upload", {
        method: "POST",
        body: formData
      });
      toast.success("P60 archived");
      setIsP60UploadModalOpen(false);
      setSelectedFile(null);
      setTaxYear("");
      fetchFiles();
    } catch (err) {
      console.error("P60 upload failed:", err);
      toast.error("Upload failed");
    } finally {
      setIsUpload(false);
    }
  };

  const handleBulkFiles = async (e) => {
    const selectedFiles = Array.from(e.target.files).filter(f => f.name.toLowerCase().endsWith(".pdf"));
    if (selectedFiles.length === 0) return;

    setBulkProgress({ current: 0, total: selectedFiles.length, status: "Starting..." });
    setIsUpload(true);

    // Robust parsing: Find week and years independently of order
    const weekPattern = /(?:Week|Period)[_\s]?(\d+)/i;
    const yearPattern = /(\d{4})[_\-\s]?(\d{4})/i;

    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const weekMatch = file.name.match(weekPattern);
      const yearMatch = file.name.match(yearPattern);
      
      if (!weekMatch || !yearMatch) {
        console.warn(`File name did not match patterns: ${file.name}`);
        skippedCount++;
        continue;
      }

      const week = weekMatch[1];
      const startYear = yearMatch[1];
      const endYear = yearMatch[2];
      const taxYearStr = `${startYear.slice(2)}-${endYear.slice(2)}`;

      setBulkProgress({ 
        current: i + 1, 
        total: selectedFiles.length, 
        status: `Uploading Week ${week}, Year ${taxYearStr}...` 
      });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("tax_week", week);
      formData.append("tax_year", taxYearStr);

      try {
        await client.fetchJson("/payslip-files/upload", {
          method: "POST",
          body: formData
        });
        successCount++;
      } catch (err) {
        console.error(`Failed to upload ${file.name}:`, err);
        failedCount++;
      }
    }

    setBulkProgress({ current: selectedFiles.length, total: selectedFiles.length, status: "Complete!" });
    
    if (successCount > 0 && failedCount === 0 && skippedCount === 0) {
        toast.success(`Successfully uploaded ${successCount} payslips.`);
    } else if (successCount > 0) {
        toast.info(`Uploaded ${successCount} payslips. ${failedCount} failed, ${skippedCount} skipped.`, { duration: 6000 });
    } else if (failedCount > 0 || skippedCount > 0) {
        toast.error(`Upload failed. ${failedCount} errors, ${skippedCount} naming issues. Check console for details.`, { duration: 8000 });
    }

    setTimeout(() => {
        setIsUpload(false);
        setBulkProgress({ current: 0, total: 0, status: "" });
        fetchFiles();
    }, 1500);
  };

  const handleDelete = async (file) => {
    const isP60 = file.tax_week === 0;
    if (!confirm(`Are you sure you want to delete this ${isP60 ? "P60 statement" : "payslip"}?`)) return;
    try {
      await client.fetchJson(`/payslip-files/${file.id}`, { method: "DELETE" });
      toast.success("Deleted");
      fetchFiles();
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Delete failed");
    }
  };

  const handleAction = async (file, action = "view") => {
    if (action === "download") {
        if (!window.confirm(`Download payslip "${file.filename}"?`)) return;
    }

    if (isMobile && action === "view") {
        toast.info("Opening payslip...");
        const url = `${client.baseUrl}/payslip-files/${file.id}/view`;
        window.open(url, "_blank");
        return;
    }

    const toastId = toast.loading(action === "view" ? "Loading viewer..." : "Preparing download...");

    try {
      const response = await fetch(`${client.baseUrl}/payslip-files/${file.id}/${action}`, {
        credentials: "include"
      });
      if (!response.ok) throw new Error("Action failed");
      
      const blob = await response.blob();
      const pdfBlob = new Blob([blob], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(pdfBlob);
      
      if (action === "download") {
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', file.filename);
          document.body.appendChild(link);
          link.click();
          link.remove();
          toast.success("Download started", { id: toastId });
          setTimeout(() => window.URL.revokeObjectURL(url), 100);
      } else {
          setViewPdfUrl(url);
          setIsViewModalOpen(true);
          toast.dismiss(toastId);
      }
    } catch (err) {
      console.error(`${action} failed:`, err);
      toast.error("Error occurred", { id: toastId });
    }
  };

  const closeViewModal = () => {
    if (viewPdfUrl) window.URL.revokeObjectURL(viewPdfUrl);
    setViewPdfUrl(null);
    setIsViewModalOpen(false);
  };

  const filteredAndSortedFiles = useMemo(() => {
    let result = [...files];

    if (activeTab === "payslips") {
        result = result.filter(f => f.tax_week !== 0);
    } else {
        result = result.filter(f => f.tax_week === 0);
    }

    if (filterYear) {
        result = result.filter(f => f.tax_year === filterYear);
    }
    if (filterWeek && activeTab === "payslips") {
        result = result.filter(f => String(f.tax_week) === filterWeek);
    }

    result.sort((a, b) => {
      let valA, valB;
      if (sortField === "date") {
        valA = new Date(a.process_date).getTime();
        valB = new Date(b.process_date).getTime();
      } else if (sortField === "week") {
        valA = Number(a.tax_week);
        valB = Number(b.tax_week);
      } else {
        valA = a.tax_year;
        valB = b.tax_year;
      }
      if (valA < valB) return sortOrder === "desc" ? 1 : -1;
      if (valA > valB) return sortOrder === "desc" ? -1 : 1;
      return 0;
    });

    return result;
  }, [files, filterYear, filterWeek, sortField, sortOrder, activeTab]);

  const uniqueYears = useMemo(() => {
    const years = [...new Set(files.map(f => f.tax_year))];
    return years.sort((a, b) => b.localeCompare(a));
  }, [files]);

  if (loading) {
    return (
        <div className="flex items-center justify-center h-[60vh]">
            <RefreshCw className="h-8 w-8 animate-spin text-white/20" />
        </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-white space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payslip Archive</h1>
          <p className="text-gray-300 mt-1">Upload and manage your payslip PDF documents.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <input 
                type="file" 
                multiple 
                ref={bulkInputRef}
                onChange={handleBulkFiles}
                className="hidden"
                accept=".pdf"
            />
            <Button 
                onClick={() => bulkInputRef.current.click()}
                variant="outline"
                className="bg-white/10 hover:bg-white/20 border-white/20 text-white font-bold h-11 px-6 rounded-xl flex items-center justify-center gap-2 w-full sm:w-auto"
            >
                <Upload className="h-5 w-5" />
                Bulk Upload
            </Button>
            <Button 
                onClick={() => setIsUploadModalOpen(true)}
                className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold h-11 px-6 rounded-xl flex items-center justify-center gap-2 w-full sm:w-auto"
            >
                <Plus className="h-5 w-5" />
                Single PDF
            </Button>
            <Button 
                onClick={() => {
                  setProcessDate(format(new Date(), "yyyy-MM-dd"));
                  setTaxYear("");
                  setSelectedFile(null);
                  setIsP60UploadModalOpen(true);
                }}
                className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold h-11 px-6 rounded-xl flex items-center justify-center gap-2 w-full sm:w-auto"
            >
                <Plus className="h-5 w-5" />
                Add P60
            </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-white/10 mb-6">
        <button
          onClick={() => {
            setActiveTab("payslips");
            setSortField("date");
          }}
          className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${
            activeTab === "payslips" ? "text-cyan-400 border-cyan-400" : "text-gray-400 hover:text-white border-transparent"
          }`}
        >
          Weekly Payslips
        </button>
        <button
          onClick={() => {
            setActiveTab("p60");
            setSortField("date");
          }}
          className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${
            activeTab === "p60" ? "text-cyan-400 border-cyan-400" : "text-gray-400 hover:text-white border-transparent"
          }`}
        >
          P60 End-of-Year Statements
        </button>
        <button
          onClick={() => {
            setActiveTab("autoUpload");
          }}
          className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${
            activeTab === "autoUpload" ? "text-cyan-400 border-cyan-400" : "text-gray-400 hover:text-white border-transparent"
          }`}
        >
          Automatic Upload
        </button>
      </div>

      {/* Filters & Sorting */}
      {activeTab !== "autoUpload" && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <GlassCard className="md:col-span-1 p-4">
              <Label className="text-xs text-gray-400 uppercase font-bold mb-2 block">Filter Year</Label>
              <select 
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sky-500/50"
              >
                  <option value="" className="bg-sky-900">All Years</option>
                  {uniqueYears.map(y => (
                      <option key={y} value={y} className="bg-sky-900">{y}</option>
                  ))}
              </select>
          </GlassCard>

          {activeTab === "payslips" ? (
            <>
              <GlassCard className="md:col-span-1 p-4">
                  <Label className="text-xs text-gray-400 uppercase font-bold mb-2 block">Filter Week</Label>
                  <Input 
                      type="number"
                      placeholder="e.g. 50"
                      value={filterWeek}
                      onChange={(e) => setFilterWeek(e.target.value)}
                      className="bg-white/5 border-white/10 h-10"
                  />
              </GlassCard>

              <GlassCard className="md:col-span-2 flex flex-wrap items-center justify-between gap-4 p-4">
                  <div className="flex items-center gap-4">
                      <span className="text-xs text-gray-400 font-bold uppercase">Sort:</span>
                      <div className="flex gap-2">
                          {["date", "week"].map(f => (
                              <button
                                  key={f}
                                  onClick={() => {
                                      if (sortField === f) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                                      else { setSortField(f); setSortOrder("desc"); }
                                  }}
                                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${sortField === f ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "text-gray-400 hover:text-white bg-white/5"}`}
                              >
                                  {f.charAt(0).toUpperCase() + f.slice(1)}
                                  {sortField === f && <ArrowUpDown className="h-3 w-3" />}
                              </button>
                          ))}
                      </div>
                  </div>
                  <div className="flex gap-2">
                      {(filterYear || filterWeek) && (
                          <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => { setFilterYear(""); setFilterWeek(""); }}
                              title="Clear Filters"
                              className="text-rose-400 hover:bg-rose-500/10"
                          >
                              <FilterX className="h-4 w-4" />
                          </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={fetchFiles} className="text-gray-400 hover:text-white">
                          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                      </Button>
                  </div>
              </GlassCard>
            </>
          ) : (
            <GlassCard className="md:col-span-3 flex flex-wrap items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-400 font-bold uppercase">Sort:</span>
                    <div className="flex gap-2">
                        {["date", "year"].map(f => (
                            <button
                                key={f}
                                onClick={() => {
                                    if (sortField === f) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                                    else { setSortField(f); setSortOrder("desc"); }
                                }}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${sortField === f ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "text-gray-400 hover:text-white bg-white/5"}`}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                                {sortField === f && <ArrowUpDown className="h-3 w-3" />}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex gap-2">
                    {filterYear && (
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => { setFilterYear(""); }}
                            title="Clear Filters"
                            className="text-rose-400 hover:bg-rose-500/10"
                        >
                            <FilterX className="h-4 w-4" />
                        </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={fetchFiles} className="text-gray-400 hover:text-white">
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </GlassCard>
          )}
        </div>
      )}

      {/* Progress Overlay */}
      <AnimatePresence>
        {isUploading && bulkProgress.total > 0 && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-6">
                <GlassCard className="max-w-md w-full p-8 text-center space-y-6 bg-white/10 border-cyan-500/30">

                    {bulkProgress.current === bulkProgress.total && bulkProgress.status === "Complete!" ? (
                        <CheckCircle2 className="h-16 w-16 text-green-400 mx-auto animate-bounce" />
                    ) : (
                        <Loader2 className="h-16 w-16 text-cyan-400 mx-auto animate-spin" />
                    )}
                    <div>
                        <h2 className="text-2xl font-bold mb-2">
                            {bulkProgress.current === bulkProgress.total && bulkProgress.status === "Complete!" 
                                ? "Processing Complete" 
                                : "Bulk Uploading..."}
                        </h2>
                        <p className="text-gray-400">{bulkProgress.status}</p>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                        <motion.div 
                            className="bg-cyan-500 h-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                        />
                    </div>
                    <div className="text-sm font-bold text-gray-300 uppercase tracking-widest">
                        {bulkProgress.current} / {bulkProgress.total} Files
                    </div>
                </GlassCard>
            </div>
        )}
      </AnimatePresence>

      {/* Files List / Automatic Upload Tab */}
      {activeTab !== "autoUpload" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredAndSortedFiles.map((file) => (
              <motion.div
                key={file.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <GlassCard className="group hover:border-cyan-500/30 transition-all duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 transition-all group-hover:bg-cyan-500/10 group-hover:border-cyan-500/20 text-cyan-400">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleAction(file, "view")}
                        title={isMobile ? "Open PDF" : "View PDF"}
                        className="text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-full h-8 w-8"
                      >
                        {isMobile ? <ExternalLink className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleAction(file, "download")}
                        title="Download PDF"
                        className="text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-full h-8 w-8"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(file)}
                        title="Delete"
                        className="text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-full h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-lg leading-none mb-2">
                      {file.tax_week === 0 ? `P60 Statement - Year ${file.tax_year}` : file.filename}
                    </h3>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(file.process_date), "dd MMM yyyy")}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Hash className="h-3 w-3" />
                        {file.tax_week === 0 ? (
                          <span>Year {file.tax_year}</span>
                        ) : (
                          <span>Tax Week {file.tax_week} • Year {file.tax_year}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredAndSortedFiles.length === 0 && !loading && !isUploading && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
              <FileText className="h-16 w-16 text-white/10 mb-4" />
              <p className="text-gray-400 font-medium">
                {activeTab === "p60" ? "No P60 statements found matching your filters." : "No payslips found matching your filters."}
              </p>
              <Button 
                variant="link" 
                onClick={() => { setFilterYear(""); setFilterWeek(""); }}
                className="text-cyan-400 mt-2 hover:text-cyan-300"
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      ) : (
        userProfile && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Settings Form */}
            <GlassCard className="border-white/10 space-y-6">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <Mail className="h-6 w-6 text-cyan-400" />
                <div>
                  <h2 className="text-xl font-bold">Mailbox Auto-Upload</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Configure automatic payslip PDF extraction from your email.</p>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-6">
                {/* Toggle switch */}
                <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="space-y-0.5 pr-4">
                    <Label className="text-sm font-bold block">Status</Label>
                    <span className="text-xs text-gray-400">Enable background email scanning for new payslips.</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input 
                      type="checkbox" 
                      checked={userProfile.is_auto_upload_enabled} 
                      onChange={(e) => handleProfileFieldChange("is_auto_upload_enabled", e.target.checked)} 
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                  </label>
                </div>

                {userProfile.is_auto_upload_enabled && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-bold text-gray-400 uppercase">Mail Provider</Label>
                        <select
                          value={userProfile.auto_upload_provider || "gmail"}
                          onChange={(e) => handleProfileFieldChange("auto_upload_provider", e.target.value)}
                          className="mt-1.5 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                        >
                          <option value="gmail" className="bg-gray-900 text-white">Gmail</option>
                          <option value="yahoo" className="bg-gray-900 text-white">Yahoo Mail</option>
                        </select>
                      </div>

                      <div>
                        <Label className="text-xs font-bold text-gray-400 uppercase">IMAP Folder</Label>
                        <Input
                          type="text"
                          placeholder="e.g. INBOX or Job"
                          value={userProfile.auto_upload_folder || ""}
                          onChange={(e) => handleProfileFieldChange("auto_upload_folder", e.target.value)}
                          className="mt-1.5 bg-white/5 border-white/10"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs font-bold text-gray-400 uppercase">Company Name / Subject Filter (Optional)</Label>
                      <Input
                        type="text"
                        placeholder="e.g. Payslip"
                        value={userProfile.auto_upload_company || ""}
                        onChange={(e) => handleProfileFieldChange("auto_upload_company", e.target.value)}
                        className="mt-1.5 bg-white/5 border-white/10"
                      />
                      <span className="text-[10px] text-gray-500 mt-1 block">Filters emails to only scan those containing this word in the subject.</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-bold text-gray-400 uppercase">Email Username</Label>
                        <Input
                          type="email"
                          placeholder="your_email@gmail.com"
                          value={userProfile.auto_upload_email || ""}
                          onChange={(e) => handleProfileFieldChange("auto_upload_email", e.target.value)}
                          className="mt-1.5 bg-white/5 border-white/10"
                          required
                        />
                      </div>

                      <div>
                        <Label className="text-xs font-bold text-gray-400 uppercase">Mail App Password</Label>
                        <div className="relative mt-1.5">
                          <Input
                            type={showAppPassword ? "text" : "password"}
                            placeholder="16-character app password"
                            value={userProfile.auto_upload_app_password || ""}
                            onChange={(e) => handleProfileFieldChange("auto_upload_app_password", e.target.value)}
                            className="bg-white/5 border-white/10 pr-10"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowAppPassword(!showAppPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white focus:outline-none"
                          >
                            {showAppPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-4">
                      <Label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1">
                        <Lock className="h-3.5 w-3.5 text-cyan-400" />
                        PDF Decryption Password (Optional)
                      </Label>
                      <div className="relative mt-1.5">
                        <Input
                          type={showPdfPassword ? "text" : "password"}
                          placeholder="Enter password if your payslip PDFs are locked"
                          value={userProfile.pdf_password || ""}
                          onChange={(e) => handleProfileFieldChange("pdf_password", e.target.value)}
                          className="bg-white/5 border-white/10 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPdfPassword(!showPdfPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white focus:outline-none"
                        >
                          {showPdfPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <span className="text-[10px] text-gray-500 mt-1 block">Your app password and PDF password are encrypted in the database.</span>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={savingProfile}
                  className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold h-11 rounded-xl shadow-lg active:scale-[0.98] transition-all"
                >
                  {savingProfile ? "Saving..." : "Save Settings"}
                </Button>
              </form>
            </GlassCard>

            {/* Guide / Instructions Readme */}
            <GlassCard className="border-white/10 h-fit space-y-6">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <BookOpen className="h-6 w-6 text-cyan-400" />
                <h2 className="text-xl font-bold">Setup Instructions</h2>
              </div>

              {userProfile.auto_upload_provider === "gmail" ? (
                <div className="space-y-4 text-sm text-gray-300">
                  <div className="bg-cyan-500/10 border border-cyan-500/20 p-3 rounded-lg flex gap-2 text-xs text-cyan-400">
                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>Gmail requires a <strong>Google App Password</strong>. Your regular login password will not work.</span>
                  </div>

                  <ol className="list-decimal list-inside space-y-3">
                    <li>Go to your <a href="https://myaccount.google.com/" target="_blank" rel="noreferrer" className="text-cyan-400 underline hover:text-cyan-300">Google Account</a> console.</li>
                    <li>Click on **Security** on the left menu.</li>
                    <li>Under **How you sign in to Google**, ensure **2-Step Verification** is turned on.</li>
                    <li>Search for **App passwords** in the top search bar, or go into 2-Step Verification and scroll to the bottom.</li>
                    <li>Enter a name for the app (e.g., `Timesheet App`) and click **Create**.</li>
                    <li>Copy the generated **16-character password** (yellow box) and paste it into the **Mail App Password** field.</li>
                  </ol>
                </div>
              ) : (
                <div className="space-y-4 text-sm text-gray-300">
                  <div className="bg-cyan-500/10 border border-cyan-500/20 p-3 rounded-lg flex gap-2 text-xs text-cyan-400">
                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>Yahoo Mail requires a <strong>Yahoo App Password</strong>. Your regular login password will not work.</span>
                  </div>

                  <ol className="list-decimal list-inside space-y-3">
                    <li>Go to your Yahoo Account Info page.</li>
                    <li>Select the **Account Security** tab on the left.</li>
                    <li>Scroll down and click **Generate app password** (or **Manage app passwords**).</li>
                    <li>Select your app type or enter a custom name (e.g. `Timesheet App`) and click **Generate**.</li>
                    <li>Copy the generated **16-character password** and paste it into the **Mail App Password** field.</li>
                  </ol>
                </div>
              )}
            </GlassCard>
          </div>
        )
      )}

      {/* View Modal (Laptop Only) */}
      <AnimatePresence>
        {isViewModalOpen && (
          <ModalOverlay onClose={closeViewModal}>
            <ModalContent onClose={closeViewModal} className="max-w-5xl w-full h-[90vh] flex flex-col p-0 overflow-hidden bg-white/10 border-white/10">
              <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">

                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-cyan-400" />
                  <span className="font-bold text-sm md:text-base">Payslip Viewer</span>
                </div>
                <Button variant="ghost" size="icon" onClick={closeViewModal} className="text-gray-400 hover:text-white rounded-full">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex-1 w-full bg-white">
                <iframe src={viewPdfUrl} className="w-full h-full border-none" title="PDF Viewer" />
              </div>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* Single Upload Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <ModalOverlay onClose={() => setIsUploadModalOpen(false)}>
            <ModalContent onClose={() => setIsUploadModalOpen(false)} className="max-w-md">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                    <Plus className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-bold">Archive Payslip</h2>
              </div>

              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <Label>PDF File</Label>
                  <Input 
                    type="file" 
                    accept="application/pdf"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    className="mt-1.5 bg-white/5 border-white/10"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>Process Date</Label>
                        <Input 
                            type="date" 
                            value={processDate}
                            onChange={(e) => setProcessDate(e.target.value)}
                            className="mt-1.5 bg-white/5 border-white/10"
                            required
                        />
                    </div>
                    <div>
                        <Label>Tax Week</Label>
                        <Input 
                            type="number" 
                            placeholder="e.g. 50"
                            value={taxWeek}
                            onChange={(e) => setTaxWeek(e.target.value)}
                            className="mt-1.5 bg-white/5 border-white/10"
                            required
                        />
                    </div>
                </div>

                <div>
                  <Label>Tax Year (ex: 25-26)</Label>
                  <Input 
                    type="text" 
                    placeholder="25-26"
                    value={taxYear}
                    onChange={(e) => setTaxYear(e.target.value)}
                    className="mt-1.5 bg-white/5 border-white/10"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setIsUploadModalOpen(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isUploading}
                    className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold px-6 rounded-xl"
                  >
                    {isUploading ? "Uploading..." : "Archive Payslip"}
                  </Button>
                </div>
              </form>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* P60 Upload Modal */}
      <AnimatePresence>
        {isP60UploadModalOpen && (
          <ModalOverlay onClose={() => setIsP60UploadModalOpen(false)}>
            <ModalContent onClose={() => setIsP60UploadModalOpen(false)} className="max-w-md">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                    <Plus className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-bold">Archive P60 Statement</h2>
              </div>

              <form onSubmit={handleP60Upload} className="space-y-4">
                <div>
                  <Label>P60 PDF File</Label>
                  <Input 
                    type="file" 
                    accept="application/pdf"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    className="mt-1.5 bg-white/5 border-white/10"
                    required
                  />
                </div>

                <div>
                    <Label>Process Date</Label>
                    <Input 
                        type="date" 
                        value={processDate}
                        onChange={(e) => setProcessDate(e.target.value)}
                        className="mt-1.5 bg-white/5 border-white/10"
                        required
                    />
                </div>

                <div>
                  <Label>Tax Year (ex: 25-26)</Label>
                  <Input 
                    type="text" 
                    placeholder="25-26"
                    value={taxYear}
                    onChange={(e) => setTaxYear(e.target.value)}
                    className="mt-1.5 bg-white/5 border-white/10"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setIsP60UploadModalOpen(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isUploading}
                    className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold px-6 rounded-xl"
                  >
                    {isUploading ? "Uploading..." : "Archive P60"}
                  </Button>
                </div>
              </form>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* Import Success Modal */}
      <AnimatePresence>
        {importResult && (
          <ModalOverlay onClose={() => setImportResult(null)}>
            <ModalContent onClose={() => setImportResult(null)} className="max-w-md text-center p-8">
              <div className="flex flex-col items-center">
                <div className="p-4 rounded-full bg-emerald-500/20 text-emerald-400 mb-4">
                  <CheckCircle2 className="h-12 w-12" />
                </div>
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400 mb-2">Import Complete</h2>
                <p className="text-gray-300 text-sm mb-6">
                  {importResult.count > 0 
                    ? `Successfully connected to your mailbox and imported ${importResult.count} new statement(s).` 
                    : "Successfully checked your mailbox, but no new payslip or P60 statements were found."}
                </p>
                <Button 
                  onClick={() => setImportResult(null)}
                  className="bg-gradient-to-r from-sky-500 to-sky-600 text-white font-semibold py-2.5 px-8 rounded-xl shadow-lg hover:from-sky-400 hover:to-sky-500 transition-all duration-200"
                >
                  Close
                </Button>
              </div>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
