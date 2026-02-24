import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ArrowLeft, Clock, Briefcase, ChevronRight, Plus, LogOut, Trash2, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const ProjectHub = () => {
    const navigate = useNavigate();
    const { signOut } = useAuth();
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
        if (!loading) {
            gsap.from('.hub-element', {
                y: 20,
                opacity: 0,
                stagger: 0.08,
                duration: 0.5,
                ease: 'power2.out'
            });
        }
    }, [loading]);

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

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this context? This cannot be undone.")) return;

        // Optimistic UI update
        const previousProjects = [...projects];
        setProjects(projects.filter(p => p.id !== id));

        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting project:', error);
            alert("Failed to delete context.");
            setProjects(previousProjects); // Revert on failure
        }
    };

    return (
        <div className="min-h-screen bg-obsidian text-ivory px-6 pt-28 pb-16">
            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-10 hub-element">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/')}
                            className="text-ivory/40 hover:text-champagne transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Project Hub</h1>
                            <p className="text-ivory/40 text-sm mt-1">Select an active context or initialize a new one.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/profile')}
                            className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-ivory/40 hover:text-champagne transition-colors bg-slate/20 px-4 py-2 rounded-lg border border-ivory/5 hover:border-champagne/30"
                        >
                            <User size={14} />
                            Profile
                        </button>
                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-ivory/40 hover:text-red-400 transition-colors bg-slate/20 px-4 py-2 rounded-lg border border-ivory/5 hover:border-red-400/30"
                        >
                            <LogOut size={14} />
                            Sign Out
                        </button>
                    </div>
                </div>

                {/* Primary Action: New Project */}
                <div
                    onClick={() => navigate('/workspace')}
                    className="hub-element group w-full bg-champagne/5 border border-champagne/30 rounded-2xl p-8 mb-10 hover:bg-champagne/10 hover:border-champagne/50 transition-all cursor-pointer flex flex-col items-center justify-center text-center shadow-[0_0_30px_rgba(201,168,76,0.05)] hover:shadow-[0_0_40px_rgba(201,168,76,0.15)]"
                >
                    <div className="w-16 h-16 rounded-full bg-champagne/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-champagne/20 transition-all">
                        <Plus size={28} className="text-champagne" />
                    </div>
                    <h2 className="text-xl font-bold text-champagne mb-2">Initialize New Audit</h2>
                    <p className="text-ivory/50 text-sm max-w-sm">Create a fresh context matrix, define new targets, and analyze new documentation.</p>
                </div>

                {/* Active Projects List */}
                <div className="hub-element">
                    <h2 className="text-sm font-mono tracking-widest text-ivory/50 uppercase mb-4 flex items-center gap-2">
                        <Briefcase size={14} /> Active Contexts
                    </h2>

                    {loading && (
                        <div className="py-10 text-center">
                            <div className="text-ivory/30 font-mono text-sm uppercase tracking-widest animate-pulse">
                                Loading network contexts...
                            </div>
                        </div>
                    )}

                    {!loading && projects.length === 0 && (
                        <div className="bg-slate/10 border border-ivory/5 rounded-xl py-12 text-center">
                            <p className="text-ivory/30 text-sm">No historical contexts found.</p>
                        </div>
                    )}

                    {!loading && projects.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {projects.map((project) => (
                                <div
                                    key={project.id}
                                    className="hub-element group bg-slate/20 border border-ivory/10 rounded-xl px-4 py-4 hover:border-ivory/30 hover:bg-slate/30 transition-all cursor-pointer flex items-center justify-between"
                                    onClick={() => navigate(`/workspace?projectId=${project.id}`)}
                                >
                                    <div className="flex items-start gap-4 flex-1 min-w-0 pl-2">
                                        <div className="min-w-0">
                                            <h3 className="text-ivory font-medium text-[15px] truncate group-hover:text-champagne transition-colors">
                                                {project.title}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <Clock size={11} className="text-ivory/30" />
                                                <span className="text-ivory/40 text-xs font-mono">
                                                    {formatDate(project.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={(e) => handleDelete(e, project.id)}
                                            className="p-2 text-ivory/20 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                            title="Delete Context"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        <div className="p-2">
                                            <ChevronRight size={18} className="text-ivory/20 group-hover:text-champagne transition-all" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default ProjectHub;
