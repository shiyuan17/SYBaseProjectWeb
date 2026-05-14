export function loadJson<T>(key: string, fallback: T): T {
  try {
    const rawValue = localStorage.getItem(key)

    if (!rawValue) {
      return fallback
    }

    return JSON.parse(rawValue) as T
  } catch {
    return fallback
  }
}

export function saveJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function removeStorageValue(key: string) {
  localStorage.removeItem(key)
}

