const AboutSection = () => {
  return (
    <section id="about" className="py-20 lg:py-32 bg-background relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute -left-32 top-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -right-32 top-1/3 w-48 h-48 rounded-full bg-primary/5 blur-3xl" />

      <div className="container mx-auto px-4 lg:px-8 relative">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-[0.15em]">
            ◆ Our Heritage ◆
          </span>
          <h2 className="section-title mt-4">About Asia Sweets</h2>

          <div className="divider-ornament mt-6">
            <span className="text-primary text-2xl">✦</span>
          </div>

          <div className="mt-8 space-y-6 text-muted-foreground text-lg leading-[1.8]">
            <p>
              For over two decades, <span className="text-foreground font-medium">Asia Sweets</span> has been the heart of traditional sweetmeat craftsmanship in our community. What started as a small family kitchen has blossomed into a beloved destination for those who cherish authentic flavors.
            </p>
            <p>
              Every sweet we create is a tribute to time-honored recipes, prepared with the <span className="text-foreground font-medium">finest ingredients</span> and an unwavering commitment to quality. From the golden spirals of fresh Jalebi to the delicate melt-in-your-mouth Rasmalai, each piece is crafted with love and expertise.
            </p>
          </div>

          <blockquote className="mt-12 relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-6xl text-primary/20 font-serif">"</div>
            <p className="text-foreground font-serif text-2xl md:text-3xl italic leading-relaxed pt-6">
              Where every bite is a celebration of tradition.
            </p>
            <div className="mt-6 w-16 h-1 rounded-full bg-gradient-golden mx-auto" />
          </blockquote>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
