import { UserManager } from 'oidc-client-ts';

const runtimeEnv = (typeof window !== 'undefined' && window.__ENV__) || {};

const keycloakUrl =
    runtimeEnv.KEYCLOAK_URL ||
    import.meta.env.VITE_KEYCLOAK_URL ||
    'http://localhost:8080';

const appUrl =
    runtimeEnv.APP_URL ||
    import.meta.env.VITE_APP_URL ||
    'http://localhost:3000';

export const userManager = new UserManager({
    authority:    keycloakUrl + '/realms/demo',
    client_id:    'frontend',
    redirect_uri: appUrl + '/callback',
    scope:        'openid profile',
    automaticSilentRenew: true,
});

