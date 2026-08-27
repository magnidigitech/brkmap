import { computeRoute, computeRouteMatrix, MatrixItemInput, MatrixCellResult, RouteCalculationResult } from './routes';

export interface RoutingProvider {
  calculateRoute(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number }
  ): Promise<RouteCalculationResult>;

  calculateMatrix(locations: MatrixItemInput[]): Promise<MatrixCellResult[]>;
}

export class GoogleRoutingProvider implements RoutingProvider {
  async calculateRoute(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number }
  ): Promise<RouteCalculationResult> {
    return computeRoute(origin, destination);
  }

  async calculateMatrix(locations: MatrixItemInput[]): Promise<MatrixCellResult[]> {
    return computeRouteMatrix(locations);
  }
}

export const defaultRoutingProvider: RoutingProvider = new GoogleRoutingProvider();
