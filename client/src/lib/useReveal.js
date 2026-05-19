// useReveal — reveal-on-enter primitive driven by IntersectionObserver.
// Attach the returned ref to any `.reveal` element; once it crosses 40% of the
// viewport, the `is-in` class is added (the .reveal style flips opacity +
// translateY). The reveal styles are no-ops under `prefers-reduced-motion` via
// the global rule in index.css, so this hook doesn't need to special-case it.
import { useEffect, useRef } from 'react';

export default function useReveal({ threshold = 0.4, once = true } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('is-in');
      return undefined;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            if (once) obs.unobserve(e.target);
          } else if (!once) {
            e.target.classList.remove('is-in');
          }
        });
      },
      { threshold },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold, once]);

  return ref;
}

// useRevealGroup — observes multiple children with a single observer; pass a
// container ref and each child marked with `.reveal` gets `is-in` on enter.
export function useRevealGroup({ threshold = 0.25, once = true, selector = '.reveal' } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;

    if (typeof IntersectionObserver === 'undefined') {
      root.querySelectorAll(selector).forEach((el) => el.classList.add('is-in'));
      return undefined;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            if (once) obs.unobserve(e.target);
          } else if (!once) {
            e.target.classList.remove('is-in');
          }
        });
      },
      { threshold },
    );

    root.querySelectorAll(selector).forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [threshold, once, selector]);

  return ref;
}
