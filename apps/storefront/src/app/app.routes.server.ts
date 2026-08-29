import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    // The catalog listing fetches live product data from the API. At
    // *build* time (prerendering/SSG) no backend is running to answer
    // that request, so it hangs and aborts the whole prerender worker
    // pool. Dynamic, frequently-changing data belongs in Server render
    // mode (rendered per real request, when the API is actually up),
    // not Prerender (baked into the build).
    path: '',
    renderMode: RenderMode.Server,
  },
  {
    // Same reasoning — product detail also depends on data unknown/
    // unfetchable at build time.
    path: 'products/:slug',
    renderMode: RenderMode.Server,
  },
  {
    // Checkout has no SEO value and is inherently personalized/dynamic —
    // same reasoning as the two routes above, made explicit rather than
    // relying on it falling through to the wildcard rule below.
    path: 'checkout',
    renderMode: RenderMode.Server,
  },
  {
    // Account profile is auth-gated and personalized — prerendering it
    // would bake in the unauthenticated shell for every user.
    path: 'account',
    renderMode: RenderMode.Server,
  },
  {
    // Order history is personalized, auth-gated data — same reasoning.
    path: 'orders',
    renderMode: RenderMode.Server,
  },
  {
    // A customer order detail page is personalized and requires a live route param,
    // so it must be server-rendered rather than prerendered.
    path: 'orders/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
