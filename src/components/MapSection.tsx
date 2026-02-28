const MapSection = () => {
  return (
    <section className="py-16 lg:py-24 bg-card">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-10">
          <span className="text-primary font-medium text-sm uppercase tracking-wider">
            Find Us
          </span>
          <h2 className="section-title mt-2">Visit Our Store</h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            Come experience the taste of tradition at our shop. We'd love to welcome you!
          </p>
        </div>
        <div className="rounded-2xl overflow-hidden shadow-lg border border-border">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d14607.6!2d90.399507!3d23.749!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755b8b087026b81%3A0x9420a25c07b26f06!2sAsia+Sweetmeat!5e0!3m2!1sen!2sbd!4v1700000000000!5m2!1sen!2sbd"
            width="100%"
            height="450"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Asia Sweetmeat Location"
            className="w-full"
          />
        </div>
      </div>
    </section>
  );
};

export default MapSection;
