import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    // Page view tracking
    if (window.gtag) {
      window.gtag('config', 'AW-843452285', {
        page_path: location.pathname + location.search,
      });
    }

    // Ensure conversion tracking function is globally available
    if (!window.gtag_report_conversion) {
      window.gtag_report_conversion = function (url) {
        const callback = function () {
          if (typeof url !== 'undefined') {
            window.location = url;
          }
        };
        window.gtag('event', 'conversion', {
          send_to: 'AW-843452285/Dtf_CPHq8vUZEP2emJID',
          event_callback: callback,
        });
        return false;
      };
    }
  }, [location]);
};

export default usePageTracking;
