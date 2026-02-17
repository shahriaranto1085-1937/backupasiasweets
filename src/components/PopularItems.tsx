import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Star } from 'lucide-react';

const popularItems = [
  { id: 1, name: 'Special Yogurt', description: 'Traditional Yogurt of Bogura', price: '৳320', image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80', emoji: '🥛' },
  { id: 2, name: 'Rose Barfi', description: 'Delicate milk fudge with rose essence', price: '৳120', image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&q=80', emoji: '🌹' },
  { id: 3, name: 'Besan Ladoo', description: 'Golden gram flour balls with ghee', price: '৳100', image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80', emoji: '✨' },
  { id: 4, name: 'Rasgulla', description: 'Spongy cottage cheese in light syrup', price: '৳90', image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&q=80', emoji: '🍡' },
];

const PopularItems = () => {
  return (
    <section className="py-20 lg:py-28 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-48 h-48 bg-accent/20 blob-shape" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 blob-shape" />

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/30 rounded-2xl mb-4">
            <Sparkles className="w-4 h-4 text-accent-foreground" />
            <span className="text-sm font-bold text-accent-foreground">Customer Favorites</span>
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground">
            Most Loved <span className="text-primary">Treats</span> 🎉
          </h2>
          <p className="mt-4 text-muted-foreground text-lg max-w-lg mx-auto">
            Our best sellers that keep people coming back for more!
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {popularItems.map((item, index) => (
            <div key={item.id} className="group bg-card rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bounce-in border border-border/50" style={{ animationDelay: `${index * 100}ms` }}>
              <div className="relative aspect-square overflow-hidden">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute top-3 left-3 w-10 h-10 rounded-2xl bg-card/90 backdrop-blur-sm flex items-center justify-center text-lg shadow-sm">
                  {item.emoji}
                </div>
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-xl bg-card/90 backdrop-blur-sm shadow-sm">
                  <Star className="w-3.5 h-3.5 text-accent fill-accent" />
                  <span className="text-xs font-bold text-foreground">4.9</span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-display text-xl font-bold text-foreground">{item.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-primary font-extrabold text-xl">{item.price}</span>
                  <span className="text-xs text-muted-foreground font-medium px-2 py-1 bg-muted/50 rounded-lg">per kg</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link to="/products" className="group inline-flex items-center gap-3 bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
            Browse All Sweets
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default PopularItems;
