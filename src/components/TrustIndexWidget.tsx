"use client";
import { useEffect, useRef } from "react";

export function TrustIndexWidget({ widgetId }: { widgetId: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || el.querySelector("script")) return;

    const load = () => {
      if (el.querySelector("script")) return;
      const script = document.createElement("script");
      script.src = `https://cdn.trustindex.io/loader.js?${widgetId}`;
      script.async = true;
      script.defer = true;
      el.appendChild(script);
    };

    // Defer loading the reviews widget (a ~100 KiB third party) until it's near the
    // viewport, so its script and network cost stay off the initial load / main thread.
    if (!("IntersectionObserver" in window)) {
      load();
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          observer.disconnect();
          load();
        }
      },
      { rootMargin: "300px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [widgetId]);
  return <div ref={ref} />;
}
