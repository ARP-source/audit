import React, { useRef, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';

const GetStarted = () => {
    const ctaRef = useRef(null);
    const textRef = useRef(null);
    const navigate = useNavigate();

    const handleMouseMove = (e) => {
        if (!ctaRef.current || !textRef.current) return;
        const rect = ctaRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        // Move button bg slightly
        gsap.to(ctaRef.current, {
            x: x * 0.2,
            y: y * 0.2,
            duration: 0.6,
            ease: 'power3.out'
        });

        // Move text slightly more for parallax effect
        gsap.to(textRef.current, {
            x: x * 0.3,
            y: y * 0.3,
            duration: 0.6,
            ease: 'power3.out'
        });
    };

    const handleMouseLeave = () => {
        gsap.to(ctaRef.current, {
            x: 0,
            y: 0,
            duration: 0.8,
            ease: 'elastic.out(1, 0.3)'
        });

        gsap.to(textRef.current, {
            x: 0,
            y: 0,
            duration: 0.8,
            ease: 'elastic.out(1, 0.3)'
        });
    };

    return (
        <section id="collaborate" className="py-48 bg-obsidian flex flex-col items-center justify-center relative overflow-hidden">
            <div className="text-center mb-16 relative z-10">
                <h2 className="text-sm font-mono tracking-widest text-[#B39B54] uppercase mb-4">Final Stage</h2>
                <h3 className="text-5xl md:text-7xl font-bold text-ivory tracking-tight">Eradicate Uncertainty.</h3>
            </div>

            <div className="relative z-10 w-full max-w-sm mx-auto h-48 flex items-center justify-center">
                <button
                    ref={ctaRef}
                    onClick={() => navigate('/workspace')}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    style={{ background: 'linear-gradient(to bottom, #E7C86A, #B39535)' }}
                    className="group magnetic-btn relative w-full h-full rounded-[3rem] flex items-center justify-center overflow-hidden cursor-pointer shadow-[0_0_40px_rgba(201,168,76,0.15)] hover:shadow-[0_0_60px_rgba(201,168,76,0.3)] transition-shadow duration-500"
                >
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Animated Gold border glow */}
                    <div className="absolute inset-[2px] rounded-[3rem] border border-obsidian/10 mix-blend-overlay"></div>
                    <div className="absolute inset-0 rounded-[3rem] ring-1 ring-inset ring-white/20 group-hover:ring-white/40 transition-all duration-500"></div>

                    <span
                        ref={textRef}
                        className="text-obsidian text-3xl font-bold tracking-tight pointer-events-none"
                    >
                        Initiate Audit
                    </span>
                </button>
            </div>

            {/* Background decorations */}
            <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-champagne/5 to-transparent pointer-events-none" />
        </section>
    );
};

export default GetStarted;
