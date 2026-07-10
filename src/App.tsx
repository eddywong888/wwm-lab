import './index.css';
import Hero from './components/Hero';
import ProjectGrid from './components/ProjectGrid';
import EduSection from './components/EduSection';
import SocialLinks from './components/SocialLinks';
import VisitorCount from './components/VisitorCount';
import './App.css';

export default function App() {
  return (
    <>
      <Hero />
      <main>
        <EduSection />
        <ProjectGrid />
      </main>
      <footer className="site-footer">
        <div className="container site-footer__inner">
          <div className="site-footer__left">
            <span className="site-footer__name">
              <span className="site-footer__mono">ew</span> Eddy Wong
            </span>
            <VisitorCount />
          </div>
          <div className="site-footer__right">
            <SocialLinks />
            <span className="site-footer__copy">
              © {new Date().getFullYear()} — Built with curiosity
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}
