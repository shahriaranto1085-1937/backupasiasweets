import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';

const popularItems = [
  { id: 1, name: 'Special Yogurt', description: 'Traditional Yogurt of Bogura — creamy, rich, and unforgettable.', price: '৳320', image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80', tag: 'Bestseller' },
  { id: 2, name: 'Rose Barfi', description: 'Delicate milk fudge infused with Damask rose essence.', price: '৳120', image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&q=80', tag: 'Premium' },
  { id: 3, name: 'Besan Ladoo', description: 'Golden gram flour spheres toasted in pure desi ghee.', price: '৳100', image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&q=80', tag: 'Classic' },
  { id: 4, name: 'Rasgulla', description: 'Spongy cottage cheese pearls in delicate cardamom syrup.', price: '৳90', image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&q=80', tag: 'Favourite' },
];

const PopularItems = () => {
  return (
    <section className="py-20 lg:py-32 bg-background relative overflow-hidden">
      {/* Background ornament */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/[0.03] blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 lg:px-8 relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 mb-16">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-[0.15em]">
              <Sparkles className="w-4 h-4" /> Customer Favorites
            </span>
            <h2 className="section-title mt-3">Our Signature Sweets</h2>
            <p className="mt-4 text-muted-foreground text-lg max-w-lg">Handpicked selections loved by our customers for generations.</p>
          </div>
          <Link to="/products" className="group inline-flex items-center gap-2.5 btn-primary">
            Browse All
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {popularItems.map((item, index) => (
            <div
              key={item.id}
              className="card-sweet group animate-fade-up"
              style={{ animationDelay: `${index * 120}ms`, animationFillMode: 'both' }}
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider shadow-golden">
                  {item.tag}
                </span>
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-serif text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">{item.name}</h3>
                  <span className="shrink-0 rounded-full bg-accent text-accent-foreground px-3 py-1 text-sm font-bold">{item.price}</span>
                </div>
                <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PopularItems;
