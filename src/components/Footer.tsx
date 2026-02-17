import { Phone, MapPin, Mail, ShoppingBag } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-foreground text-card relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blob-shape opacity-30" />

      <div className="container mx-auto px-4 lg:px-8 py-14 lg:py-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-bold text-primary">Asia Sweets</span>
            </div>
            <p className="text-sm text-card/60 leading-relaxed">Traditional sweetmeat shop offering quality sweets made with care and authenticity since 2003. 🍬</p>
          </div>
          <div>
            <h3 className="font-display text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2.5">
              {[{ label: 'Home', href: '/' }, { label: 'About Us', href: '/#about' }, { label: 'Products', href: '/products' }].map(link => (
                <li key={link.label}><a href={link.href} className="text-sm text-card/60 hover:text-primary transition-colors font-medium">{link.label}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-display text-lg font-bold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm text-card/60"><Phone className="w-4 h-4 text-primary flex-shrink-0" /><span>(+880) 1986-999-889</span></li>
              <li className="flex items-center gap-3 text-sm text-card/60"><Mail className="w-4 h-4 text-primary flex-shrink-0" /><span>hello@asiasweets.com</span></li>
              <li className="flex items-start gap-3 text-sm text-card/60"><MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" /><span>123 Sweet Lane, Dhaka, Bangladesh</span></li>
            </ul>
          </div>
          <div>
            <h3 className="font-display text-lg font-bold mb-4">Help Center</h3>
            <ul className="space-y-2.5">
              {['Get in Touch', 'FAQs', 'Store Hours', 'Order Info'].map(item => (
                <li key={item}><a href="#" className="text-sm text-card/60 hover:text-primary transition-colors font-medium">{item}</a></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-card/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-card/40 font-medium">© {new Date().getFullYear()} Asia Sweets. All rights reserved. ✨</p>
            <div className="flex gap-6">
              <a href="#" className="text-sm text-card/40 hover:text-primary transition-colors font-medium">Privacy Policy</a>
              <a href="#" className="text-sm text-card/40 hover:text-primary transition-colors font-medium">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
