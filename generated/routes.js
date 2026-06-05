// AUTO-GENERATED — do not edit manually
// Generated: 2026-06-05T21:26:34.834Z

import appRegistry from './registry.js'

/**
 * routeConfig — one entry per discovered app.
 * Fields:
 *   type        "react" | "html" | "url"
 *   component   set for react apps, null otherwise
 *   htmlPath    set for html apps (iframe src)
 *   url         set for url apps (iframe src)
 */
export const routeConfig = [
  {
    path:      '/greetings',
    slug:      'greetings',
    name:      'A Demo - Greetings',
    type:      'html',
    component: null,
    htmlPath:  '/apps/greetings/index.html',
    url:       null,
    iframeOptions: {},
  },
  {
    path:      '/todo-list-app',
    slug:      'todo-list-app',
    name:      'ABCD-TodoList-App',
    type:      'react',
    component: appRegistry['todo-list-app'],
    htmlPath:  null,
    url:       null,
    iframeOptions: {},
  },
  {
    path:      '/calculator',
    slug:      'calculator',
    name:      'Calculator',
    type:      'html',
    component: null,
    htmlPath:  '/apps/html-calculator/index.html',
    url:       null,
    iframeOptions: {},
  },
  {
    path:      '/portfolio',
    slug:      'portfolio',
    name:      'Portfolio',
    type:      'react',
    component: appRegistry['portfolio'],
    htmlPath:  null,
    url:       null,
    iframeOptions: {},
  },
  {
    path:      '/ptu-website',
    slug:      'ptu-website',
    name:      'PTU Website',
    type:      'html',
    component: null,
    htmlPath:  '/apps/ptu-website/index.html',
    url:       null,
    iframeOptions: {},
  },
]
export default routeConfig