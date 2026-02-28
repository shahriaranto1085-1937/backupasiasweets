import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Ensures each navigation starts at the top of the page.
// Fixes: navigating from a scrolled page keeps the next page scrolled.
const ScrollToTop = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Use both pathname and search so /products?q=... also resets.
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname, search]);

  return null;
};

export default ScrollToTop;
