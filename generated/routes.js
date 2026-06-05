// AUTO-GENERATED — do not edit manually
// Generated: 2026-06-05T11:49:17.319Z

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
    path:      '/todolistapp',
    slug:      'todolistapp',
    name:      'ABCD Todo List App',
    type:      'react',
    component: appRegistry['todolistapp'],
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
    path:      '/greetings',
    slug:      'greetings',
    name:      'Greetings',
    type:      'html',
    component: null,
    htmlPath:  '/apps/demo-greetings/index.html',
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
    path:      '/ptuwebsite',
    slug:      'ptuwebsite',
    name:      'PTU Website',
    type:      'html',
    component: null,
    htmlPath:  '/apps/ptu-website/index.html',
    url:       null,
    iframeOptions: {},
  },
]
export default routeConfig