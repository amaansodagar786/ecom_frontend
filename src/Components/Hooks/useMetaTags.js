// hooks/useMetaTags.js
import { useEffect } from 'react';

const useMetaTags = ({ title, description, imageUrl, url }) => {
  useEffect(() => {
    // Update standard meta tags
    document.title = title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);

    // Update Open Graph meta tags
    const metaTags = [
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: imageUrl },
      { property: 'og:url', content: url },
      { property: 'og:type', content: 'product' },
      
      // Twitter card meta tags (optional)
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: imageUrl },
    ];

    metaTags.forEach(tag => {
      let element = document.querySelector(`meta[property="${tag.property}"]`) || 
                   document.querySelector(`meta[name="${tag.name}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        if (tag.property) element.setAttribute('property', tag.property);
        if (tag.name) element.setAttribute('name', tag.name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', tag.content);
    });

    return () => {
      // Clean up if needed
      document.title = 'Your Default Site Title';
    };
  }, [title, description, imageUrl, url]);
};

export default useMetaTags;