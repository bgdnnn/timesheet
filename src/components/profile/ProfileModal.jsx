
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { User } from "@/api/entities";

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

const ModalContent = ({ children, onClose, className }) => ( // Added className prop
    <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`relative bg-gray-800/50 backdrop-blur-2xl border border-white/20 text-white rounded-2xl shadow-2xl p-8 w-full max-w-md ${className || ''}`} // Applied className prop
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
    const [wage, setWage] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setCompany(user.company || "");
            setWage(user.wage || "");
        }
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        
        try {
            await User.updateMyUserData({
                company: company.trim(),
                wage: parseFloat(wage) || 0
            });
            onSave();
        } catch (error) {
            console.error("Failed to update profile:", error);
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
                        <Label className="text-sm md:text-base">Company</Label>
                        <Input 
                            value={company} 
                            onChange={(e) => setCompany(e.target.value)} 
                            placeholder="Your company name"
                            className="mt-2 bg-white/10 border-white/20 text-sm md:text-base h-9 md:h-10" 
                        />
                    </div>
                    <div>
                        <Label className="text-sm md:text-base">Hourly Wage (£)</Label>
                        <Input 
                            type="number" 
                            step="0.01"
                            value={wage} 
                            onChange={(e) => setWage(e.target.value)} 
                            placeholder="25.00"
                            className="mt-2 bg-white/10 border-white/20 text-sm md:text-base h-9 md:h-10" 
                        />
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button 
                            type="submit" 
                            disabled={isSaving} 
                            className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold rounded-lg px-4 md:px-6 py-2 transition-all text-sm md:text-base"
                        >
                            {isSaving ? "Saving..." : "Save Profile"}
                        </Button>
                    </div>
                </form>
            </ModalContent>
        </ModalOverlay>
    );
}
