import React, { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const Philosophy = () => {
    const containerRef = useRef(null);

    useLayoutEffect(() => {
        let ctx = gsap.context(() => {
            // Parallax effect on the text container
            gsap.to('.parallax-text', {
                y: -100,
                ease: 'none',
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: true
                }
            });

            // Shadow texture move
            gsap.to('.shadow-texture', {
                y: 150,
                ease: 'none',
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: true
                }
            });
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={containerRef} className="relative py-48 w-full bg-obsidian overflow-hidden border-y border-ivory/5">
            {/* Architectural Shadow Texture */}
            <div className="absolute inset-0 opacity-10 pointer-events-none shadow-texture mix-blend-overlay">
                <div className="w-full h-[200%] bg-[repeating-linear-gradient(45deg,transparent,transparent_40px,#FAF8F5_40px,#FAF8F5_42px)]"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-obsidian via-transparent to-obsidian scale-110"></div>
            </div>

            <div className="relative z-10 w-full max-w-7xl mx-auto px-6 flex flex-col items-center text-center parallax-text">
                <div className="mb-8">
                    <p className="text-xl md:text-3xl font-medium text-ivory/50 mb-2 font-sans tracking-tight">
                        Most consulting relies on: <br className="md:hidden" />
                        <span className="text-ivory line-through decoration-champagne/40 decoration-2">static assumptions.</span>
                    </p>
                </div>

                <div>
                    <h2 className="text-5xl md:text-7xl lg:text-8xl text-champagne text-drama leading-tight">
                        We focus on: <br />
                        dynamic simulation.
                    </h2>
                </div>
            </div>
        </section>
    );
};

export default Philosophy;
