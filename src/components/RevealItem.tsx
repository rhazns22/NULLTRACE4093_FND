import { useEffect, useRef, useState, type ReactNode } from "react";

type RevealItemProps = {
  as?: "div" | "li";
  children: ReactNode;
  className?: string;
  delayMs?: number;
};

export function RevealItem({ as: Element = "div", children, className = "", delayMs = 0 }: RevealItemProps) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  function setElementRef(node: HTMLElement | null) {
    elementRef.current = node;
  }

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (delayMs > 0) {
            setTimeout(() => setIsVisible(true), delayMs);
          } else {
            setIsVisible(true);
          }
          observer.unobserve(element);
        }
      },
      {
        threshold: 0.15,
        rootMargin: "0px 0px -20px 0px",
      },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [delayMs]);

  return (
    <Element
      className={`reveal-observer-item ${isVisible ? "reveal-observer-item--visible" : ""} ${className}`}
      ref={setElementRef}
    >
      {children}
    </Element>
  );
}
