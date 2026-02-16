import Navbar from '@/components/Navbar';
import ProductSearch from '@/components/ProductSearch';
import Footer from '@/components/Footer';
import SupportTicketWidget from '@/components/SupportTicketWidget';

const Products = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar showSearch={false} />
      <main>
        <ProductSearch />
      </main>
      <Footer />
      <SupportTicketWidget />
    </div>
  );
};

export default Products;
