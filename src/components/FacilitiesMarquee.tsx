"use client";
import { useEffect } from "react";

// Drives the dual-track image marquee on /our-facilities. Each belt in the markup
// contains 3 identical copies of its images, so scrolling by one copy's width and
// wrapping (modulo) gives a seamless infinite loop. Both belts share one offset and
// advance at the same speed, matching the original site's behavior.
const SPEED = 0.6; // px per frame
const COPIES = 3;

export default function FacilitiesMarquee() {
  useEffect(() => {
    const belts = Array.from(
      document.querySelectorAll<HTMLElement>(".dual-track .slide-belt")
    );
    if (belts.length === 0) return;

    const copyWidth = new Map<HTMLElement, number>();
    const measure = () => {
      for (const belt of belts) copyWidth.set(belt, belt.scrollWidth / COPIES);
    };
    measure();

    // Image widths (width:auto) aren't known until they load; re-measure then.
    const imgs = belts.flatMap((b) => Array.from(b.querySelectorAll("img")));
    let pending = imgs.filter((i) => !i.complete).length;
    const onImg = () => {
      if (--pending <= 0) measure();
    };
    if (pending > 0) {
      for (const img of imgs) {
        if (!img.complete) img.addEventListener("load", onImg, { once: true });
      }
    }
    window.addEventListener("resize", measure);

    let offset = 0;
    let raf = 0;
    const loop = () => {
      offset += SPEED;
      for (const belt of belts) {
        const w = copyWidth.get(belt) ?? 0;
        if (w > 0) belt.style.transform = `translateX(-${offset % w}px)`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
    };
  }, []);

  return null;
}
