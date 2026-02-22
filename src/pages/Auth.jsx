import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Loader2, ArrowRight } from 'lucide-react';
import { gsap } from 'gsap';

const Auth = () => {
    const { signIn, signUp } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Default to where they were trying to go, or home
    const from = location.state?.from?.pathname || "/workspace";

    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        try {
            if (isSignUp) {
                const { error } = await signUp(email, password);
                if (error) throw error;
                // Auto login or redirect to magic link message depending on Supabase settings.
                // Assuming auto-login for now:
                navigate(from, { replace: true });
            } else {
                const { error } = await signIn(email, password);
                if (error) throw error;
                navigate(from, { replace: true });
            }
        } catch (error) {
            setErrorMsg(error.message);
            // Shake animation on error
            gsap.fromTo(".auth-card",
                { x: -10 },
                { x: 10, duration: 0.1, yoyo: true, repeat: 3, onComplete: () => gsap.set(".auth-card", { x: 0 }) }
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden bg-obsidian">

            {/* Background elements to match Midnight Luxe */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-champagne/5 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-slate/50 rounded-full blur-[150px] pointer-events-none mix-blend-screen" />

            <div className="auth-card w-full max-w-md bg-slate/20 border border-ivory/10 rounded-2xl p-8 backdrop-blur-xl relative z-10 shadow-2xl">

                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-champagne/10 text-champagne mb-4 border border-champagne/20">
                        <ShieldAlert size={20} />
                    </div>
                    <h2 className="text-2xl font-bold text-ivory tracking-tight mb-2">
                        {isSignUp ? "Create Account" : "Welcome Back"}
                    </h2>
                    <p className="text-sm text-ivory/50 font-mono tracking-widest uppercase">
                        {isSignUp ? "Set Up Your Profile" : "Sign In to Workspace"}
                    </p>
                </div>

                {errorMsg && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm font-mono text-center">
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-ivory/60 uppercase tracking-wider mb-2">Email Address</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-[#1A1A24] border border-ivory/10 focus:border-champagne/50 rounded-lg px-4 py-3 text-sm text-ivory outline-none transition-colors"
                            placeholder="consultant@organization.com"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-ivory/60 uppercase tracking-wider mb-2">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[#1A1A24] border border-ivory/10 focus:border-champagne/50 rounded-lg px-4 py-3 text-sm text-ivory outline-none transition-colors"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full relative group overflow-hidden rounded-lg bg-champagne py-3 px-4 font-bold text-obsidian transition-all hover:bg-[#B39B54] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                            <>
                                <span>{isSignUp ? "Sign Up" : "Sign In"}</span>
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <button
                        onClick={() => {
                            setIsSignUp(!isSignUp);
                            setErrorMsg('');
                        }}
                        className="text-xs font-mono text-ivory/40 hover:text-champagne transition-colors tracking-widest uppercase"
                    >
                        {isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up"}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default Auth;
