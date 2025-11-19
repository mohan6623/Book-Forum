import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

export const useScrollRestoration = () => {
  const location = useLocation();
  const navigationType = useNavigationType();
  const restoredRef = useRef(false);

  useEffect(() => {
    // Restore scroll position when component mounts
    if (!restoredRef.current) {
      // For POP navigation (browser back/forward), restore from history state
      if (navigationType === 'POP' && window.history.state?.scrollY !== undefined) {
        requestAnimationFrame(() => {
          window.scrollTo(0, window.history.state.scrollY);
        });
      } else {
        // For PUSH/REPLACE navigation, scroll to top
        window.scrollTo(0, 0);
      }
      restoredRef.current = true;
    }

    // Save scroll position to history state before component unmounts
    return () => {
      window.history.replaceState(
        { ...window.history.state, scrollY: window.scrollY },
        ''
      );
    };
  }, [location.pathname, navigationType]);

  // Throttled scroll handler to update history state
  useEffect(() => {
    let timeoutId: number;
    
    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        window.history.replaceState(
          { ...window.history.state, scrollY: window.scrollY },
          ''
        );
      }, 100); // Throttle to every 100ms
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
};

// Function to save current scroll position before navigation
export const saveScrollPosition = () => {
  window.history.replaceState(
    { ...window.history.state, scrollY: window.scrollY },
    ''
  );
};
