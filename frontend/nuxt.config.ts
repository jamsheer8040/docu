// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  srcDir: '.',
  compatibilityDate: '2024-11-01',
  css: ['~/assets/css/main.css'],
  devtools: { enabled: true },
  modules: [
    'vuetify-nuxt-module',
  ],
  vuetify: {
    vuetifyOptions: {
      theme: {
        defaultTheme: 'light',
        themes: {
          light: {
            colors: {
              primary: '#3B82F6',
              secondary: '#A3AED0',
              background: '#F4F7FE',
              surface: '#FFFFFF',
              'on-surface': '#2B3674',
              success: '#05CD99',
              warning: '#FFCE20',
              error: '#EE5D50',
            },
          },
        },
      },
      defaults: {
        VCard: {
          rounded: 'xl', /* Translates to roughly 20-24px */
          elevation: 0,
          variant: 'flat',
        },
        VBtn: {
          rounded: 'lg',
          fontWeight: '600',
          textTransform: 'none',
          elevation: 0,
        },
        VTextField: {
          variant: 'outlined',
          rounded: 'lg',
          color: 'primary',
          density: 'comfortable',
          bgColor: '#FFFFFF',
        },
        VSelect: {
          variant: 'outlined',
          rounded: 'lg',
          color: 'primary',
          density: 'comfortable',
          bgColor: '#FFFFFF',
        },
        VAlert: {
          rounded: 'lg',
          variant: 'flat',
        }
      }
    }
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '/api/v1'
    }
  },
  nitro: {
    routeRules: {
      '/api/**': { proxy: 'http://localhost:5000/api/**' }
    }
  },
  typescript: {
    strict: true
  }
})
