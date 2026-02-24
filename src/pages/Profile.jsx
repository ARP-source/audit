import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, User, Mail, Shield, LogOut, Key, Diamond } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { gsap } from 'gsap';

const Profile = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handlePasswordReset = async () => {
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
                redirectTo: window.location.origin + '/auth',
            });
            if (error) throw error;
            setMessage({ type: 'success', text: 'Password reset email sent. Check your inbox.' });
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Failed to send reset email.' });
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-obsidian text-ivory px-6 pt-28 pb-16">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-champagne/5 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-slate/50 rounded-full blur-[150px] pointer-events-none mix-blend-screen" />

            <div className="max-w-3xl mx-auto relative z-10">
                {/* Header */}
                <div className="flex items-center gap-4 mb-10">
                    <button
                        onClick={() => navigate('/hub')}
                        className="text-ivory/40 hover:text-champagne transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1>
                        <p className="text-ivory/40 text-sm mt-1">Manage your identity and subscription preferences.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Sidebar / User Summary */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="bg-slate/20 border border-ivory/10 rounded-2xl p-6 text-center backdrop-blur-xl">
                            <div className="w-20 h-20 mx-auto bg-champagne/10 rounded-full flex items-center justify-center mb-4 border border-champagne/20">
                                <User size={32} className="text-champagne" />
                            </div>
                            <h2 className="font-bold text-lg text-ivory mb-1">Consultant</h2>
                            <p className="text-xs font-mono text-ivory/40 truncate" title={user?.email}>
                                {user?.email}
                            </p>

                            <div className="mt-6 pt-6 border-t border-ivory/5 flex flex-col gap-3">
                                <span className="inline-flex items-center justify-center gap-2 px-3 py-1 pb-1.5 rounded-full bg-champagne/10 text-champagne text-xs font-bold uppercase tracking-widest border border-champagne/20">
                                    <Diamond size={12} fill="currentColor" /> Pro Tier
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={handleSignOut}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/40 transition-colors text-sm font-semibold"
                        >
                            <LogOut size={16} /> Sign Out
                        </button>
                    </div>

                    {/* Main Settings Area */}
                    <div className="md:col-span-2 space-y-6">

                        {/* Security Section */}
                        <div className="bg-slate/20 border border-ivory/10 rounded-2xl p-6 backdrop-blur-xl">
                            <h3 className="text-lg font-bold text-ivory mb-6 flex items-center gap-2">
                                <Shield size={18} className="text-champagne" /> Security & Access
                            </h3>

                            {message.text && (
                                <div className={`mb-6 p-4 rounded-lg text-sm font-mono text-center border ${message.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'
                                    }`}>
                                    {message.text}
                                </div>
                            )}

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-ivory/60 uppercase tracking-wider mb-2">Registered Email</label>
                                    <div className="flex items-center gap-3 bg-[#1A1A24] border border-ivory/10 rounded-lg px-4 py-3 text-sm text-ivory/80 cursor-not-allowed">
                                        <Mail size={16} className="text-ivory/40" />
                                        {user?.email}
                                    </div>
                                    <p className="text-xs text-ivory/30 mt-2">Email changes must be requested through support.</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-ivory/60 uppercase tracking-wider mb-2">Password</label>
                                    <div className="bg-[#1A1A24] border border-ivory/10 rounded-lg p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-sm text-ivory/80">
                                            <Key size={16} className="text-ivory/40" />
                                            ••••••••••••
                                        </div>
                                        <button
                                            onClick={handlePasswordReset}
                                            disabled={loading}
                                            className="text-xs font-bold text-champagne hover:text-[#B39B54] uppercase tracking-widest disabled:opacity-50 transition-colors"
                                        >
                                            {loading ? 'Sending...' : 'Reset'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Subscription details */}
                        <div className="bg-slate/20 border border-ivory/10 rounded-2xl p-6 backdrop-blur-xl">
                            <h3 className="text-lg font-bold text-ivory mb-6 flex items-center gap-2">
                                <Diamond size={18} className="text-champagne" /> Subscription Plan
                            </h3>

                            <div className="p-5 border border-champagne/30 bg-champagne/5 rounded-xl">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="font-bold text-champagne text-lg">Midnight Luxe Access</h4>
                                        <p className="text-xs text-ivory/50 mt-1">Active untill canceled</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xl font-mono text-ivory">$0</span><span className="text-xs text-ivory/40">/mo</span>
                                    </div>
                                </div>
                                <ul className="space-y-2 mt-4 text-sm text-ivory/70 border-t border-ivory/10 pt-4">
                                    <li className="flex items-center gap-2">• Unlimited Matrix Audits</li>
                                    <li className="flex items-center gap-2">• Citation Stress Testing</li>
                                    <li className="flex items-center gap-2">• History Retention</li>
                                </ul>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
};

export default Profile;
