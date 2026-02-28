const AboutSection = () => {
  return (
    <section id="about" className="py-16 lg:py-24 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-primary font-medium text-sm uppercase tracking-wider">
            Our Heritage
          </span>
          <h2 className="section-title mt-2">About Asia Sweetmeat</h2>
          <div className="mt-8 space-y-6 text-muted-foreground text-lg leading-relaxed">
            <p>
              For over two decades, Asia Sweetmeat has been the heart of traditional sweetmeat
              craftsmanship in our community. What started as a small family kitchen has 
              blossomed into a beloved destination for those who cherish authentic flavors.
            </p>
            <p>
              Every sweet we create is a tribute to time-honored recipes, prepared with 
              the finest ingredients and an unwavering commitment to quality. From the 
              golden spirals of fresh Jalebi to the delicate melt-in-your-mouth Rasmalai, 
              each piece is crafted with love and expertise.
            </p>
            <p className="text-foreground font-display text-2xl italic">
              "Where every bite is a celebration of tradition."
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
