// ============================================================
// LocalSetu — Reverse Geocoding via OpenStreetMap Nominatim
// Free, no API key required. Rate limit: 1 req/sec (fine for
// occasional location checks, not bulk).
// ============================================================

const NOMINATIM = 'https://nominatim.openstreetmap.org'

/**
 * Convert lat/lng to a locality name using Nominatim.
 * Returns the most specific area name available.
 */
export async function reverseGeocode(lat, lng) {
  const url = `${NOMINATIM}/reverse?lat=${lat}&lon=${lng}&format=json&zoom=14&addressdetails=1`
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'LocalSetu/1.0 (hyperlocal community app)'
    }
  })
  if (!res.ok) throw new Error(`Geocode failed: ${res.status}`)
  const data = await res.json()
  const addr = data.address || {}

  // Priority order for Indian localities
  return (
    addr.suburb ||
    addr.neighbourhood ||
    addr.city_district ||
    addr.village ||
    addr.town ||
    addr.county ||
    addr.city ||
    'Your area'
  )
}

/**
 * Check if a post's locality matches the live locality.
 * Handles partial matches: "Kharghar Sector 20" matches "Kharghar",
 * "Bandra" matches "Bandra West".
 */
export function matchesLiveLocality(postLocality, liveLocality) {
  if (!liveLocality || !postLocality) return false
  const live = liveLocality.toLowerCase().trim()
  const post = postLocality.toLowerCase().trim()
  return post.includes(live) || live.includes(post)
}

/**
 * Haversine distance between two lat/lng points, in metres.
 */
export function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const toRad = d => d * Math.PI / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}
