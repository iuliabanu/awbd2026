import { UserManager } from 'oidc-client-ts';
import { env } from './env';

export const userManager = new UserManager({
    authority:    env.KEYCLOAK_URL + '/realms/demo',
    client_id:    'frontend',           // registered in Keycloak as public, PKCE
    redirect_uri: env.APP_URL + '/callback',
    scope:        'openid profile',
    automaticSilentRenew: true,
});
