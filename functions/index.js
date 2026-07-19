const functions = require('firebase-functions')
const https = require('https')
const http = require('http')

function followRedirect(url, hops = 5) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http
    lib.get(url, { method: 'HEAD' }, res => {
      const loc = res.headers.location
      if (loc && hops > 0 && [301, 302, 303, 307, 308].includes(res.statusCode)) {
        followRedirect(loc, hops - 1).then(resolve).catch(reject)
      } else {
        resolve(url)
      }
    }).on('error', reject)
  })
}

exports.resolveShortUrl = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Login required')
  }
  const resolved = await followRedirect(data.url)
  return { url: resolved }
})
