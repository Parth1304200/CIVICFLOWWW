// Haversine formula — accurate enough for 2km city-scale distances
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

// Bounding-box pre-filter for MongoDB query (fast index scan)
// then refine with haversine client-side
export function buildGeoQuery(lat: number, lng: number, radiusKm = 2) {
  const latDelta = radiusKm / 111;     // ~111 km per degree latitude
  const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));
  return {
    'location.lat': { $gte: lat - latDelta, $lte: lat + latDelta },
    'location.lng': { $gte: lng - lngDelta, $lte: lng + lngDelta },
  };
}
