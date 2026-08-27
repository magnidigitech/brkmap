export interface PlaceSearchResult {
  placeId: string;
  name: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  category?: string;
}

const MOCK_PLACES: PlaceSearchResult[] = [
  {
    placeId: 'ChIJz3K4y_l3TjoR5H1tF8WqA-A',
    name: 'Guntur Central Party Headquarters',
    formattedAddress: 'Main Road, Brodipet, Guntur, Andhra Pradesh 522002',
    latitude: 16.3067,
    longitude: 80.4365,
    category: 'PARTY_OFFICE',
  },
  {
    placeId: 'ChIJX99l8Zp3TjoRF8Qv5-tS988',
    name: 'Mangalagiri Municipal Convention Hall',
    formattedAddress: 'GT Road, Mangalagiri, Guntur District, Andhra Pradesh 522503',
    latitude: 16.4348,
    longitude: 80.5501,
    category: 'MEETING_HALL',
  },
  {
    placeId: 'ChIJj70dF812TjoR72s3_89skL1',
    name: 'Tadikonda Community Center & Field Grounds',
    formattedAddress: 'Tadikonda Main Village, Guntur District, AP 522236',
    latitude: 16.4172,
    longitude: 80.4502,
    category: 'VILLAGE',
  },
  {
    placeId: 'ChIJp2sL76J3TjoR00x2s-917sK',
    name: 'District Collectorate Office Guntur',
    formattedAddress: 'Collectorate Compound, Collectorate Road, Guntur, AP 522004',
    latitude: 16.2991,
    longitude: 80.4485,
    category: 'GOVERNMENT_OFFICE',
  },
  {
    placeId: 'ChIJL33s9212TjoR98wKk-182sL',
    name: 'Tenali Public Meeting Stadium Grounds',
    formattedAddress: 'Station Road, Tenali, AP 522201',
    latitude: 16.2430,
    longitude: 80.6400,
    category: 'PUBLIC_MEETING',
  },
  {
    placeId: 'ChIJq-192sL2TjoR-10928sksL3',
    name: 'Pedakakani Temple Junction Community Park',
    formattedAddress: 'Temple Road, Pedakakani, Guntur, AP 522509',
    latitude: 16.3385,
    longitude: 80.5050,
    category: 'TEMPLE',
  },
  {
    placeId: 'ChIJs29188s1TjoR99102931sL4',
    name: 'Amaravati Government Guest House',
    formattedAddress: 'River View Road, Amaravati, AP 522020',
    latitude: 16.5417,
    longitude: 80.3575,
    category: 'RESIDENCE',
  },
  {
    placeId: 'ChIJn8271sL0TjoR88172634sL5',
    name: 'Guntur Government General Hospital',
    formattedAddress: 'Sambasivapet, Guntur, AP 522001',
    latitude: 16.3005,
    longitude: 80.4412,
    category: 'HOSPITAL',
  }
];

export async function searchPlaces(query: string): Promise<PlaceSearchResult[]> {
  const serverKey = process.env.GOOGLE_MAPS_SERVER_KEY;
  const isKeyValid = serverKey && serverKey !== 'YOUR_GOOGLE_MAPS_SERVER_KEY' && serverKey.trim().length > 0;

  if (!isKeyValid) {
    // Return filtered mock places for development
    if (!query || query.trim().length === 0) return MOCK_PLACES;
    const lower = query.toLowerCase();
    return MOCK_PLACES.filter(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        p.formattedAddress.toLowerCase().includes(lower)
    );
  }

  try {
    // Calling Google Places API (New) Text Search
    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': serverKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location',
      },
      body: JSON.stringify({
        textQuery: query,
        regionCode: 'IN',
      }),
    });

    if (!response.ok) {
      console.warn('Google Places API call returned non-200, returning mock fallback');
      return MOCK_PLACES.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
    }

    const data = await response.json();
    if (!data.places || !Array.isArray(data.places)) return [];

    return data.places.map((place: any) => ({
      placeId: place.id,
      name: place.displayName?.text || 'Unknown Location',
      formattedAddress: place.formattedAddress || '',
      latitude: place.location?.latitude || 0,
      longitude: place.location?.longitude || 0,
      category: 'OTHER',
    }));
  } catch (error) {
    console.error('Error fetching from Places API (New):', error);
    return MOCK_PLACES.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
  }
}
