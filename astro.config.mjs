import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { satteri } from '@astrojs/markdown-satteri';
import sitemap from '@astrojs/sitemap';
import headingNumberingPlugin from './src/plugins/heading-numbering.mjs';

export default defineConfig({
  site: 'https://camnangsinhvien.site',
  output: 'static',
  trailingSlash: 'always',
  markdown: {
    processor: satteri({ hastPlugins: [headingNumberingPlugin] }),
  },
  integrations: [
    mdx(),
    sitemap(),
  ],
});
