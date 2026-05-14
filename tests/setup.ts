import { afterAll, afterEach, beforeAll } from 'vitest'

import { server } from '../mock/server'

beforeAll(() => {
  server.listen({
    onUnhandledRequest: 'error'
  })
})

afterEach(() => {
  server.resetHandlers()
  localStorage.clear()
})

afterAll(() => {
  server.close()
})

