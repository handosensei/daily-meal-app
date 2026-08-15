const appJson = require('./app.json');

const GOOGLE_CLIENT_SUFFIX = '.apps.googleusercontent.com';

function toIosGoogleUrlScheme(clientId) {
  if (!clientId || !clientId.endsWith(GOOGLE_CLIENT_SUFFIX)) {
    return undefined;
  }

  return `com.googleusercontent.apps.${clientId.slice(0, -GOOGLE_CLIENT_SUFFIX.length)}`;
}

function uniqueValues(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

module.exports = () => {
  const baseConfig = appJson.expo;
  const baseGoogleAuth = baseConfig.extra?.googleAuth ?? {};
  const iosClientId =
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() || baseGoogleAuth.iosClientId;
  const androidClientId =
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() || baseGoogleAuth.androidClientId;
  const iosUrlScheme =
    process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME?.trim() || toIosGoogleUrlScheme(iosClientId);
  const baseSchemes = Array.isArray(baseConfig.scheme) ? baseConfig.scheme : [baseConfig.scheme];

  return {
    ...baseConfig,
    scheme: uniqueValues([...baseSchemes, iosUrlScheme]),
    extra: {
      ...baseConfig.extra,
      googleAuth: {
        ...baseGoogleAuth,
        iosClientId,
        androidClientId,
        iosUrlScheme,
      },
    },
  };
};

