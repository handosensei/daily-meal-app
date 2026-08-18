const originalIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const originalIosUrlScheme = process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME;
const originalAndroidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

function loadAppConfig() {
  jest.resetModules();

  return require('../app.config.js')();
}

afterEach(() => {
  restoreEnv('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID', originalIosClientId);
  restoreEnv('EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME', originalIosUrlScheme);
  restoreEnv('EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID', originalAndroidClientId);
});

function restoreEnv(name, value) {
  if (typeof value === 'undefined') {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}

test('Expo config derives the native iOS Google URL scheme from the configured client ID', () => {
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID = '1234567890-iosclient.apps.googleusercontent.com';
  delete process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME;

  const config = loadAppConfig();

  expect(config.extra.googleAuth.iosClientId).toBe(
    '1234567890-iosclient.apps.googleusercontent.com',
  );
  expect(config.extra.googleAuth.iosUrlScheme).toBe(
    'com.googleusercontent.apps.1234567890-iosclient',
  );
  expect(config.scheme).toEqual(
    expect.arrayContaining(['dailymealapp', 'com.googleusercontent.apps.1234567890-iosclient']),
  );
});

test('Expo config allows overriding the native iOS Google URL scheme', () => {
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID = '1234567890-iosclient.apps.googleusercontent.com';
  process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME = 'com.googleusercontent.apps.override';

  const config = loadAppConfig();

  expect(config.extra.googleAuth.iosUrlScheme).toBe('com.googleusercontent.apps.override');
  expect(config.scheme).toEqual(
    expect.arrayContaining(['dailymealapp', 'com.googleusercontent.apps.override']),
  );
});

test('Expo config can read Android client IDs from public environment', () => {
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID =
    '1234567890-androidclient.apps.googleusercontent.com';

  const config = loadAppConfig();

  expect(config.extra.googleAuth.androidClientId).toBe(
    '1234567890-androidclient.apps.googleusercontent.com',
  );
});

