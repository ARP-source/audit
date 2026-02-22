import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { Activity, ShieldCheck, Cpu, Database } from 'lucide-react';

const Hero = () => {
    const containerRef = useRef(null);
    const navigate = useNavigate();
    const [liveNodes, setLiveNodes] = useState(1402);

    // Simulate active node fluctuating
    useEffect(() => {
        const interval = setInterval(() => {
            setLiveNodes(prev => prev + Math.floor(Math.random() * 5) - 2);
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    useLayoutEffect(() => {
        let ctx = gsap.context(() => {
            gsap.from('.hero-element', {
                y: 40,
                opacity: 0,
                duration: 1.2,
                stagger: 0.15,
                ease: 'power3.out',
                delay: 0.2
            });

            gsap.from('.hero-widget', {
                x: 40,
                opacity: 0,
                duration: 1.2,
                stagger: 0.15,
                ease: 'power3.out',
                delay: 0.8
            });

            gsap.from('.hero-stat', {
                y: 20,
                opacity: 0,
                duration: 1,
                stagger: 0.1,
                ease: 'power2.out',
                delay: 1.2
            });

            // Anti-gravity float for background image
            gsap.to('.hero-bg', {
                y: -30,
                repeat: -1,
                yoyo: true,
                duration: 8,
                ease: 'sine.inOut'
            });

            // subtle pulse for decorative reticles
            gsap.to('.reticle', {
                opacity: 0.2,
                repeat: -1,
                yoyo: true,
                duration: 3,
                ease: 'sine.inOut',
                stagger: 0.5
            });

        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={containerRef} className="relative min-h-[100dvh] w-full flex flex-col justify-end overflow-hidden pb-12 pt-32">
            {/* Background Image with Anti-Gravity float */}
            <div className="absolute inset-0 w-full h-[120%] -top-[10%] z-0 pointer-events-none">
                <img
                    src="https://images.unsplash.com/photo-1614850715649-1d0106293cb1?q=80&w=2670&auto=format&fit=crop"
                    alt="Dark luxurious abstract elements with subtle gold tones"
                    className="hero-bg object-cover w-full h-full opacity-40 mix-blend-screen"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/80 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-obsidian via-obsidian/50 to-transparent"></div>
            </div>

            {/* Decorative Grid & Reticles */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
                <div className="absolute top-[20%] left-[10%] w-4 h-4 border-l border-t border-champagne reticle"></div>
                <div className="absolute top-[20%] right-[10%] w-4 h-4 border-r border-t border-champagne reticle"></div>
                <div className="absolute bottom-[30%] left-[10%] w-4 h-4 border-l border-b border-champagne reticle"></div>
                <div className="absolute bottom-[30%] right-[10%] w-4 h-4 border-r border-b border-champagne reticle"></div>
                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-ivory/5 to-transparent"></div>
                <div className="absolute left-1/2 top-0 w-[1px] h-full bg-gradient-to-b from-transparent via-ivory/5 to-transparent"></div>
            </div>

            <div className="relative z-10 w-full max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-end mb-16">

                {/* Main Copy */}
                <div className="lg:col-span-8">
                    <div className="hero-element flex items-center gap-3 mb-6">
                        <div className="w-2 h-2 rounded-full bg-champagne animate-pulse"></div>
                        <span className="text-xs font-mono uppercase tracking-widest text-champagne border border-champagne/20 px-3 py-1 rounded-full bg-champagne/5">
                            System Active • Consultant Edition 1.0
                        </span>
                    </div>

                    <h1 className="hero-element text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-ivory leading-[1.1] mb-2">
                        Research meets <br className="hidden md:block" /> Synthesis.
                    </h1>
                    <div className="hero-element text-5xl md:text-7xl lg:text-8xl text-champagne text-drama mt-[-10px] md:mt-[-20px] mb-8">
                        Veritas.
                    </div>

                    <p className="hero-element text-lg md:text-xl text-ivory/60 max-w-xl font-medium leading-relaxed mb-10">
                        Automate qualitative due diligence and logical stress-testing with verifiable,
                        isolated citations. Eliminate assumptions across your entire strategic landscape.
                    </p>

                    <div className="hero-element flex flex-wrap items-center gap-4">
                        <button
                            onClick={() => navigate('/workspace')}
                            className="bg-champagne hover:bg-champagne/90 text-obsidian px-8 py-4 rounded-full font-semibold transition-transform duration-300 hover:scale-[1.03] active:scale-100 flex items-center gap-2"
                        >
                            <Cpu size={20} />
                            Initialize Compute
                        </button>
                        <button className="bg-transparent border border-ivory/20 hover:border-ivory text-ivory px-8 py-4 rounded-full font-semibold transition-all duration-300 hover:scale-[1.03] active:scale-100 flex items-center gap-2">
                            <Database size={20} />
                            View Protocol
                        </button>
                    </div>
                </div>

                {/* Floating Metrics Interface */}
                <div className="lg:col-span-4 hidden lg:flex flex-col gap-4">
                    <div className="hero-widget bg-slate/30 border border-ivory/10 rounded-2xl p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-champagne/10 rounded-full blur-3xl"></div>
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-xs font-mono text-ivory/50 uppercase tracking-widest flex items-center gap-2">
                                <Activity size={14} className="text-champagne" />
                                Live Telemetry
                            </h4>
                            <span className="text-[10px] font-mono text-green-400 bg-green-400/10 px-2 py-0.5 rounded">ONLINE</span>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <div className="text-3xl font-mono text-ivory tracking-tight">{liveNodes.toLocaleString()}</div>
                                <div className="text-xs text-ivory/40 uppercase tracking-wider">Active Compute Nodes</div>
                            </div>
                            <div className="h-[1px] w-full bg-ivory/10"></div>
                            <div>
                                <div className="text-xl font-mono text-champagne tracking-tight">14.2ms</div>
                                <div className="text-xs text-ivory/40 uppercase tracking-wider">Avg Query Latency</div>
                            </div>
                        </div>
                    </div>

                    <div className="hero-widget bg-obsidian/80 border border-ivory/5 rounded-2xl p-5 backdrop-blur-md flex items-start gap-4">
                        <ShieldCheck size={24} className="text-champagne shrink-0 mt-1" />
                        <div>
                            <h4 className="text-sm font-bold text-ivory mb-1">Citation Integrity</h4>
                            <p className="text-xs text-ivory/50 leading-relaxed">
                                All synthesized claims are currently being cross-referenced against 2.4M verified source documents.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Stats Bar */}
            <div className="relative z-10 w-full max-w-7xl mx-auto px-6 border-t border-ivory/10 pt-8 mt-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div className="hero-stat flex flex-col gap-1">
                        <span className="text-2xl md:text-3xl font-mono text-ivory">2.4M+</span>
                        <span className="text-xs font-mono text-ivory/40 uppercase tracking-widest">Documents Indexed</span>
                    </div>
                    <div className="hero-stat flex flex-col gap-1">
                        <span className="text-2xl md:text-3xl font-mono text-ivory">99.8%</span>
                        <span className="text-xs font-mono text-ivory/40 uppercase tracking-widest">Verification Accuracy</span>
                    </div>
                    <div className="hero-stat flex flex-col gap-1">
                        <span className="text-2xl md:text-3xl font-mono text-ivory">0.05s</span>
                        <span className="text-xs font-mono text-ivory/40 uppercase tracking-widest">Simulation Render</span>
                    </div>
                    <div className="hero-stat flex flex-col gap-1">
                        <span className="text-2xl md:text-3xl font-mono text-ivory">AES-256</span>
                        <span className="text-xs font-mono text-ivory/40 uppercase tracking-widest">Client Isolation</span>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
