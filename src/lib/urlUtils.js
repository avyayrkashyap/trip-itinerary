import { httpsCallable } from 'firebase/functions'
import { fns } from './firebase'

export function isShortMapsUrl(url) {
  return /maps\.app\.goo\.gl|goo\.gl\/maps/.test(url)
}

export function extractNameFromMapsUrl(url) {
  const m = url.match(/\/maps\/(?:place|search)\/([^/@?]+)/)
  return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : null
}

export async function resolveNameFromUrl(url) {
  if (isShortMapsUrl(url)) {
    const fn = httpsCallable(fns, 'resolveShortUrl')
    const { data } = await fn({ url })
    return { expandedUrl: data.url, name: extractNameFromMapsUrl(data.url) }
  }
  return { expandedUrl: url, name: extractNameFromMapsUrl(url) }
}
