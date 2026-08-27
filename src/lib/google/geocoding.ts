export interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const serverKey = process.env.GOOGLE_MAPS_SERVER_KEY;
  const isKeyValid = serverKey && serverKey !== 'YOUR_GOOGLE_MAPS_SERVER_KEY' && serverKey.trim().length > 0;

  if (!isKeyValid) {
    // Return Guntur AP default fallback location for local dev
    return {
      latitude: 16.3067,
      longitude: 80.4365,
      formattedAddress: address || 'Brodipet, Guntur, Andhra Pradesh 522002',
    };
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${serverKey}`;

    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    if (data.status === 'OK' && data.results?.[0]) {
      const first = data.results[0];
      return {
        latitude: first.geometry.location.lat,
        longitude: first.geometry.location.lng,
        formattedAddress: first.formatted_address,
      };
    }

    return null;
  } catch (error) {
    console.error('Geocoding API error:', error);
    return null;
  }
}
