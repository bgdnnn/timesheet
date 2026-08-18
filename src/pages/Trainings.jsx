import React, { useEffect, useState, useMemo } from "react";
import { format, differenceInDays, addMonths, isBefore } from "date-fns";
import { 
  Award, 
  Upload, 
  Trash2, 
  Eye, 
  Calendar, 
  AlertTriangle,
  RefreshCw,
  Plus,
  Download,
  X,
  ExternalLink,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Edit
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { client } from "@/api/timesheetClient";
import { AnimatePresence, motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { Trainings as TrainingsApi } from "@/api/entities";
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

export default function Trainings() {
  const isMobile = useIsMobile();
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUpload] = useState(false);
  const [activeTab, setActiveTab] = useState("active");
  
  // View Modal State
  const [viewFile, setViewFile] = useState(null); // { url, type, name }
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Edit Modal State
  const [editingTraining, setEditingTraining] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editExpiryDate, setEditExpiryDate] = useState("");
  const [editNoExpiry, setEditNoExpiry] = useState(false);

  // Upload Form State
  const [selectedFile, setSelectedFile] = useState(null);
  const [name, setName] = useState("");
  const [expiryDate, setExpiryDate] = useState(format(addMonths(new Date(), 12), "yyyy-MM-dd"));
  const [noExpiry, setNoExpiry] = useState(false);

  const activeTrainings = useMemo(() => {
    return trainings.filter((t) => {
      const hasExpiry = !!t.expiry_date && t.expiry_date !== "N/A";
      if (!hasExpiry) return true;
      const daysLeft = differenceInDays(new Date(t.expiry_date), new Date());
      return daysLeft > 0;
    });
  }, [trainings]);

  const archivedTrainings = useMemo(() => {
    return trainings.filter((t) => {
      const hasExpiry = !!t.expiry_date && t.expiry_date !== "N/A";
      if (!hasExpiry) return false;
      const daysLeft = differenceInDays(new Date(t.expiry_date), new Date());
      return daysLeft <= 0;
    });
  }, [trainings]);

  const displayedTrainings = useMemo(() => {
    return activeTab === "active" ? activeTrainings : archivedTrainings;
  }, [activeTab, activeTrainings, archivedTrainings]);

  async function fetchTrainings() {
    setLoading(true);
    try {
      const data = await TrainingsApi.list();
      setTrainings(data);
    } catch (err) {
      console.error("Failed to fetch trainings:", err);
      toast.error("Failed to load certificates");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTrainings();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile || !name || (!noExpiry && !expiryDate)) {
        toast.error("Please fill all fields");
        return;
    }
    
    setIsUpload(true);
    try {
      await TrainingsApi.upload({
        file: selectedFile,
        name: name,
        expiry_date: noExpiry ? "N/A" : expiryDate
      });
      toast.success("Certificate saved successfully!");
      setIsUploadModalOpen(false);
      setSelectedFile(null);
      setName("");
      setNoExpiry(false);
      fetchTrainings();
    } catch (err) {
      console.error("Upload failed:", err);
      toast.error("Upload failed. Ensure it's a PDF or Image.");
    } finally {
      setIsUpload(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingTraining || !editName || (!editNoExpiry && !editExpiryDate)) return;

    setIsUpload(true);
    try {
      await TrainingsApi.update(editingTraining.id, {
        name: editName,
        expiry_date: editNoExpiry ? null : editExpiryDate
      });
      toast.success("Certificate updated successfully!");
      setIsEditModalOpen(false);
      setEditingTraining(null);
      fetchTrainings();
    } catch (err) {
      console.error("Update failed:", err);
      toast.error("Failed to update certificate details.");
    } finally {
      setIsUpload(false);
    }
  };

  const openEditModal = (t) => {
    setEditingTraining(t);
    setEditName(t.name);
    const hasExp = !!t.expiry_date && t.expiry_date !== "N/A";
    setEditExpiryDate(hasExp ? t.expiry_date : "");
    setEditNoExpiry(!hasExp);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this certificate?")) return;
    try {
      await TrainingsApi.remove(id);
      toast.success("Certificate deleted");
      fetchTrainings();
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete certificate");
    }
  };

  const handleAction = async (training, action = "view") => {
    // 1. Confirmation for download
    if (action === "download") {
        if (!window.confirm(`Do you want to download "${training.name}"?`)) return;
    }

    if (isMobile) {
        toast.info(action === "view" ? "Opening certificate..." : "Starting download...");
        const url = action === "view" ? TrainingsApi.fileUrl(training.id) : TrainingsApi.downloadUrl(training.id);
        window.open(url, "_blank");
        if (action === "download") {
            setTimeout(() => toast.success("Download requested"), 1000);
        }
        return;
    }

    const toastId = toast.loading(action === "view" ? "Loading viewer..." : "Preparing file for download...");

    try {
      const urlToFetch = action === "view" ? TrainingsApi.fileUrl(training.id) : TrainingsApi.downloadUrl(training.id);
      const response = await fetch(urlToFetch, {
        credentials: "include"
      });
      if (!response.ok) throw new Error("Action failed");
      
      const blob = await response.blob();
      
      // Determine file type
      let fileType = training.mime_type;
      if (fileType === "application/pdf" || training.filename.toLowerCase().endsWith(".pdf")) {
          fileType = "application/pdf";
      }

      // Create blob with explicit type
      const pdfBlob = new Blob([blob], { type: fileType });
      const url = window.URL.createObjectURL(pdfBlob);
      
      if (action === "download") {
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', training.filename);
          document.body.appendChild(link);
          link.click();
          link.remove();
          toast.success("File ready! Download started.", { id: toastId });
          setTimeout(() => window.URL.revokeObjectURL(url), 100);
      } else {
          setViewFile({ url, type: fileType, name: training.name });
          setIsViewModalOpen(true);
          toast.dismiss(toastId);
      }
    } catch (err) {
      console.error(`${action} failed:`, err);
      toast.error("Action failed. Please try again.", { id: toastId });
    }
  };

  const closeViewModal = () => {
    if (viewFile?.url) window.URL.revokeObjectURL(viewFile.url);
    setViewFile(null);
    setIsViewModalOpen(false);
  };

  return (
    <div className="text-white space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trainings & Certificates</h1>
          <p className="text-gray-300 mt-1">Manage your professional certifications and expiry reminders.</p>
        </div>
        <Button 
          onClick={() => setIsUploadModalOpen(true)}
          className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold h-11 px-6 rounded-xl flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add Certificate
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 mb-2">
        <button
          onClick={() => setActiveTab("active")}
          className={`px-6 py-3 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "active" ? "text-cyan-400 border-cyan-400" : "text-gray-400 hover:text-white border-transparent"
          }`}
        >
          <span>Active Certificates</span>
          <span className={`px-2 py-0.5 text-xs rounded-full ${
            activeTab === "active" ? "bg-cyan-500/20 text-cyan-400" : "bg-white/5 text-gray-400"
          }`}>
            {activeTrainings.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("archived")}
          className={`px-6 py-3 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "archived" ? "text-cyan-400 border-cyan-400" : "text-gray-400 hover:text-white border-transparent"
          }`}
        >
          <span>Archive (Expired)</span>
          <span className={`px-2 py-0.5 text-xs rounded-full ${
            activeTab === "archived" ? "bg-red-500/20 text-red-400" : "bg-white/5 text-gray-400"
          }`}>
            {archivedTrainings.length}
          </span>
        </button>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {displayedTrainings.map((t) => {
            const hasExpiry = !!t.expiry_date && t.expiry_date !== "N/A";
            const daysLeft = hasExpiry ? differenceInDays(new Date(t.expiry_date), new Date()) : null;
            const isExpiringSoon = hasExpiry && daysLeft <= 30 && daysLeft > 0;
            const isExpired = hasExpiry && daysLeft <= 0;

            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <GlassCard className={`group border-white/10 hover:border-cyan-500/30 transition-all duration-300 h-full flex flex-col ${isExpired ? 'border-red-500/30' : isExpiringSoon ? 'border-amber-500/30' : ''}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-xl bg-white/5 border border-white/10 group-hover:bg-cyan-500/10 transition-all ${isExpired ? 'text-red-400' : isExpiringSoon ? 'text-amber-400' : 'text-cyan-400'}`}>
                      <Award className="h-6 w-6" />
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleAction(t, "view")} title={isMobile ? "Open" : "View"} className="text-gray-400 hover:text-cyan-400 rounded-full h-8 w-8">
                        {isMobile ? <ExternalLink className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEditModal(t)} title="Edit" className="text-gray-400 hover:text-white rounded-full h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleAction(t, "download")} title="Download" className="text-gray-400 hover:text-emerald-400 rounded-full h-8 w-8">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)} title="Delete" className="text-gray-400 hover:text-rose-400 rounded-full h-8 w-8">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1 line-clamp-1">{t.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
                      <Calendar className="h-3 w-3" />
                      <span>Expires: {hasExpiry ? format(new Date(t.expiry_date), "dd MMM yyyy") : "N/A"}</span>
                    </div>

                    {!hasExpiry ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold w-fit">
                            <CheckCircle2 className="h-3 w-3" />
                            VALID (Does not expire)
                        </div>
                    ) : isExpired ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold w-fit">
                            <AlertTriangle className="h-3 w-3" />
                            EXPIRED
                        </div>
                    ) : isExpiringSoon ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold w-fit">
                            <AlertTriangle className="h-3 w-3" />
                            EXPIRING IN {daysLeft} DAYS
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold w-fit">
                            <CheckCircle2 className="h-3 w-3" />
                            VALID ({daysLeft} days left)
                        </div>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {displayedTrainings.length === 0 && !loading && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
            <Award className="h-16 w-16 text-white/10 mb-4" />
            <p className="text-gray-400 font-medium">
              {activeTab === "active" 
                ? "No active training certificates found." 
                : "No expired training certificates in the archive."}
            </p>
            {activeTab === "active" && (
              <Button variant="link" onClick={() => setIsUploadModalOpen(true)} className="text-sky-400 mt-2">
                Upload your first certificate
              </Button>
            )}
          </div>
        )}
      </div>

      {/* View Modal */}
      <AnimatePresence>
        {isViewModalOpen && (
          <ModalOverlay onClose={closeViewModal}>
            <ModalContent onClose={closeViewModal} className="max-w-5xl w-full h-[90vh] flex flex-col p-0 overflow-hidden bg-white/10 border-white/10">
              <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">

                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-cyan-400" />
                  <span className="font-bold text-sm md:text-base">{viewFile?.name}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={closeViewModal} className="text-gray-400 hover:text-white rounded-full">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex-1 w-full bg-black flex items-center justify-center overflow-auto p-4">
                {viewFile?.type?.startsWith('image/') ? (
                    <img src={viewFile.url} className="max-w-full max-h-full object-contain shadow-2xl" alt="Certificate" />
                ) : (
                    <iframe src={viewFile?.url} className="w-full h-full border-none bg-white" title="PDF Viewer" />
                )}
              </div>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* Add Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <ModalOverlay onClose={() => setIsUploadModalOpen(false)}>
            <ModalContent onClose={() => setIsUploadModalOpen(false)} className="max-w-md">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                    <Plus className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-bold">Add Training Certificate</h2>
              </div>

              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <Label>Certificate File (PDF or Image)</Label>
                  <Input 
                    type="file" 
                    accept="application/pdf,image/*"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    className="mt-1.5 bg-white/5 border-white/10"
                    required
                  />
                </div>

                <div>
                  <Label>Certificate Name</Label>
                  <Input 
                    placeholder="e.g. Working at Height"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1.5 bg-white/5 border-white/10"
                    required
                  />
                </div>

                <div>
                  <Label className={noExpiry ? "text-gray-500" : ""}>Expiry Date</Label>
                  <Input 
                    type="date" 
                    value={noExpiry ? "" : expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    disabled={noExpiry}
                    className="mt-1.5 bg-white/5 border-white/10 disabled:opacity-50"
                    required={!noExpiry}
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <input 
                      type="checkbox"
                      id="noExpiry"
                      checked={noExpiry}
                      onChange={(e) => setNoExpiry(e.target.checked)}
                      className="rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500 h-4 w-4"
                    />
                    <label htmlFor="noExpiry" className="text-xs text-gray-300 cursor-pointer select-none">No Expiry Date (N/A)</label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="ghost" onClick={() => setIsUploadModalOpen(false)} className="text-gray-400 hover:text-white">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isUploading} className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold px-6 rounded-xl">
                    {isUploading ? "Uploading..." : "Save Certificate"}
                  </Button>
                </div>
              </form>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <ModalOverlay onClose={() => setIsEditModalOpen(false)}>
            <ModalContent onClose={() => setIsEditModalOpen(false)} className="max-w-md">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                    <Edit className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-bold">Edit Certificate</h2>
              </div>

              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <Label>Certificate Name</Label>
                  <Input 
                    placeholder="e.g. Working at Height"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-1.5 bg-white/5 border-white/10"
                    required
                  />
                </div>

                <div>
                  <Label className={editNoExpiry ? "text-gray-500" : ""}>Expiry Date</Label>
                  <Input 
                    type="date" 
                    value={editNoExpiry ? "" : editExpiryDate}
                    onChange={(e) => setEditExpiryDate(e.target.value)}
                    disabled={editNoExpiry}
                    className="mt-1.5 bg-white/5 border-white/10 disabled:opacity-50"
                    required={!editNoExpiry}
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <input 
                      type="checkbox"
                      id="editNoExpiry"
                      checked={editNoExpiry}
                      onChange={(e) => setEditNoExpiry(e.target.checked)}
                      className="rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500 h-4 w-4"
                    />
                    <label htmlFor="editNoExpiry" className="text-xs text-gray-300 cursor-pointer select-none">No Expiry Date (N/A)</label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-white">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isUploading} className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold px-6 rounded-xl">
                    {isUploading ? "Saving..." : "Update Details"}
                  </Button>
                </div>
              </form>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </div>
  );
}
