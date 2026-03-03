import { useEffect } from "react";

const SEO = ({ 
  title,
  description = "Offensive security portfolio documenting CTF writeups, penetration testing research, and red team techniques by Maxwell Ferreira.",
  image = null,
  type = "website"
}) => {
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const fullUrl = typeof window !== 'undefined' ? window.location.href : '';
  const pageTitle = title ? String(title) : 'ZeroDay.log';
  const displayTitle = title && title !== 'ZeroDay.log' ? `${pageTitle} | ZeroDay.log` : 'ZeroDay.log';
  const imageUrl = image ? (image.startsWith('http') ? image : `${siteUrl}${image}`) : null;
  
  useEffect(() => {
    // Set document title
    document.title = displayTitle;
    
    // Update or create meta tags
    const updateMeta = (name, content, property = false) => {
      const attr = property ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attr}="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };
    
    updateMeta('description', String(description));
    updateMeta('og:type', type, true);
    updateMeta('og:url', fullUrl, true);
    updateMeta('og:title', displayTitle, true);
    updateMeta('og:description', String(description), true);
    updateMeta('og:site_name', 'ZeroDay.log', true);
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', displayTitle);
    updateMeta('twitter:description', String(description));
    
    if (imageUrl) {
      updateMeta('og:image', imageUrl, true);
      updateMeta('twitter:image', imageUrl);
    }
    
    // Update canonical link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', fullUrl);
  }, [displayTitle, description, fullUrl, imageUrl, type]);
  
  return null;
};

export default SEO;
