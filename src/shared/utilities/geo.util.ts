// src/shared/utilities/geo.util.ts

/**
 * Calculates the estimated distance and time between two geographic coordinates
 * using the Haversine formula, adjusted for city road tortuosity.
 * * @param pickupCoords [longitude, latitude]
 * @param destCoords [longitude, latitude]
 * @returns { distanceKm, estimatedTimeMins }
 */
export const calculateFallbackRouting = (
  pickupCoords: [number, number],
  destCoords: [number, number],
): { distanceKm: number; estimatedTimeMins: number } => {
  const [lon1, lat1] = pickupCoords;
  const [lon2, lat2] = destCoords;

  // Haversine Formula for straight-line coordinate distance
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightLineDistance = R * c;

  // Apply 1.3x road tortuosity factor (roads are rarely perfect straight lines)
  const distanceKm = Number((straightLineDistance * 1.3).toFixed(2));

  // Assume average city speed of 30 km/h (which roughly translates to 2 mins per km)
  const estimatedTimeMins = Number((distanceKm * 2).toFixed(0));

  return { distanceKm, estimatedTimeMins };
};
