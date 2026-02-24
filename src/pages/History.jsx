import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ArrowLeft, Clock, Briefcase, ChevronRight, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const History = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProjects = async () => {
            const { data, error } = await supabase
                .from('projects')
                .select('id, title, created_at')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching projects:', error);
            } else {
                setProjects(data || []);
            }
            setLoading(false);
        };
        fetchProjects();
    }, []);

    useEffect(() => {
        if (!loading && projects.length > 0) {
            gsap.from('.project-card', {
                y: 20,
                opacity: 0,
                stagger: 0.08,
                duration: 0.5,
                ease: 'power2.out'
            });
        }
    }, [loading, projects]);

    const formatDate = (dateString) => {
        const d = new Date(dateString);
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this audit? This action cannot be undone.")) return;

        const previousProjects = [...projects];
        setProjects(projects.filter(p => p.id !== id));

        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting project:', error);
            alert("Failed to delete audit.");
            setProjects(previousProjects);
        }
    };

    return (
        <div className="min-h-screen bg-obsidian text-ivory px-6 pt-28 pb-16">
            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <div className="flex items-center gap-4 mb-10">
                    <button
                        onClick={() => navigate('/')}
                        className="text-ivory/40 hover:text-champagne transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">My Audits</h1>
                        <p className="text-ivory/40 text-sm mt-1">Your past research and analysis sessions.</p>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-ivory/30 font-mono text-sm uppercase tracking-widest animate-pulse">
                            Loading audit history...
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!loading && projects.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <Briefcase size={48} className="text-ivory/10 mb-6" />
                        <h3 className="text-ivory/40 font-bold text-lg mb-2">No audits yet</h3>
                        <p className="text-ivory/25 text-sm mb-8 max-w-xs">
                            Run your first audit from the Workspace to see your history here.
                        </p>
                        <button
                            onClick={() => navigate('/workspace')}
                            className="px-6 py-2.5 bg-champagne text-obsidian font-bold text-sm rounded-lg hover:bg-[#B39B54] transition-colors"
                        >
                            Go to Workspace
                        </button>
                    </div>
                )}

                {/* Project List */}
                {!loading && projects.length > 0 && (
                    <div className="space-y-3">
                        {projects.map((project) => (
                            <div
                                key={project.id}
                                className="project-card group bg-slate/20 border border-ivory/8 rounded-xl px-4 py-4 hover:border-champagne/30 hover:bg-slate/30 transition-all cursor-pointer flex items-center justify-between"
                                onClick={() => {
                                    // Navigate to workspace with project ID to load historical data
                                    navigate(`/workspace?projectId=${project.id}`);
                                }}
                            >
                                <div className="flex items-start gap-4 flex-1 min-w-0 pl-2">
                                    <div className="w-10 h-10 rounded-lg bg-champagne/10 flex items-center justify-center shrink-0 mt-0.5">
                                        <Briefcase size={16} className="text-champagne" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-ivory font-medium text-sm truncate group-hover:text-champagne transition-colors">
                                            {project.title}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <Clock size={11} className="text-ivory/25" />
                                            <span className="text-ivory/30 text-xs">
                                                {formatDate(project.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => handleDelete(e, project.id)}
                                        className="p-2 text-ivory/20 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        title="Delete Audit"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    <div className="p-2">
                                        <ChevronRight size={16} className="text-ivory/15 group-hover:text-champagne/50 transition-colors shrink-0" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
};

export default History;
