export async function setupMocking() {
  const isMockEnabled = import.meta.env.DEV && import.meta.env.VITE_ENABLE_MSW === 'true'

  if (!isMockEnabled) {
    return
  }

  try {
    const { worker } = await import('../../mock/browser')

    await worker.start({
      onUnhandledRequest: 'bypass',
      serviceWorker: {
        url: '/mockServiceWorker.js'
      }
    })
  } catch (error) {
    console.warn('[MSW] Mock worker 启动失败，已跳过本地 mock，不阻断应用启动。', error)
  }
}
