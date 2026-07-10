import { createPinia } from 'pinia';

export default defineNuxtPlugin({
  name: 'pinia-init',
  enforce: 'pre', // MUST run before all other plugins
  setup(nuxtApp) {
    const pinia = createPinia();
    nuxtApp.vueApp.use(pinia);
    return {
      provide: {
        pinia: pinia
      }
    };
  }
});
