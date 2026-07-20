"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import type { SwiperOptions } from "swiper/types";

const initialized = new WeakSet<Element>();

function toCount(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

// Elementor's image_spacing_custom ({ size, unit }) maps to Swiper's spaceBetween,
// which renders as margin-right between slides. Falls back when tablet/mobile are blank.
function toGap(value: unknown, fallback: number): number {
  const size = (value as { size?: unknown } | null | undefined)?.size;
  // Elementor leaves tablet/mobile blank ("") to inherit the desktop value —
  // note Number("") is 0, not NaN, so guard the empty/missing case explicitly.
  if (size === "" || size == null) return fallback;
  const n = Number(size);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export default function Carousels() {
  const pathname = usePathname();
  useEffect(() => {
    let cancelled = false;
    const containers = Array.from(
      document.querySelectorAll(".swiper, .swiper-container")
    ).filter((el) => !initialized.has(el));
    if (containers.length === 0) return;
    (async () => {
      const [{ default: Swiper }, { Navigation, Pagination, Autoplay }] = await Promise.all([
        import("swiper"),
        import("swiper/modules"),
      ]);
      if (cancelled) return;
      for (const el of containers) {
        if (!(el instanceof HTMLElement) || initialized.has(el)) continue;
        initialized.add(el);
        const wrapper = el.querySelector(".swiper-wrapper");
        if (wrapper instanceof HTMLElement) {
          wrapper.style.transform = "";
          wrapper.style.transitionDuration = "";
        }
        const widget = el.closest("[data-settings]");
        let settings: Record<string, unknown> = {};
        try {
          settings = JSON.parse(widget?.getAttribute("data-settings") ?? "{}");
        } catch {
          settings = {};
        }
        const desktop = toCount(settings.slides_to_show, 1);
        const tablet = toCount(settings.slides_to_show_tablet, desktop);
        const mobile = toCount(settings.slides_to_show_mobile, 1);

        const slideCount = wrapper
          ? Array.from(wrapper.children).filter((c) => c.classList.contains("swiper-slide")).length
          : 0;
        const wantsLoop = settings.infinite === "yes" || settings.loop === "yes";
        const gap = toGap(settings.image_spacing_custom, 0);
        const gapTablet = toGap(settings.image_spacing_custom_tablet, gap);
        const gapMobile = toGap(settings.image_spacing_custom_mobile, gap);
        const options: SwiperOptions = {
          modules: [Navigation, Pagination, Autoplay],
          slidesPerView: mobile,
          spaceBetween: gapMobile,
          breakpoints: {
            768: { slidesPerView: tablet, spaceBetween: gapTablet },
            1025: { slidesPerView: desktop, spaceBetween: gap },
          },
          loop: wantsLoop && slideCount >= Math.max(desktop, tablet, mobile) * 2,
          speed: toCount(settings.speed, 500),
          autoplay:
            settings.autoplay === "yes"
              ? { delay: toCount(settings.autoplay_speed, 5000) }
              : false,
        };
        const scope = widget ?? el;
        const nextEl = scope.querySelector(".elementor-swiper-button-next, .swiper-button-next");
        const prevEl = scope.querySelector(".elementor-swiper-button-prev, .swiper-button-prev");
        if (nextEl instanceof HTMLElement && prevEl instanceof HTMLElement) {
          options.navigation = { nextEl, prevEl };
        }
        const paginationEl = scope.querySelector(".swiper-pagination");
        if (paginationEl instanceof HTMLElement) {
          options.pagination = { el: paginationEl, clickable: true };
        }
        new Swiper(el, options);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);
  return null;
}
