import { Facebook, Instagram, Phone, MapPin, Mail } from 'lucide-react';
import logo from '@/assets/logo.png';

const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div>
            <img src={logo} alt="Asia Sweetmeat" className="h-12 w-auto mb-4 drop-shadow-md" style={{ filter: 'drop-shadow(0 0 1px rgba(255,255,255,0.3))' }} />
            <p className="text-sm text-background/70 leading-relaxed">
              Traditional sweetmeat shop offering quality sweets made with care and authenticity since 2003.
            </p>
            <div className="flex gap-3 mt-5">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary transition-colors duration-200" aria-label="Facebook"><Facebook className="w-5 h-5" /></a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary transition-colors duration-200" aria-label="Instagram"><Instagram className="w-5 h-5" /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-display text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2.5">
              {[{ label: 'Home', href: '/#home' }, { label: 'About Us', href: '/#about' }, { label: 'Products', href: '/products' }].map(link => (
                <li key={link.label}><a href={link.href} className="text-sm text-background/70 hover:text-primary transition-colors">{link.label}</a></li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-display text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm text-background/70"><Phone className="w-4 h-4 text-primary flex-shrink-0" /><span>(+880) 1986-999-889</span></li>
              <li className="flex items-center gap-3 text-sm text-background/70"><Mail className="w-4 h-4 text-primary flex-shrink-0" /><span>hello@asiasweetmeat.com</span></li>
              <li className="flex items-start gap-3 text-sm text-background/70"><MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" /><span>123 Sweet Lane, Dhaka, Bangladesh</span></li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className="font-display text-lg font-semibold mb-4">Help Center</h3>
            <ul className="space-y-2.5">
              {['Get in Touch', 'FAQs', 'Store Hours', 'Order Information'].map(item => (
                <li key={item}><a href="#" className="text-sm text-background/70 hover:text-primary transition-colors">{item}</a></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-background/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-background/50">© {new Date().getFullYear()} Asia Sweetmeat. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="text-sm text-background/50 hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="text-sm text-background/50 hover:text-primary transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
