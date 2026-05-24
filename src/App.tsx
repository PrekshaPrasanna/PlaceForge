import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Lenis from 'lenis';

// Pages (to be implemented)
import Dashboard from './pages/Dashboard';
import Explore from './pages/Explore';
import CompanyDetail from './pages/CompanyDetail';
import Compare from './pages/Compare';
import InnovX from './pages/InnovX';
import Hiring from './pages/Hiring';
import Analytics from './pages/Analytics';
import FutureSimulation from './pages/FutureSimulation';
import SwapSkill from './pages/SwapSkill';
import SkillDetails from './pages/SkillDetails';
import CultureFit from './pages/CultureFit';

function App() {
  const location = useLocation();

  // Initialize smooth scrolling
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <div className="app-container">
      <nav className="navbar">
        <Link to="/" className="navbar-brand">PlaceForge</Link>
        <div className="navbar-nav">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Dashboard</Link>
          <Link to="/explore" className={`nav-link ${location.pathname.startsWith('/explore') ? 'active' : ''}`}>Explore</Link>
          <Link to="/innovx" className={`nav-link ${location.pathname.startsWith('/innovx') ? 'active' : ''}`}>InnovX</Link>
          <Link to="/hiring" className={`nav-link ${location.pathname.startsWith('/hiring') ? 'active' : ''}`}>Hiring</Link>
          <Link to="/compare" className={`nav-link ${location.pathname.startsWith('/compare') ? 'active' : ''}`}>Compare</Link>
          <Link to="/analytics" className={`nav-link ${location.pathname.startsWith('/analytics') ? 'active' : ''}`}>Analytics</Link>
          <Link to="/simulation" className={`nav-link ${location.pathname.startsWith('/simulation') ? 'active' : ''}`}>Simulation</Link>
          <Link to="/swap-skill" className={`nav-link ${location.pathname.startsWith('/swap-skill') ? 'active' : ''}`}>Skill Swap</Link>
          <Link to="/culture-fit" className={`nav-link ${location.pathname.startsWith('/culture-fit') ? 'active' : ''}`}>Cultural Fit</Link>
        </div>
      </nav>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/company/:id" element={<CompanyDetail />} />
          <Route path="/innovx" element={<InnovX />} />
          <Route path="/hiring" element={<Hiring />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/simulation" element={<FutureSimulation />} />
          <Route path="/swap-skill" element={<SwapSkill />} />
          <Route path="/swap-skill/skill/:id" element={<SkillDetails />} />
          <Route path="/culture-fit" element={<CultureFit />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
