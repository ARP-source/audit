import React, { useRef, useContext } from 'react';
import { gsap } from 'gsap';
import { CitationContext } from '../App';
import { Database, Activity, FileCheck2 } from 'lucide-react';

const Features = () => {
    const { openCitation } = useContext(CitationContext);

    const sortContainerRef = useRef(null);
    const gridContainerRef = useRef(null);

    // Card 1: Data Sorting Animation
    const handleSortHover = () => {
        gsap.to('.data-node', {
            y: (i) => -20 - (i * 5),
            x: (i) => (i % 2 === 0 ? -10 : 10),
            opacity: 0.8,
            duration: 0.6,
            stagger: 0.05,
            ease: 'power2.out',
            yoyo: true,
            repeat: 1
        });
    };

    // Card 2: Physics Grid Distortion (Simplified via Rotate/Scale)
    const handleGridMove = (e) => {
        if (!gridContainerRef.current) return;
        const rect = gridContainerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        gsap.to('.grid-node', {
            x: (i) => x * 0.05 * (i % 3 === 0 ? 1 : -1),
            y: (i) => y * 0.05 * (i % 2 === 0 ? 1 : -1),
            scale: 1.05,
            duration: 0.5,
            ease: 'power2.out'
        });
    };

    const handleGridLeave = () => {
        gsap.to('.grid-node', { x: 0, y: 0, scale: 1, duration: 0.8, ease: 'elastic.out(1, 0.3)' });
    };

    // Card 3: Trigger Citation
    const triggerCitation = () => {
        openCitation({
            hash: '0x9A4f...72C1_verified',
            quote: "The implementation of real-time simulation engines reduces strategic planning overhead by 40% while doubling outcome predictability.",
            context: "Extracted from Section 3.2: Algorithmic Efficiency in Predictive Models, verified against 14 enterprise case studies."
        });
    };

    return (
        <section id="research" className="py-32 px-6 w-full max-w-7xl mx-auto relative z-10">
            <div className="mb-16">
                <h2 className="text-sm font-mono tracking-widest text-champagne uppercase mb-4 block">Core Infrastructure</h2>
                <h3 className="text-4xl md:text-5xl font-bold tracking-tight text-ivory">The Vanguard Protocol</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Card 1: Due Diligence Engine */}
                <div
                    className="group relative bg-slate/20 border border-ivory/5 rounded-2xl p-8 overflow-hidden hover:bg-slate/30 transition-colors duration-500 cursor-default"
                    onMouseEnter={handleSortHover}
                >
                    <h4 className="text-xl font-bold mb-3 flex items-center gap-3">
                        <Database size={20} className="text-champagne" />
                        Due Diligence Engine
                    </h4>
                    <p className="text-ivory/60 text-sm mb-12 relative z-10">
                        Automated ingestion and structuring of unstructured data lakes. Translates raw input into synthesized, chronological intelligence.
                    </p>

                    <div ref={sortContainerRef} className="h-32 flex items-end justify-center gap-2 relative z-10">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="data-node w-8 bg-ivory/10 rounded-t-sm" style={{ height: `${20 + (i * 15)}%` }}></div>
                        ))}
                    </div>
                </div>

                {/* Card 2: Simulation Predictor */}
                <div
                    className="group relative bg-slate/20 border border-ivory/5 rounded-2xl p-8 overflow-hidden hover:bg-slate/30 transition-colors duration-500 cursor-crosshair"
                    ref={gridContainerRef}
                    onMouseMove={handleGridMove}
                    onMouseLeave={handleGridLeave}
                >
                    <h4 className="text-xl font-bold mb-3 flex items-center gap-3">
                        <Activity size={20} className="text-champagne" />
                        Simulation Predictor
                    </h4>
                    <p className="text-ivory/60 text-sm mb-12 relative z-10">
                        A physics-based stress-testing environment. Map decision trees and observe real-time ripple effects across interconnected variables.
                    </p>

                    <div className="h-32 grid grid-cols-5 grid-rows-3 gap-2 relative z-10">
                        {[...Array(15)].map((_, i) => (
                            <div key={i} className="grid-node w-full h-full bg-champagne/10 rounded-sm border border-champagne/20"></div>
                        ))}
                    </div>
                </div>

                {/* Card 3: Citation Isolation */}
                <div
                    className="group flex flex-col justify-between bg-slate/20 border border-ivory/5 rounded-2xl p-8 overflow-hidden hover:bg-slate/30 transition-colors duration-500"
                >
                    <div className="relative z-10">
                        <h4 className="text-xl font-bold mb-3 flex items-center gap-3">
                            <FileCheck2 size={20} className="text-champagne" />
                            Citation Isolation
                        </h4>
                        <p className="text-ivory/60 text-sm mb-8">
                            Micro-interactions that separate claims from their source, enforcing rigorous, verifiable documentation within a split-pane architecture.
                        </p>
                    </div>

                    {/* Interactive Split Pane Mock UI */}
                    <div className="h-32 bg-obsidian rounded-xl border border-ivory/10 flex flex-col overflow-hidden relative z-10">
                        <div className="h-8 bg-white/5 border-b border-white/5 flex items-center px-4">
                            <span className="text-[10px] font-mono text-ivory/40">Report_v0.9.md</span>
                        </div>
                        <div className="flex-1 p-4 flex flex-col justify-center">
                            <p className="text-xs text-ivory/80 leading-relaxed">
                                Strategic alignment improves output by 40%.{' '}
                                <button
                                    onClick={triggerCitation}
                                    className="inline-flex items-center text-[10px] font-mono text-obsidian bg-champagne px-1.5 py-0.5 rounded cursor-pointer hover:bg-white transition-colors ml-1"
                                >
                                    [Cit. 14]
                                </button>
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
};

export default Features;
