import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import PopularItems from '@/components/PopularItems';
import AboutSection from '@/components/AboutSection';
import Footer from '@/components/Footer';
import SupportTicketWidget from '@/components/SupportTicketWidget';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <PopularItems />
        <AboutSection />
      </main>
      <Footer />
      <SupportTicketWidget />
    </div>
  );
};

export default Index;
