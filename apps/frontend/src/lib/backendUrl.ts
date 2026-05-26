const IP_REGEX = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/

export function getBackendUrl(): string {
  if (typeof window === 'undefined') return 'http://localhost:3001'

  const { hostname, protocol } = window.location

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return process.env.NEXT_PUBLIC_BACKEND_URL || `${protocol}//${hostname}:3001`
  }

  if (IP_REGEX.test(hostname)) {
    return `${protocol}//${hostname}`
  }

  if (hostname.endsWith('pokaface.win')) {
    return process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.pokaface.win'
  }

  return process.env.NEXT_PUBLIC_BACKEND_URL || `${protocol}//${hostname}:3001`
}
