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
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
