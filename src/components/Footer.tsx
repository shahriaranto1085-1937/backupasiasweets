import { Facebook, Instagram, Phone, MapPin, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-foreground text-background relative overflow-hidden">
      {/* Decorative gold line */}
      <div className="h-1 bg-gradient-golden" />

      <div className="container mx-auto px-4 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-14">
          <div>
            <span className="font-serif text-3xl font-bold text-primary">Asia Sweets</span>
            <p className="text-sm text-background/60 leading-relaxed mt-5">
              Traditional sweetmeat shop offering quality sweets made with care and authenticity since 2003.
            </p>
            <div className="flex gap-3 mt-6">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary hover:text-foreground transition-all duration-300 hover:-translate-y-1" aria-label="Facebook">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary hover:text-foreground transition-all duration-300 hover:-translate-y-1" aria-label="Instagram">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-serif text-lg font-semibold mb-5 text-background">Quick Links</h3>
            <ul className="space-y-3">
              {[{ label: 'Home', href: '/#home' }, { label: 'About Us', href: '/#about' }, { label: 'Products', href: '/products' }].map(link => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-background/50 hover:text-primary transition-colors duration-200 hover:translate-x-1 inline-block">{link.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-serif text-lg font-semibold mb-5 text-background">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-sm text-background/50">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Phone className="w-3.5 h-3.5 text-primary" />
                </div>
                <span>(+880) 1986-999-889</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-background/50">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Mail className="w-3.5 h-3.5 text-primary" />
                </div>
                <span>hello@asiasweets.com</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-background/50">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                </div>
                <span>123 Sweet Lane, Dhaka, Bangladesh</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-serif text-lg font-semibold mb-5 text-background">Help Center</h3>
            <ul className="space-y-3">
              {['Get in Touch', 'FAQs', 'Store Hours', 'Order Information'].map(item => (
                <li key={item}>
                  <a href="#" className="text-sm text-background/50 hover:text-primary transition-colors duration-200 hover:translate-x-1 inline-block">{item}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-background/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-background/40">© {new Date().getFullYear()} Asia Sweets. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="text-sm text-background/40 hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="text-sm text-background/40 hover:text-primary transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
