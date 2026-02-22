import React, { useRef, useLayoutEffect, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const Protocol = () => {
    const containerRef = useRef(null);

    // Scoped variables for typewriter
    const typeTargetRef = useRef(null);

    useLayoutEffect(() => {
        let ctx = gsap.context(() => {
            // Card 1: Scanning Laser Line
            gsap.to('.laser-line', {
                y: '100%',
                ease: 'linear',
                duration: 3,
                repeat: -1,
                yoyo: true
            });

            // Card 2: Rotating Geometry
            gsap.to('.geometry-outer', { rotate: 360, duration: 20, ease: 'linear', repeat: -1 });
            gsap.to('.geometry-inner', { rotate: -360, duration: 15, ease: 'linear', repeat: -1 });

            // Card 3: Typewriter
            ScrollTrigger.create({
                trigger: '.card-3',
                start: 'top 50%',
                onEnter: () => {
                    if (typeTargetRef.current) {
                        typeTargetRef.current.innerHTML = "";
                        let text = "MTRX_VERIFIED: 100% CONFIDENCE. SOURCES ALIGNED.";
                        let i = 0;
                        const typeWriter = setInterval(() => {
                            if (i < text.length) {
                                typeTargetRef.current.innerHTML += text.charAt(i);
                                i++;
                            } else {
                                clearInterval(typeWriter);
                            }
                        }, 50);
                    }
                }
            });

            // Background Particles
            gsap.to('.protocol-particle', {
                y: '-100vh',
                x: 'random(-50, 50)',
                opacity: 0,
                duration: 'random(10, 20)',
                repeat: -1,
                ease: 'none',
                stagger: {
                    each: 0.5,
                    from: "random"
                }
            });

        }, containerRef);

        return () => ctx.revert();
    }, []);

    // Generate random particles
    const particles = Array.from({ length: 30 }).map((_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        bottom: `-${Math.random() * 20}%`,
        scale: Math.random() * 0.5 + 0.5,
        opacity: Math.random() * 0.3 + 0.1
    }));

    return (
        <section ref={containerRef} id="simulate" className="relative w-full bg-obsidian">
            {/* Global Background Particles for Protocol Section */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                {particles.map((p) => (
                    <div
                        key={p.id}
                        className="protocol-particle absolute rounded-full bg-champagne"
                        style={{
                            left: p.left,
                            bottom: p.bottom,
                            width: `${p.scale * 4}px`,
                            height: `${p.scale * 4}px`,
                            opacity: p.opacity
                        }}
                    />
                ))}
            </div>

            {/* Sticky Container 1 */}
            <div className="sticky top-0 h-[100dvh] w-full flex items-center justify-center bg-obsidian/90 backdrop-blur-md border-b border-ivory/5 shadow-2xl z-10">
                <div className="max-w-4xl w-full px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="text-sm font-mono tracking-widest text-champagne uppercase mb-4">Phase 01</h2>
                        <h3 className="text-4xl md:text-5xl font-bold tracking-tight text-ivory mb-6">Research & Ingestion.</h3>
                        <p className="text-ivory/60 text-lg leading-relaxed">
                            Scan millions of parameters across unstructured documentation. The system parses context natively, mapping entities to semantic structures automatically.
                        </p>
                    </div>
                    <div className="h-64 bg-slate/20 rounded-2xl border border-ivory/10 relative overflow-hidden flex flex-col p-6 text-ivory/40 font-mono text-xs">
                        <div className="laser-line absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-transparent to-champagne/30 border-b border-champagne/80 z-10" />
                        <p className="mb-2 line-through opacity-50">Parameter: Q3_Projections (Null)</p>
                        <p className="mb-2 text-champagne">Parameter: Market_Friction (Found)</p>
                        <p className="mb-2">Scanning index sequences...</p>
                        <p className="mb-2 text-champagne">Entity mapping: Enterprise {'>'} Value_Chain</p>
                        <p className="mb-2 opacity-50">Parsing context topology...</p>
                    </div>
                </div>
            </div>

            {/* Sticky Container 2 */}
            <div className="sticky top-0 h-[100dvh] w-full flex items-center justify-center bg-[#111116]/90 backdrop-blur-md border-b border-ivory/5 shadow-2xl z-20">
                <div className="max-w-4xl w-full px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="order-2 md:order-1 h-64 flex items-center justify-center relative">
                        <div className="geometry-outer absolute w-48 h-48 border border-champagne/30 rounded-full border-dashed" />
                        <div className="geometry-inner absolute w-32 h-32 border-2 border-ivory/20 rounded-lg rotate-45" />
                        <div className="absolute w-16 h-16 bg-champagne/10 border border-champagne/50 rounded-full blur-xl animate-pulse" />
                    </div>
                    <div className="order-1 md:order-2">
                        <h2 className="text-sm font-mono tracking-widest text-champagne uppercase mb-4">Phase 02</h2>
                        <h3 className="text-4xl md:text-5xl font-bold tracking-tight text-ivory mb-6">Logical Simulation.</h3>
                        <p className="text-ivory/60 text-lg leading-relaxed">
                            Subject claims to multi-variable stress-testing. Watch strategies morph in real-time as constraints adapt, exposing logical fallacies before execution.
                        </p>
                    </div>
                </div>
            </div>

            {/* Sticky Container 3 */}
            <div className="card-3 sticky top-0 h-[100dvh] w-full flex items-center justify-center bg-[#15151A]/90 backdrop-blur-md shadow-2xl z-30">
                <div className="max-w-4xl w-full px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="text-sm font-mono tracking-widest text-champagne uppercase mb-4">Phase 03</h2>
                        <h3 className="text-4xl md:text-5xl font-bold tracking-tight text-ivory mb-6">Verification.</h3>
                        <p className="text-ivory/60 text-lg leading-relaxed">
                            Every simulated outcome is anchored. Generates an immutable citation matrix, ensuring absolute traceback capability for every data point.
                        </p>
                    </div>
                    <div className="h-64 bg-black/40 rounded-2xl border border-ivory/10 flex items-center justify-center p-8">
                        <p ref={typeTargetRef} className="font-mono text-lg text-champagne text-center tracking-widest">
                            [SYSTEM STANDBY]
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Protocol;
