import {
  authApi,
  entitiesApi,
  ownerApi,
  publicApi,
  pushApi,
  qrApi,
} from "./endpoints";

/**
 * The API surface a client renders against, as one swappable object.
 *
 * It exists so a tree can be handed a different implementation — the `/mock`
 * fixtures, a test double — without any component knowing. The real one is
 * below; `@birlinq/platform` is what actually hands it down.
 */
export interface AppApi {
  auth: typeof authApi;
  entities: typeof entitiesApi;
  qr: typeof qrApi;
  public: typeof publicApi;
  owner: typeof ownerApi;
  push: typeof pushApi;
}

export const realApi: AppApi = {
  auth: authApi,
  entities: entitiesApi,
  qr: qrApi,
  public: publicApi,
  owner: ownerApi,
  push: pushApi,
};
