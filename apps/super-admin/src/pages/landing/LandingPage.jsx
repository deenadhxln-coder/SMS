import React from 'react';
import LandingNavbar from '../../components/landing/LandingNavbar';
import HeroSection from '../../components/landing/HeroSection';
import TrustStrip from '../../components/landing/TrustStrip';
import FeatureGrid from '../../components/landing/FeatureGrid';
import ProductShowcase from '../../components/landing/ProductShowcase';
import PlatformFlow from '../../components/landing/PlatformFlow';
import SecuritySection from '../../components/landing/SecuritySection';
import OperationsQuestions from '../../components/landing/OperationsQuestions';
import CTASection from '../../components/landing/CTASection';
import LandingFooter from '../../components/landing/LandingFooter';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-white">
      {/* Top Fixed Navbar */}
      <LandingNavbar />

      {/* Main Content Sections */}
      <main className="flex-1">
        <HeroSection />
        <TrustStrip />
        <FeatureGrid />
        <ProductShowcase />
        <PlatformFlow />
        <SecuritySection />
        <OperationsQuestions />
        <CTASection />
      </main>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
};

export default LandingPage;
