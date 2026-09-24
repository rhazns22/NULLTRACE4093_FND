import { useEffect, useRef, useState } from "react";

export function CustomCursor() {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (window.matchMedia("(pointer: coarse)").matches || prefersReducedMotion.matches) {
      return;
    }

    let rafId = 0;
    let targetX = -100;
    let targetY = -100;
    let currentRingX = -100;
    let currentRingY = -100;
    let currentDotX = -100;
    let currentDotY = -100;

    function onMouseMove(e: MouseEvent) {
      targetX = e.clientX;
      targetY = e.clientY;
      setIsVisible(true);

      const target = e.target as HTMLElement | null;
      if (target) {
        const interactive = !!target.closest(
          "button, input, a, [role='button'], .glyph-control, .receipt-grid div, .modal-signal-entry",
        );
        setIsHovered(interactive);
      }
    }

    function onMouseDown() {
      setIsClicking(true);
    }

    function onMouseUp() {
      setIsClicking(false);
    }

    function onMouseLeave() {
      setIsVisible(false);
    }

    function onMouseEnter() {
      setIsVisible(true);
    }

    function loop() {
      currentDotX += (targetX - currentDotX) * 0.72;
      currentDotY += (targetY - currentDotY) * 0.72;
      currentRingX += (targetX - currentRingX) * 0.17;
      currentRingY += (targetY - currentRingY) * 0.17;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${currentDotX}px, ${currentDotY}px, 0) translate(-50%, -50%)`;
      }

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${currentRingX}px, ${currentRingY}px, 0) translate(-50%, -50%)`;
      }

      root.style.setProperty("--cursor-x", `${currentRingX}px`);
      root.style.setProperty("--cursor-y", `${currentRingY}px`);

      rafId = requestAnimationFrame(loop);
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);
    rafId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
      cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    let rafId = 0;

    function updateScrollProgress() {
      const scrollable = root.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? window.scrollY / scrollable : 0;

      root.style.setProperty("--scroll-progress", `${Math.max(0, Math.min(1, progress)) * 100}%`);
      rafId = 0;
    }

    function requestUpdate() {
      if (!rafId) {
        rafId = requestAnimationFrame(updateScrollProgress);
      }
    }

    updateScrollProgress();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  return (
    <>
      <div className="scroll-signal" aria-hidden="true" />
      <div
        className="apparatus-cursor-dot"
        data-visible={isVisible}
        ref={dotRef}
        aria-hidden="true"
      />
      <div
        className={`apparatus-cursor-ring ${isHovered ? "apparatus-cursor-ring--hover" : ""} ${
          isClicking ? "apparatus-cursor-ring--click" : ""
        }`}
        data-visible={isVisible}
        ref={ringRef}
        aria-hidden="true"
      />
    </>
  );
}
