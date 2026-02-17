import { Heart, Award, Leaf } from 'lucide-react';

const features = [
  { icon: Heart, title: 'Made with Love', description: 'Every sweet is handcrafted with passion and care by our expert artisans.', emoji: '❤️' },
  { icon: Award, title: '20+ Years', description: 'Over two decades of sweetmeat craftsmanship and family tradition.', emoji: '🏆' },
  { icon: Leaf, title: 'Pure Ingredients', description: 'Only the finest, freshest ingredients — no shortcuts, no compromises.', emoji: '🌿' },
];

const AboutSection = () => {
  return (
    <section id="about" className="py-20 lg:py-28 relative overflow-hidden">
      <div className="absolute top-10 left-10 w-40 h-40 bg-secondary/10 blob-shape float-animation" />
      <div className="absolute bottom-10 right-10 w-56 h-56 bg-primary/5 blob-shape float-animation" style={{ animationDelay: '1.5s' }} />

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 rounded-2xl mb-4">
            <span className="text-sm font-bold text-secondary">Our Heritage 🏛️</span>
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground">
            About <span className="text-secondary">Asia Sweets</span>
          </h2>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            For over two decades, Asia Sweets has been the heart of traditional sweetmeat craftsmanship. What started as a small family kitchen has blossomed into a beloved destination for authentic flavors.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {features.map((feature, index) => (
            <div key={feature.title} className="group bg-card rounded-3xl p-8 text-center border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bounce-in" style={{ animationDelay: `${index * 150}ms` }}>
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5 text-3xl group-hover:scale-110 transition-transform">
                {feature.emoji}
              </div>
              <h3 className="font-display text-xl font-bold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 max-w-2xl mx-auto text-center">
          <blockquote className="text-2xl md:text-3xl font-display font-bold text-foreground italic">
            "Where every bite is a <span className="text-primary">celebration</span> of tradition." 🎊
          </blockquote>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
