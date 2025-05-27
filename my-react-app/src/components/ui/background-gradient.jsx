import React, { useState, useRef, useEffect } from "react";

export const BackgroundGradient = ({
  children,
  className = "",
  containerClassName = "",
  animate = true,
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !animate) return;
    
    container.addEventListener("mouseenter", () => setIsHovering(true));
    container.addEventListener("mouseleave", () => setIsHovering(false));
    
    return () => {
      if (!container) return;
      container.removeEventListener("mouseenter", () => setIsHovering(true));
      container.removeEventListener("mouseleave", () => setIsHovering(false));
    };
  }, [animate]);

  return (
    <div
      className={`relative ${containerClassName} transition-all duration-300 ${
        isHovering ? "transform -translate-y-2 shadow-xl" : "shadow-md"
      }`}
      ref={containerRef}
    >
      {animate && isHovering && (
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-[23px] opacity-75 blur-sm group-hover:opacity-100 transition duration-300"></div>
      )}
      <div className={`relative bg-white rounded-[22px] p-4 h-full ${className}`}>
        {children}
      </div>
    </div>
  );
}; 