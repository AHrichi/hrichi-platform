// Types generated from the Orbit API's OpenAPI contract (ADR-0013). Run
// `pnpm nx run shared-api-client:generate` after the contract changes; CI
// fails when the committed types differ from a fresh generation.
import type { components, paths } from './generated/orbit-api';

export type { components, operations, paths } from './generated/orbit-api';

type Schemas = components['schemas'];

export type OrbitalElements = Schemas['OrbitalElements'];
export type CatalogResponse = Schemas['CatalogResponse'];
export type SatelliteDetails = Schemas['SatelliteDetails'];
export type PassesResponse = Schemas['PassesResponse'];
export type Pass = Schemas['Pass'];
export type ApiProblem = Schemas['ProblemDetail'] & {
  errors?: { parameter: string; message: string }[];
};

/** Query parameters of `GET /satellites/{noradId}/passes`. */
export type PassesQuery = NonNullable<
  paths['/satellites/{noradId}/passes']['get']['parameters']['query']
>;
