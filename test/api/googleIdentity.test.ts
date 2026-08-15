const originalIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const originalAndroidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const originalWebClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

type MockOptions = {
  authResult?: unknown;
  codeVerifier?: string | null;
  exchangeResult?: unknown;
  extraGoogleAuth?: {
    iosClientId?: string;
    androidClientId?: string;
  } | null;
  platform?: 'ios' | 'android' | 'web';
  scheme?: string | string[];
  iosBundleIdentifier?: string | null;
};

function loadGoogleIdentity({
  authResult = { type: 'success', params: { code: 'auth-code' }, authentication: null },
  codeVerifier = 'pkce-code-verifier',
  exchangeResult = { idToken: 'exchanged-id-token' },
  extraGoogleAuth = {
    iosClientId: 'ios-client-id',
    androidClientId: 'android-client-id',
  },
  platform = 'ios',
  scheme = 'dailymealapp',
  iosBundleIdentifier = 'com.dailymeal.app',
}: MockOptions = {}) {
  jest.resetModules();
  jest.clearAllMocks();

  const promptAsync = jest.fn().mockResolvedValue(authResult);
  const authRequest = jest.fn().mockImplementation(() => ({
    codeVerifier: codeVerifier ?? undefined,
    promptAsync,
  }));
  const exchangeCodeAsync = jest.fn().mockResolvedValue(exchangeResult);
  const makeRedirectUri = jest.fn().mockReturnValue('com.dailymeal.app:/oauthredirect');
  const maybeCompleteAuthSession = jest.fn();

  jest.doMock('expo-auth-session', () => ({
    AuthRequest: authRequest,
    ResponseType: { Code: 'code' },
    exchangeCodeAsync,
    makeRedirectUri,
  }));
  jest.doMock('expo-web-browser', () => ({
    maybeCompleteAuthSession,
  }));
  jest.doMock('expo-constants', () => ({
    __esModule: true,
    default: {
      expoConfig: {
        scheme,
        ios: { bundleIdentifier: iosBundleIdentifier ?? undefined },
        android: { package: 'com.dailymeal.app' },
        extra: extraGoogleAuth === null ? {} : { googleAuth: extraGoogleAuth },
      },
    },
  }));
  jest.doMock('react-native', () => ({
    Platform: {
      OS: platform,
      select: (options: Record<string, unknown>) => options[platform] ?? options.default,
    },
  }));

  const { requestGoogleIdToken } = require('@/api/googleIdentity');

  return {
    authRequest,
    exchangeCodeAsync,
    makeRedirectUri,
    maybeCompleteAuthSession,
    promptAsync,
    requestGoogleIdToken,
  };
}

afterEach(() => {
  restoreEnv('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID', originalIosClientId);
  restoreEnv('EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID', originalAndroidClientId);
  restoreEnv('EXPO_PUBLIC_GOOGLE_CLIENT_ID', originalWebClientId);
  jest.dontMock('expo-auth-session');
  jest.dontMock('expo-web-browser');
  jest.dontMock('expo-constants');
  jest.dontMock('react-native');
});

