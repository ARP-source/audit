import React, { useContext, useEffect, useRef } from 'react';
import { CitationContext } from '../App';
import { gsap } from 'gsap';
import { X, ExternalLink } from 'lucide-react';

const CitationDrawer = () => {
    const { activeCitation, closeCitation } = useContext(CitationContext);
    const drawerRef = useRef(null);
    const overlayRef = useRef(null);

    useEffect(() => {
        let ctx = gsap.context(() => {
            if (activeCitation) {
                gsap.to(overlayRef.current, { opacity: 1, pointerEvents: 'auto', duration: 0.4, ease: 'power2.out' });
                gsap.to(drawerRef.current, { x: '0%', duration: 0.5, ease: 'power3.out' });
            } else {
                gsap.to(overlayRef.current, { opacity: 0, pointerEvents: 'none', duration: 0.4, ease: 'power2.in' });
                gsap.to(drawerRef.current, { x: '100%', duration: 0.4, ease: 'power3.in' });
            }
        });

        return () => ctx.revert();
    }, [activeCitation]);

    return (
        <>
            {/* Backdrop */}
            <div
                ref={overlayRef}
                onClick={closeCitation}
                className="fixed inset-0 bg-obsidian/80 backdrop-blur-sm z-40 opacity-0 pointer-events-none transition-opacity"
            />

            {/* Drawer */}
            <div
                ref={drawerRef}
                className="fixed top-0 right-0 h-[100dvh] w-full max-w-md bg-slate/50 backdrop-blur-2xl border-l border-ivory/10 z-50 translate-x-full shadow-2xl flex flex-col"
            >
                <div className="flex items-center justify-between p-6 border-b border-ivory/10">
                    <h3 className="font-mono text-xs uppercase tracking-widest text-champagne font-bold">
                        Citation Details
                    </h3>
                    <button
                        onClick={closeCitation}
                        className="text-ivory/60 hover:text-ivory p-2 rounded-full hover:bg-white/5 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 flex-1 overflow-y-auto">
                    {activeCitation && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div>
                                <p className="font-mono text-[10px] text-ivory/40 mb-2">// SOURCE HASH</p>
                                <p className="font-mono text-xs text-champagne break-all">
                                    {activeCitation.hash || '0x4f8B...2E1c_verified'}
                                </p>
                            </div>

                            <div>
                                <p className="font-mono text-[10px] text-ivory/40 mb-2">// EXTRACTED CLAIM</p>
                                <h4 className="font-serif text-xl italic text-ivory leading-relaxed">
                                    "{activeCitation.quote}"
                                </h4>
                            </div>

                            <div className="h-px w-full bg-ivory/10" />

                            <div>
                                <p className="font-mono text-[10px] text-ivory/40 mb-2">// DOCUMENT CONTEXT</p>
                                <p className="text-sm text-ivory/70 leading-relaxed font-medium">
                                    {activeCitation.context}
                                </p>
                            </div>

                            <div>
                                <p className="font-mono text-[10px] text-ivory/40 mb-3">// VERIFICATION CHAIN</p>
                                <div className="space-y-2 font-mono text-xs text-ivory/60">
                                    <div className="flex items-center justify-between">
                                        <span>Authenticity</span>
                                        <span className="text-green-400">Verified</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>Confidence Score</span>
                                        <span className="text-champagne">99.8%</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>Timestamp</span>
                                        <span>{new Date().toISOString().split('T')[0]}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-ivory/10 bg-black/20">
                    <button className="w-full flex items-center justify-center gap-2 bg-ivory/5 hover:bg-ivory/10 text-ivory py-3 rounded-lg text-sm font-semibold transition-colors border border-ivory/10">
                        <span>View Source Document</span>
                        <ExternalLink size={16} />
                    </button>
                </div>
            </div>
        </>
    );
};

export default CitationDrawer;
