import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// the site stays one file: the build inlines everything into dist/index.html
export default defineConfig({
    plugins: [viteSingleFile()],
});