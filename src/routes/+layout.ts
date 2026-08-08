// This is a cookie-driven, realtime, authenticated admin SPA -- SSR would
// mean re-solving cross-origin cookie forwarding server-side for no real
// benefit (no SEO/perf need for an internal admin tool). `adapter-node` is
// still required regardless of SSR posture; it's what makes `build/
// handler.js` mountable inside Soul core via `-S`/`--studio`.
export const ssr = false;
