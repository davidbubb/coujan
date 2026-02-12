const { defineConfig } = require('vite');

module.exports = async () => {
  const { svelte } = await import('@sveltejs/vite-plugin-svelte');
  return defineConfig({
    base: '/Coujan/',
    plugins: [svelte()]
  });
};
