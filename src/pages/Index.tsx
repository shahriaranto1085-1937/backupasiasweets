import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import PopularItems from '@/components/PopularItems';
import MenuPreview from '@/components/MenuPreview';
import AboutSection from '@/components/AboutSection';
import Footer from '@/components/Footer';
import SupportTicketWidget from '@/components/SupportTicketWidget';

const Index = () => {
  const location = useLocation();

  useEffect(() => {
    const scrollTo = (location.state as any)?.scrollTo;
    if (scrollTo) {
      setTimeout(() => {
        document.getElementById(scrollTo)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <PopularItems />
        <MenuPreview />
        <AboutSection />
      </main>
      <Footer />
      <SupportTicketWidget />
    </div>
  );
};

export default Index;
