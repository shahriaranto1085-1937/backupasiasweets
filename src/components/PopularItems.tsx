import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Flame } from 'lucide-react';
import y1 from '@/assets/y1.jpg';
import y2 from '@/assets/y2.jpg';
import y3 from '@/assets/y3.jpg';
import y4 from '@/assets/y4.jpg';

const popularItems = [
  { id: 1, name: 'Special Yogurt', description: 'Traditional Yogurt of Bogura', price: '৳320', image: y1, tag: 'Best Seller' },
  { id: 2, name: 'Rose Barfi', description: 'Delicate milk fudge with rose essence', price: '৳120', image: y2, tag: 'Popular' },
  { id: 3, name: 'Besan Ladoo', description: 'Golden gram flour balls with ghee', price: '৳100', image: y3, tag: 'Classic' },
  { id: 4, name: 'Rasgulla', description: 'Spongy cottage cheese in light syrup', price: '৳90', image: y4, tag: 'Must Try' },
];

const PopularItems = () => {
  return (
    <section className="py-16 lg:py-24 bg-background relative overflow-hidden">
      {/* Subtle decorative background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/[0.03] rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 lg:px-8 relative">
        {/* Section Header */}
        <div className="text-center mb-12 lg:mb-16">
          <span className="inline-flex items-center gap-1.5 text-primary font-medium text-sm uppercase tracking-wider">
            <Sparkles className="w-4 h-4" /> Customer Favorites
          </span>
          <h2 className="section-title mt-2">Popular Items</h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            Handpicked classics loved by our customers
          </p>
        </div>

        {/* Items Grid — 2-col on mobile, 4-col on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
          {popularItems.map((item, index) => (
            <Link
              to="/products"
              key={item.id}
              className="group rounded-2xl overflow-hidden shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-warm)] transition-shadow duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative">
                <div className="relative aspect-[3/3.5]">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />

                  {/* Tag badge */}
                  <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3">
                    <span className="inline-flex items-center gap-1 bg-primary text-primary-foreground text-[10px] sm:text-xs font-semibold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full shadow-lg">
                      <Flame className="w-3 h-3" />
                      {item.tag}
                    </span>
                  </div>

                  {/* Price badge */}
                  <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3">
                    <span className="bg-background/90 backdrop-blur-sm text-primary font-bold text-xs sm:text-sm px-2 py-0.5 sm:px-3 sm:py-1 rounded-full shadow-lg">
                      {item.price}
                    </span>
                  </div>

                  {/* Text overlay at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                    <h3 className="font-display text-base sm:text-xl font-bold text-white leading-tight drop-shadow-md">
                      {item.name}
                    </h3>
                    <p className="text-white/75 text-xs sm:text-sm mt-0.5 sm:mt-1 line-clamp-2 drop-shadow-sm">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-10 lg:mt-14">
          <Link
            to="/products"
            className="group inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-medium shadow-[var(--shadow-warm)] hover:brightness-110 transition-all duration-300"
          >
            Browse All Sweets
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default PopularItems;
