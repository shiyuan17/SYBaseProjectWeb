export async function setupMocking() {
  const isMockEnabled = import.meta.env.DEV && import.meta.env.VITE_ENABLE_MSW === 'true'

  if (!isMockEnabled) {
    return
  }

  const { worker } = await import('../../mock/browser')

  await worker.start({
    onUnhandledRequest: 'bypass'
  })
}

