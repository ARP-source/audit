import React, { useState, createContext, useLayoutEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import Workspace from './pages/Workspace';
import Auth from './pages/Auth';
import CitationDrawer from './components/CitationDrawer';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

gsap.registerPlugin(ScrollTrigger);

export const CitationContext = createContext({
  activeCitation: null,
  openCitation: () => { },
  closeCitation: () => { }
});

// Scroll to top on route change Helper
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Hide Navbar on workspace and auth pages
const NavbarWrapper = () => {
  const { pathname } = useLocation();
  if (pathname === '/workspace' || pathname === '/auth') return null;
  return <Navbar />;
}

function App() {
  const [activeCitation, setActiveCitation] = useState(null);

  const openCitation = (citationData) => setActiveCitation(citationData);
  const closeCitation = () => setActiveCitation(null);

  return (
    <AuthProvider>
      <CitationContext.Provider value={{ activeCitation, openCitation, closeCitation }}>
        <Router>
          <ScrollToTop />
          {/* Global Noise Overlay */}
          <svg className="noise-overlay" xmlns="http://www.w3.org/2000/svg">
            <filter id="noiseFilter">
              <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
            </filter>
            <rect width="100%" height="100%" filter="url(#noiseFilter)" opacity="0.05" />
          </svg>

          <div className="relative min-h-screen bg-obsidian text-ivory font-sans overflow-hidden">
            <NavbarWrapper />

            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<Auth />} />
              <Route
                path="/workspace"
                element={
                  <ProtectedRoute>
                    <Workspace />
                  </ProtectedRoute>
                }
              />
            </Routes>

            <CitationDrawer />
          </div>
        </Router>
      </CitationContext.Provider>
    </AuthProvider>
  );
}

export default App;
