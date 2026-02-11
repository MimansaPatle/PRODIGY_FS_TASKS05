import { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon } from 'lucide-react';

const LazyImage = ({ 
  src, 
  alt = "", 
  className = "", 
  placeholder = null,
  onLoad = () => {},
  onError = () => {}
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '50px' // Start loading 50px before the image comes into view
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad();
  };

  const handleError = () => {
    setHasError(true);
    onError();
  };

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {/* Loading placeholder */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-slate-200 animate-pulse flex items-center justify-center">
          {placeholder || (
            <ImageIcon size={32} className="text-slate-300" />
          )}
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 bg-slate-100 flex items-center justify-center">
          <div className="text-center">
            <ImageIcon size={32} className="text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-400">Failed to load</p>
          </div>
        </div>
      )}

      {/* Actual image */}
      {isInView && src && !hasError && (
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
};

export default LazyImage;