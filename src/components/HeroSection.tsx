import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import hs1 from '@/assets/hs1.jpg';
import hs2 from '@/assets/hs2.jpg';
import hs3 from '@/assets/hs3.jpg';
import hs4 from '@/assets/hs4.jpg';
import hs5 from '@/assets/hs5.jpg';
import hs6 from '@/assets/hs6.jpg';

const slides = [
{ image: hs1, alt: 'Traditional Asian sweets collection' },
{ image: hs2, alt: 'Delicious gulab jamun' },
{ image: hs3, alt: 'Bengali sweets assortment' },
{ image: hs4, alt: 'Sweet platter' },
{ image: hs5, alt: 'Festive sweets' },
{ image: hs6, alt: 'Premium sweets' }];


const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrentSlide((prev) => (prev + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <section id="home" className="min-h-screen bg-gradient-hero pt-20">
      <div className="container mx-auto px-4 lg:px-8 bg-inherit">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16 py-12 lg:py-20 pt-[10px]">
          {/* Left Side */}
          <div className="flex-1 text-center lg:text-left space-y-6 animate-slide-in">
            <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
              ✨ Traditional Flavors, Modern Delight
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground leading-tight">
              Savor the <span className="text-gradient-golden">Sweetness</span> of Tradition
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0">
              Experience the authentic taste of handcrafted Asian sweets, made with love and the finest ingredients.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/products" className="btn-primary inline-flex items-center justify-center gap-2 group">
                Explore Our Sweets
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href="#about" className="btn-outline inline-flex items-center justify-center gap-2">
                Our Story
              </a>
            </div>
          </div>

          {/* Right Side - Carousel */}
          <div className="flex-1 w-full max-w-2xl lg:max-w-none">
            <div className="relative rounded-3xl overflow-hidden shadow-warm">
              <div className="relative aspect-[4/3] lg:aspect-[16/10]">
                {slides.map((slide, index) =>
                <div key={index} className={`absolute inset-0 transition-opacity duration-700 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}>
                    <img src={slide.image} alt={slide.alt} className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors shadow-soft" aria-label="Previous slide">
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
              <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors shadow-soft" aria-label="Next slide">
                <ChevronRight className="w-5 h-5 text-foreground" />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {slides.map((_, index) =>
                <button key={index} onClick={() => setCurrentSlide(index)} className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentSlide ? 'w-6 bg-primary' : 'bg-background/60 hover:bg-background'}`} aria-label={`Go to slide ${index + 1}`} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>);

};

export default HeroSection;