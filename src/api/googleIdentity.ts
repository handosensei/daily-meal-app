import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

type GoogleAuthExtra = {
  iosClientId?: string;
  androidClientId?: string;
  iosUrlScheme?: string;
};

const GOOGLE_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

const GOOGLE_SCOPES = [
  'openid',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
];

function getGoogleAuthExtra() {
  return (Constants.expoConfig?.extra?.googleAuth ?? {}) as GoogleAuthExtra;
}

function getConfiguredClientId() {
  const googleAuth = getGoogleAuthExtra();
  const platformClientId = Platform.select({
    ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() || googleAuth.iosClientId,
    android:
      process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() || googleAuth.androidClientId,
    default: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID?.trim(),
  });

  return platformClientId?.trim();
}

function getNativeApplicationId() {
  return Platform.select({
    ios: Constants.expoConfig?.ios?.bundleIdentifier,
    android: Constants.expoConfig?.android?.package,
    default: undefined,
  });
}

function getConfiguredScheme() {
  const scheme = Constants.expoConfig?.scheme;

  return Array.isArray(scheme) ? scheme[0] : scheme;
}

function getIosGoogleUrlScheme(clientId: string) {
  const iosUrlScheme = getGoogleAuthExtra().iosUrlScheme?.trim();

  if (iosUrlScheme) {
    return iosUrlScheme;
  }

  const googleClientSuffix = '.apps.googleusercontent.com';

  if (!clientId.endsWith(googleClientSuffix)) {
    return undefined;
  }

  return `com.googleusercontent.apps.${clientId.slice(0, -googleClientSuffix.length)}`;
}

function getNativeRedirectUri(clientId: string) {
  if (Platform.OS === 'ios') {
    const googleUrlScheme = getIosGoogleUrlScheme(clientId);

    if (googleUrlScheme) {
      return `${googleUrlScheme}:/oauthredirect`;
    }
  }

  const nativeApplicationId = getNativeApplicationId();

  return nativeApplicationId ? `${nativeApplicationId}:/oauthredirect` : undefined;
}

function getRedirectUri(clientId: string) {
  return AuthSession.makeRedirectUri({
    native: getNativeRedirectUri(clientId),
    scheme: getConfiguredScheme(),
  });
}

export async function requestGoogleIdToken(): Promise<string> {
  const clientId = getConfiguredClientId();

  if (!clientId) {
    throw new Error('Google client is not configured');
  }

  const redirectUri = getRedirectUri(clientId);
  const request = new AuthSession.AuthRequest({
    clientId,
    redirectUri,
    responseType: AuthSession.ResponseType.Code,
    scopes: GOOGLE_SCOPES,
  });
  const result = await request.promptAsync(GOOGLE_DISCOVERY);

  if (result.type !== 'success') {
    throw new Error('Google sign in failed');
  }

  if (result.authentication?.idToken) {
    return result.authentication.idToken;
  }

  const code = result.params.code;

  if (!code) {
    throw new Error('Google sign in failed');
  }

  const authentication = await AuthSession.exchangeCodeAsync(
    {
      clientId,
      code,
      redirectUri,
      scopes: GOOGLE_SCOPES,
      extraParams: {
        code_verifier: request.codeVerifier ?? '',
      },
    },
    GOOGLE_DISCOVERY,
  );

  if (!authentication.idToken) {
    throw new Error('Google sign in failed');
  }

  return authentication.idToken;
}
