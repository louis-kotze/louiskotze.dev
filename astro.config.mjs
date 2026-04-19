// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://louiskotze.dev',
  trailingSlash: 'never',
  build: {
    format: 'file',
  },
});
