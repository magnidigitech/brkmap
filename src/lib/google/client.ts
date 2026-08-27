import { Loader } from '@googlemaps/js-api-loader';

let loaderInstance: Loader | null = null;

export function getGoogleMapsLoader(): Loader {
  if (!loaderInstance) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY || '';
    loaderInstance = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places', 'geometry', 'drawing', 'visualization'],
    });
  }
  return loaderInstance;
}

export function isGoogleMapsKeyAvailable(): boolean {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY;
  return Boolean(key && key !== 'YOUR_GOOGLE_MAPS_BROWSER_KEY' && key.trim().length > 0);
}
