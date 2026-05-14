import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import { createApp } from 'vue'

import App from '@/App.vue'
import { setupRouter } from '@/router'
import { useSessionStore } from '@/stores/session'
import '@/styles/main.css'

import { setupMocking } from './setup-mocks'

export async function bootstrap() {
  await setupMocking()

  const app = createApp(App)
  const pinia = createPinia()
  const router = setupRouter()

  app.use(pinia)
  app.use(router)
  app.use(ElementPlus)

  const sessionStore = useSessionStore(pinia)
  sessionStore.hydrate()

  await router.isReady()
  app.mount('#app')
}

