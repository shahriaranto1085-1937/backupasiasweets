import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

const slides = [
  { image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=1200&q=80', alt: 'Traditional Asian sweets collection' },
  { image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=1200&q=80', alt: 'Delicious gulab jamun' },
  { image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=1200&q=80', alt: 'Bengali sweets assortment' },
  { image: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=1200&q=80', alt: 'Sweet platter' },
];

const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrentSlide(prev => (prev + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide(prev => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);

  return (
    <section id="home" className="relative min-h-screen bg-gradient-hero pt-20 overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-32 left-10 w-72 h-72 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />

      <div className="container mx-auto px-4 lg:px-8 relative">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20 py-16 lg:py-24">
          {/* Left content */}
          <div className="flex-1 text-center lg:text-left space-y-8 animate-slide-in">
            <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary/10 text-primary rounded-full text-sm font-semibold tracking-wide border border-primary/20">
              <span className="w-2 h-2 rounded-full bg-primary animate-shimmer" />
              Traditional Flavors, Modern Delight
            </span>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-[1.1] tracking-tight">
              Savor the{' '}
              <span className="text-gradient-golden italic">Sweetness</span>
              <br />
              of Tradition
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Experience the authentic taste of handcrafted Asian sweets, made with love and the finest ingredients from century-old recipes.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
              <Link to="/products" className="btn-primary inline-flex items-center justify-center gap-2 group">
                Explore Our Sweets
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href="#about" className="btn-outline inline-flex items-center justify-center gap-2">
                Our Story
              </a>
            </div>

            {/* Trust badges */}
            <div className="flex items-center gap-8 justify-center lg:justify-start pt-4 text-muted-foreground">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground font-serif">20+</p>
                <p className="text-xs uppercase tracking-wider">Years Legacy</p>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground font-serif">50+</p>
                <p className="text-xs uppercase tracking-wider">Varieties</p>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground font-serif">100%</p>
                <p className="text-xs uppercase tracking-wider">Handcrafted</p>
              </div>
            </div>
          </div>

          {/* Right carousel */}
          <div className="flex-1 w-full max-w-2xl lg:max-w-none animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <div className="relative rounded-[2rem] overflow-hidden shadow-xl border border-border/30">
              <div className="relative aspect-[4/3] lg:aspect-[16/10]">
                {slides.map((slide, index) => (
                  <div key={index} className={`absolute inset-0 transition-all duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}>
                    <img src={slide.image} alt={slide.alt} className="w-full h-full object-cover" loading={index === 0 ? 'eager' : 'lazy'} />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/10 to-transparent" />
                  </div>
                ))}
              </div>

              <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full glass flex items-center justify-center hover:bg-card transition-all duration-300 hover:scale-110" aria-label="Previous slide">
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
              <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full glass flex items-center justify-center hover:bg-card transition-all duration-300 hover:scale-110" aria-label="Next slide">
                <ChevronRight className="w-5 h-5 text-foreground" />
              </button>

              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2.5">
                {slides.map((_, index) => (
                  <button key={index} onClick={() => setCurrentSlide(index)} className={`h-2 rounded-full transition-all duration-500 ${index === currentSlide ? 'w-8 bg-primary shadow-golden' : 'w-2 bg-card/60 hover:bg-card'}`} aria-label={`Go to slide ${index + 1}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