function restoreEnv(name: string, value: string | undefined) {
  if (typeof value === 'undefined') {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}

test('native Google identity exchanges an authorization code for an ID token', async () => {
  const {
    authRequest,
    exchangeCodeAsync,
    makeRedirectUri,
    maybeCompleteAuthSession,
    requestGoogleIdToken,
  } = loadGoogleIdentity();

  await expect(requestGoogleIdToken()).resolves.toBe('exchanged-id-token');

  expect(maybeCompleteAuthSession).toHaveBeenCalledTimes(1);
  expect(makeRedirectUri).toHaveBeenCalledWith({
    native: 'com.dailymeal.app:/oauthredirect',
    scheme: 'dailymealapp',
  });
  expect(authRequest).toHaveBeenCalledWith(
    expect.objectContaining({
      clientId: 'ios-client-id',
      redirectUri: 'com.dailymeal.app:/oauthredirect',
      responseType: 'code',
    }),
  );
  expect(exchangeCodeAsync).toHaveBeenCalledWith(
    expect.objectContaining({
      clientId: 'ios-client-id',
      code: 'auth-code',
      extraParams: { code_verifier: 'pkce-code-verifier' },
      redirectUri: 'com.dailymeal.app:/oauthredirect',
    }),
    expect.objectContaining({
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
    }),
  );
});

test('native Google identity uses Android client configuration', async () => {
  const { requestGoogleIdToken, authRequest } = loadGoogleIdentity({ platform: 'android' });

  await requestGoogleIdToken();

  expect(authRequest).toHaveBeenCalledWith(expect.objectContaining({ clientId: 'android-client-id' }));
});

test('native Google identity supports Expo config scheme arrays', async () => {
  const { makeRedirectUri, requestGoogleIdToken } = loadGoogleIdentity({
    scheme: ['dailymealapp', 'dailymeal'],
  });

  await requestGoogleIdToken();

  expect(makeRedirectUri).toHaveBeenCalledWith(
    expect.objectContaining({ scheme: 'dailymealapp' }),
  );
});

test('native Google identity can build a redirect URI without a native app identifier', async () => {
  const { makeRedirectUri, requestGoogleIdToken } = loadGoogleIdentity({
    iosBundleIdentifier: null,
  });

  await requestGoogleIdToken();

  expect(makeRedirectUri).toHaveBeenCalledWith(
    expect.objectContaining({ native: undefined }),
  );
});

test('Google identity uses the default public client ID outside native platforms', async () => {
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID = ' web-client-id ';
  const { requestGoogleIdToken, authRequest } = loadGoogleIdentity({
    extraGoogleAuth: {},
    platform: 'web',
  });

  await requestGoogleIdToken();

  expect(authRequest).toHaveBeenCalledWith(expect.objectContaining({ clientId: 'web-client-id' }));
});

test('Google identity falls back to an empty app config when env client ID is configured', async () => {
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID = 'web-client-id';
  const { requestGoogleIdToken, authRequest } = loadGoogleIdentity({
    extraGoogleAuth: null,
    platform: 'web',
  });

  await requestGoogleIdToken();

  expect(authRequest).toHaveBeenCalledWith(expect.objectContaining({ clientId: 'web-client-id' }));
});

test('native Google identity prefers public env client IDs over app config', async () => {
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID = ' env-ios-client-id ';
  const { requestGoogleIdToken, authRequest } = loadGoogleIdentity();

  await requestGoogleIdToken();

  expect(authRequest).toHaveBeenCalledWith(expect.objectContaining({ clientId: 'env-ios-client-id' }));
});

test('native Google identity returns an ID token already present on the auth result', async () => {
  const { exchangeCodeAsync, requestGoogleIdToken } = loadGoogleIdentity({
    authResult: {
      type: 'success',
      params: {},
      authentication: { idToken: 'prompt-id-token' },
    },
  });

  await expect(requestGoogleIdToken()).resolves.toBe('prompt-id-token');
  expect(exchangeCodeAsync).not.toHaveBeenCalled();
});

test('native Google identity requires a configured client ID', async () => {
  delete process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const { requestGoogleIdToken } = loadGoogleIdentity({ extraGoogleAuth: {} });

  await expect(requestGoogleIdToken()).rejects.toThrow('Google client is not configured');
});

test('native Google identity rejects when the prompt is cancelled', async () => {
  const { requestGoogleIdToken } = loadGoogleIdentity({ authResult: { type: 'cancel' } });

  await expect(requestGoogleIdToken()).rejects.toThrow('Google sign in failed');
});

test('native Google identity rejects when Google does not return an authorization code', async () => {
  const { requestGoogleIdToken } = loadGoogleIdentity({
    authResult: { type: 'success', params: {}, authentication: null },
  });

  await expect(requestGoogleIdToken()).rejects.toThrow('Google sign in failed');
});

test('native Google identity rejects when the exchanged token has no ID token', async () => {
  const { requestGoogleIdToken } = loadGoogleIdentity({
    exchangeResult: { accessToken: 'access-token' },
  });

  await expect(requestGoogleIdToken()).rejects.toThrow('Google sign in failed');
});

test('native Google identity exchanges code even when PKCE verifier is unavailable', async () => {
  const { exchangeCodeAsync, requestGoogleIdToken } = loadGoogleIdentity({
    codeVerifier: null,
  });

  await requestGoogleIdToken();

  expect(exchangeCodeAsync).toHaveBeenCalledWith(
    expect.objectContaining({ extraParams: { code_verifier: '' } }),
    expect.any(Object),
  );
});
