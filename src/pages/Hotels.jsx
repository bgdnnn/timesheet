import React, { useState, useEffect, useCallback } from "react";
import { Hotel } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import HotelFormModal from "../components/hotels/HotelFormModal";

const GlassCard = ({ children, className = "" }) => (
    <div className={`bg-black/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg ${className}`}>
        {children}
    </div>
);

export default function HotelsPage() {
    const [user, setUser] = useState(null);
    const [hotels, setHotels] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedHotel, setSelectedHotel] = useState(null);

    const fetchHotels = useCallback(async (currentUser) => {
        if (!currentUser) return;
        try {
            const fetchedHotels = await Hotel.filter({ created_by: currentUser.email }, "-created_date");
            setHotels(fetchedHotels);
        } catch (error) {
            console.error("Error fetching hotels:", error);
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            try {
                const currentUser = await User.me();
                setUser(currentUser);
                fetchHotels(currentUser);
            } catch (error) {
                console.error("Could not fetch user", error);
            }
        };
        init();
    }, [fetchHotels]);
    
    const handleOpenModal = (hotel = null) => {
        setSelectedHotel(hotel);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedHotel(null);
    };

    const handleSave = async () => {
        handleCloseModal();
        await fetchHotels(user);
    };

    const handleDelete = async (hotelId) => {
        if (window.confirm("Are you sure you want to delete this hotel? This cannot be undone.")) {
            try {
                await Hotel.remove(hotelId);
                await fetchHotels(user);
            } catch (error) {
                console.error("Error deleting hotel:", error);
            }
        }
    };

    return (
        <div className="text-white">
            <AnimatePresence>
                {isModalOpen && (
                    <HotelFormModal
                        isOpen={isModalOpen}
                        onClose={handleCloseModal}
                        onSave={handleSave}
                        hotel={selectedHotel}
                    />
                )}
            </AnimatePresence>

            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 md:mb-8 space-y-4 md:space-y-0">
                <h1 className="text-2xl md:text-3xl font-bold text-center md:text-left">Hotels</h1>
                <Button
                    onClick={() => handleOpenModal()}
                    className="bg-white/20 hover:bg-white/30 backdrop-blur-lg border border-white/30 text-white rounded-lg px-3 md:px-4 py-2 flex items-center gap-2 transition-all text-sm md:text-base mx-auto md:mx-0"
                >
                    <Plus className="h-4 w-4 md:h-5 md:w-5" /> 
                    <span>Add Hotel</span>
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                {hotels.map(hotel => (
                    <motion.div
                        key={hotel.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                    >
                        <GlassCard className="p-4 md:p-6 h-full flex flex-col justify-between">
                            <div>
                                <h2 className="text-lg md:text-xl font-bold mb-2 line-clamp-2">{hotel.name}</h2>
                                <p className="text-gray-300 text-sm md:text-base truncate">
                                    {hotel.address || 'No address provided'}
                                </p>
                            </div>

                            <div className="flex justify-end gap-2 mt-4 md:mt-6">
                                <Button 
                                    onClick={() => handleOpenModal(hotel)} 
                                    variant="ghost" 
                                    size="icon" 
                                    className="hover:bg-white/20 rounded-full h-8 w-8 md:h-10 md:w-10"
                                >
                                    <Edit className="h-3 w-3 md:h-4 md:w-4"/>
                                </Button>
                                <Button 
                                    onClick={() => handleDelete(hotel.id)} 
                                    variant="ghost" 
                                    size="icon" 
                                    className="hover:bg-white/20 text-red-400 hover:text-red-300 rounded-full h-8 w-8 md:h-10 md:w-10"
                                >
                                    <Trash2 className="h-3 w-3 md:h-4 md:w-4"/>
                                </Button>
                            </div>
                        </GlassCard>
                    </motion.div>
                ))}
            </div>

            {hotels.length === 0 && (
                <div className="text-center py-12 md:py-20">
                    <p className="text-gray-400 text-sm md:text-base">
                        No hotels found. Add your first hotel to get started.
                    </p>
                </div>
            )}
        </div>
    );
}