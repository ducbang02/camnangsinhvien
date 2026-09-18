import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://camnangsinhvien.site',
  output: 'static',
  trailingSlash: 'always',
  integrations: [
    mdx(),
    sitemap(),
  ],
});
