import React from 'react';
import Hero from '../components/Hero';
import Features from '../components/Features';
import Philosophy from '../components/Philosophy';
import Protocol from '../components/Protocol';
import GetStarted from '../components/GetStarted';

const LandingPage = () => {
    return (
        <main>
            <Hero />
            <Features />
            <Philosophy />
            <Protocol />
            <GetStarted />
        </main>
    );
};

export default LandingPage;
