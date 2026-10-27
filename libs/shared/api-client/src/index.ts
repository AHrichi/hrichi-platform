// Types generated from the Orbit API's OpenAPI contract (ADR-0013, ADR-0017).
// Run `pnpm nx run shared-api-client:generate` after the contract changes; CI
// fails when the committed types differ from a fresh generation.
import type { components, paths } from './generated/orbit-api';

export type { components, operations, paths } from './generated/orbit-api';

type Schemas = components['schemas'];

export type NightsResponse = Schemas['NightsResponse'];
export type Night = Schemas['Night'];
export type DarkWindow = Schemas['DarkWindow'];
export type ActiveShower = Schemas['ActiveShower'];
export type ApiProblem = Schemas['ProblemDetail'] & {
  errors?: { parameter: string; message: string }[];
};

/** Query parameters of `GET /nights`. */
export type NightsQuery = NonNullable<
  paths['/nights']['get']['parameters']['query']
>;
