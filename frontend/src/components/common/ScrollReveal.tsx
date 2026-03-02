import { ReactNode, useEffect, useRef, useState } from "react";

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  delayMs?: number;
  y?: number;
  threshold?: number;
  once?: boolean;
};

export default function ScrollReveal({
  children,
  className = "",
  delayMs = 0,
  y = 24,
  threshold = 0.2,
  once = true,
}: ScrollRevealProps) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const desktopQuery = window.matchMedia("(min-width: 768px)");
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const sync = () => {
      setIsDesktop(desktopQuery.matches);
      setReducedMotion(reducedMotionQuery.matches);
    };

    sync();

    desktopQuery.addEventListener("change", sync);
    reducedMotionQuery.addEventListener("change", sync);
    return () => {
      desktopQuery.removeEventListener("change", sync);
      reducedMotionQuery.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    if (reducedMotion) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry) return;

        if (once) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
          return;
        }

        setVisible(entry.isIntersecting);
      },
      { threshold }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [once, threshold, reducedMotion]);

  const finalY = isDesktop ? y : Math.max(10, Math.round(y * 0.65));
  const finalDelay = isDesktop ? delayMs : Math.round(delayMs * 0.6);
  const finalDuration = isDesktop ? 760 : 520;

  return (
    <div
      ref={elementRef}
      className={`transition-all ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform ${visible ? "opacity-100" : "opacity-0"} ${className}`}
      style={{
        transitionDuration: `${finalDuration}ms`,
        transitionDelay: `${finalDelay}ms`,
        transform: visible ? "translate3d(0,0,0)" : `translate3d(0,${finalY}px,0)`,
      }}
    >
      {children}
    </div>
  );
}
