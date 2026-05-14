import ElementPlus from 'element-plus'
import { createApp } from 'vue'

import App from '@/App.vue'
import language from '@/locales'
import { setupRouter } from '@/router'
import { setupGlobDirectives } from '@/directives'
import { seedArtMenu } from '@/router/art-menu'
import { store as pinia } from '@/store'
import { useSessionStore } from '@/stores/session'
import { useUserStore } from '@/store/modules/user'
import 'element-plus/dist/index.css'
import '@/assets/styles/core/tailwind.css'
import '@/assets/styles/index.scss'

import { setupMocking } from './setup-mocks'

export async function bootstrap() {
  await setupMocking()

  const app = createApp(App)
  const router = setupRouter()

  app.use(pinia)
  app.use(router)
  app.use(ElementPlus)
  app.use(language)
  setupGlobDirectives(app)

  const sessionStore = useSessionStore(pinia)
  sessionStore.hydrate()
  const userStore = useUserStore(pinia)
  userStore.syncFromSession(sessionStore)
  seedArtMenu()

  await router.isReady()
  app.mount('#app')
}
