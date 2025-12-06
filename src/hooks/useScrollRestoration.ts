import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

export const useScrollRestoration = (dataLoaded: boolean = true) => {
  const location = useLocation();
  const navigationType = useNavigationType();
  const restoredRef = useRef(false);
  const scrollTargetRef = useRef<number | null>(null);

  useEffect(() => {
    // Restore scroll position when component mounts
    if (!restoredRef.current) {
      // For POP navigation (browser back/forward), save target scroll from history state
      if (navigationType === 'POP' && window.history.state?.scrollY !== undefined) {
        scrollTargetRef.current = window.history.state.scrollY;
      } else {
        // For PUSH/REPLACE navigation, scroll to top
        window.scrollTo(0, 0);
        restoredRef.current = true;
      }
    }
  }, [navigationType]);

  // Wait for data to load before restoring scroll
  useEffect(() => {
    if (scrollTargetRef.current !== null && dataLoaded && !restoredRef.current) {
      // Small delay to ensure DOM is fully rendered
      const timeoutId = setTimeout(() => {
        if (scrollTargetRef.current !== null) {
          window.scrollTo(0, scrollTargetRef.current);
          scrollTargetRef.current = null;
          restoredRef.current = true;
        }
      }, 50);
      
      return () => clearTimeout(timeoutId);
    }
  }, [dataLoaded]);

  // Save scroll position to history state before component unmounts
  useEffect(() => {
    return () => {
      window.history.replaceState(
        { ...window.history.state, scrollY: window.scrollY },
        ''
      );
    };
  }, [location.pathname]);

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
