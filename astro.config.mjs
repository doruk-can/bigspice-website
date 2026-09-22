// @ts-check
import { defineConfig } from 'astro/config';
import { SITE } from './src/lib/site.mjs';

// Static output, no adapter — the whole site is nine HTML files plus assets,
// which is exactly what Cloudflare Pages wants handed to it.
/**
 * Every table in the legal documents gets its own scroll container.
 * legal/README.md §1.2 item 3: "Tables must scroll sideways inside their own
 * container. The page body must never scroll sideways." The privacy policy
 * has five-column tables and the pages have to be readable at 390px.
 *
 * Written out rather than pulled in: it is a tree walk, and a dependency for
 * nine lines is a dependency to keep updated forever.
 */
function wrapTables() {
  return (tree) => {
    const walk = (node) => {
      if (!node.children) return;
      node.children = node.children.map((child) => {
        walk(child);
        if (child.type !== 'element' || child.tagName !== 'table') return child;
        return {
          type: 'element',
          tagName: 'div',
          properties: { className: ['table-scroll'], tabindex: '0', role: 'region' },
          children: [child],
        };
      });
    };
    walk(tree);
  };
}

export default defineConfig({
  markdown: { rehypePlugins: [wrapTables] },
  site: SITE.url,
  output: 'static',
  trailingSlash: 'never',
  /* `file`, not `directory`, because GitHub Pages is the host. With
     `directory` it emits privacy/index.html, serves it at /privacy/ and
     301s /privacy to it — while every canonical, every hreflang and the
     app's own LEGAL_PATHS say /privacy with no slash. `file` emits
     privacy.html, which Pages answers at /privacy with a 200.
     legal/README.md §1.1: "/terms and /privacy must answer directly with a
     200. Avoid redirect chains." */
  build: { format: 'file', inlineStylesheets: 'always' },
  compressHTML: true,
  devToolbar: { enabled: false },
  server: { port: 4321 },
});
