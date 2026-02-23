import React, { useRef, useLayoutEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const Navbar = () => {
    const navRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    const isWorkspace = location.pathname === '/workspace';

    useLayoutEffect(() => {
        let ctx = gsap.context(() => {
            ScrollTrigger.create({
                start: 'top -50',
                end: 99999,
                toggleClass: {
                    className: 'scrolled-nav',
                    targets: navRef.current,
                },
            });
        }, navRef);

        return () => ctx.revert();
    }, []);

    return (
        <div className="fixed top-0 left-0 w-full z-40 flex justify-center pt-6 px-4 pointer-events-none">
            <nav
                ref={navRef}
                className="nav-container pointer-events-auto flex items-center justify-between w-full max-w-4xl px-6 py-3 rounded-full transition-all duration-500 bg-transparent border border-transparent text-ivory/90 hover:text-ivory"
            >
                <button
                    onClick={() => navigate('/')}
                    className="text-xl font-bold tracking-tight hover:text-champagne transition-colors"
                >
                    Audit
                </button>

                <div className="hidden md:flex items-center space-x-8 text-sm font-medium">
                    <a href="/#research" onClick={(e) => { if (isWorkspace) { e.preventDefault(); navigate('/#research'); } }} className="relative group hover:-translate-y-[1px] transition-transform duration-300">
                        <span className="relative z-10 group-hover:text-champagne transition-colors duration-300">Research</span>
                        <div className="absolute inset-x-0 -bottom-1 h-px bg-gradient-to-r from-transparent via-champagne to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </a>
                    <a href="/#simulate" onClick={(e) => { if (isWorkspace) { e.preventDefault(); navigate('/#simulate'); } }} className="relative group hover:-translate-y-[1px] transition-transform duration-300">
                        <span className="relative z-10 group-hover:text-champagne transition-colors duration-300">Simulate</span>
                        <div className="absolute inset-x-0 -bottom-1 h-px bg-gradient-to-r from-transparent via-champagne to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </a>
                    <a href="/#collaborate" onClick={(e) => { if (isWorkspace) { e.preventDefault(); navigate('/#collaborate'); } }} className="relative group hover:-translate-y-[1px] transition-transform duration-300">
                        <span className="relative z-10 group-hover:text-champagne transition-colors duration-300">Collaborate</span>
                        <div className="absolute inset-x-0 -bottom-1 h-px bg-gradient-to-r from-transparent via-champagne to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </a>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/history')}
                        className="text-sm font-medium text-ivory/50 hover:text-champagne transition-colors duration-300"
                    >
                        My Audits
                    </button>
                    <button
                        onClick={() => navigate('/hub')}
                        className="group relative overflow-hidden bg-ivory/10 hover:bg-champagne text-ivory/90 hover:text-obsidian text-sm font-semibold px-6 py-2 rounded-full transition-all duration-300 hover:scale-[1.03] active:scale-100 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] shadow-[0_0_0_1px_rgba(250,248,245,0.1)] hover:shadow-[0_0_20px_rgba(201,168,76,0.4)]"
                    >
                        <span className="relative z-10">{isWorkspace ? 'Active' : 'Initiate Workspace'}</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
                    </button>
                </div>
            </nav>
            {/* Scope styles specifically for the scrolled state */}
            <style>{`
        .scrolled-nav {
          background-color: rgba(13, 13, 18, 0.6) !important;
          backdrop-filter: blur(24px) !important;
          border-color: rgba(201, 168, 76, 0.3) !important;
        }
      `}</style>
        </div>
    );
};

export default Navbar;
