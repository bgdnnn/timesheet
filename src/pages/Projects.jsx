
import React, { useState, useEffect, useCallback } from "react";
import { Project } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import ProjectFormModal from "../components/projects/ProjectFormModal";

const GlassCard = ({ children, className = "" }) => (
    <div className={`bg-black/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg ${className}`}>
        {children}
    </div>
);

export default function ProjectsPage() {
    const [user, setUser] = useState(null);
    const [projects, setProjects] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);

    const fetchProjects = useCallback(async (currentUser) => {
        if (!currentUser) return;
        try {
            const fetchedProjects = await Project.filter({ created_by: currentUser.email }, "-created_date");
            setProjects(fetchedProjects);
        } catch (error) {
            console.error("Error fetching projects:", error);
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            try {
                const currentUser = await User.me();
                setUser(currentUser);
                fetchProjects(currentUser);
            } catch (error) {
                console.error("Could not fetch user", error);
            }
        };
        init();
    }, [fetchProjects]);
    
    const handleOpenModal = (project = null) => {
        setSelectedProject(project);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedProject(null);
    };

    const handleSave = async () => {
        handleCloseModal();
        await fetchProjects(user);
    };

    const handleDelete = async (projectId) => {
        if (window.confirm("Are you sure you want to delete this project?")) {
            try {
                await Project.delete(projectId);
                await fetchProjects(user);
            } catch (error) {
                console.error("Error deleting project:", error);
            }
        }
    };

    return (
        <div className="text-white">
            <AnimatePresence>
                {isModalOpen && (
                    <ProjectFormModal
                        isOpen={isModalOpen}
                        onClose={handleCloseModal}
                        onSave={handleSave}
                        project={selectedProject}
                    />
                )}
            </AnimatePresence>

            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 md:mb-8 space-y-4 md:space-y-0">
                <h1 className="text-2xl md:text-3xl font-bold text-center md:text-left">Projects</h1>
                <Button
                    onClick={() => handleOpenModal()}
                    className="bg-white/20 hover:bg-white/30 backdrop-blur-lg border border-white/30 text-white rounded-lg px-3 md:px-4 py-2 flex items-center gap-2 transition-all text-sm md:text-base mx-auto md:mx-0"
                >
                    <Plus className="h-4 w-4 md:h-5 md:w-5" /> 
                    <span>Add Project</span>
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                {projects.map(project => (
                    <motion.div
                        key={project.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                    >
                        <GlassCard className="p-4 md:p-6 h-full flex flex-col justify-between">
                            <div>
                                <h2 className="text-lg md:text-xl font-bold mb-2 line-clamp-2">{project.name}</h2>
                                <p className="text-gray-300 mb-1 text-sm md:text-base truncate">
                                    Client: {project.client}
                                </p>
                                <p className="text-gray-300 text-xs md:text-sm mb-4 truncate">
                                    Contract: {project.contract || 'N/A'}
                                </p>
                                
                                <div className="text-xs md:text-sm space-y-1 text-gray-200">
                                    <p>Default Hours: <span className="font-semibold">{project.default_hours_worked}h</span></p>
                                    <p>Default Travel: <span className="font-semibold">{project.default_travel_time || 0}h</span></p>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-4 md:mt-6">
                                <Button 
                                    onClick={() => handleOpenModal(project)} 
                                    variant="ghost" 
                                    size="icon" 
                                    className="hover:bg-white/20 rounded-full h-8 w-8 md:h-10 md:w-10"
                                >
                                    <Edit className="h-3 w-3 md:h-4 md:w-4"/>
                                </Button>
                                <Button 
                                    onClick={() => handleDelete(project.id)} 
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

            {projects.length === 0 && (
                <div className="text-center py-12 md:py-20">
                    <p className="text-gray-400 text-sm md:text-base">
                        No projects found. Add your first project to get started.
                    </p>
                </div>
            )}
        </div>
    );
}
