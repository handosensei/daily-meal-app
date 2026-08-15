/**
 * @jest-environment jsdom
 */

const originalClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

afterEach(() => {
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID = originalClientId;
  document.head.innerHTML = '';
  delete window.google;
  jest.resetModules();
});

test('web Google identity requires a configured client ID', async () => {
  delete process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
  const { requestGoogleIdToken } = require('@/api/googleIdentity.web');

  await expect(requestGoogleIdToken()).rejects.toThrow('Google client is not configured');
});

test('web Google identity resolves an ID token from Google accounts', async () => {
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID = ' client-id ';
  window.google = {
    accounts: {
      id: {
        initialize: jest.fn(({ callback }) => callback({ credential: 'credential-token' })),
        prompt: jest.fn(),
      },
    },
  };
  const { requestGoogleIdToken } = require('@/api/googleIdentity.web');

  await expect(requestGoogleIdToken()).resolves.toBe('credential-token');
  expect(window.google.accounts.id.initialize).toHaveBeenCalledWith(
    expect.objectContaining({ client_id: 'client-id' }),
  );
});

test('web Google identity ignores a displayed prompt when the credential succeeds', async () => {
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID = 'client-id';
  window.google = {
    accounts: {
      id: {
        initialize: jest.fn(({ callback }) => callback({ credential: 'credential-token' })),
        prompt: jest.fn((callback) =>
          callback?.({
            isNotDisplayed: () => false,
            isSkippedMoment: () => false,
          }),
        ),
      },
    },
  };
  const { requestGoogleIdToken } = require('@/api/googleIdentity.web');

  await expect(requestGoogleIdToken()).resolves.toBe('credential-token');
});

test('web Google identity injects the GIS script once and handles prompt failures', async () => {
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID = 'client-id';
  const { requestGoogleIdToken } = require('@/api/googleIdentity.web');
  const promise = requestGoogleIdToken();
  const script = document.getElementById('google-identity-services') as HTMLScriptElement;

  expect(script.src).toBe('https://accounts.google.com/gsi/client');

  window.google = {
    accounts: {
      id: {
        initialize: jest.fn(({ callback }) => callback({})),
        prompt: jest.fn((callback) =>
          callback?.({
            isNotDisplayed: () => true,
            isSkippedMoment: () => false,
          }),
        ),
      },
    },
  };
  script.dispatchEvent(new Event('load'));

  await expect(promise).rejects.toThrow('Google sign in failed');
});

test('web Google identity rejects when the Google prompt is skipped', async () => {
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID = 'client-id';
  window.google = {
    accounts: {
      id: {
        initialize: jest.fn(({ callback }) => callback({})),
        prompt: jest.fn((callback) =>
          callback?.({
            isNotDisplayed: () => false,
            isSkippedMoment: () => true,
          }),
        ),
      },
    },
  };
  const { requestGoogleIdToken } = require('@/api/googleIdentity.web');

  await expect(requestGoogleIdToken()).rejects.toThrow('Google sign in failed');
});

test('web Google identity rejects when an existing GIS script fails to load', async () => {
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID = 'client-id';
  const script = document.createElement('script');
  script.id = 'google-identity-services';
  document.head.appendChild(script);
  const { requestGoogleIdToken } = require('@/api/googleIdentity.web');
  const promise = requestGoogleIdToken();

  script.dispatchEvent(new Event('error'));

  await expect(promise).rejects.toThrow('Google unavailable');
});

test('web Google identity can continue when an existing GIS script loads successfully', async () => {
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID = 'client-id';
  const script = document.createElement('script');
  script.id = 'google-identity-services';
  document.head.appendChild(script);
  const { requestGoogleIdToken } = require('@/api/googleIdentity.web');
  const promise = requestGoogleIdToken();

  window.google = {
    accounts: {
      id: {
        initialize: jest.fn(({ callback }) => callback({ credential: 'credential-token' })),
        prompt: jest.fn(),
      },
    },
  };
  script.dispatchEvent(new Event('load'));

  await expect(promise).resolves.toBe('credential-token');
});

test('web Google identity rejects when a newly injected GIS script fails', async () => {
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID = 'client-id';
  const { requestGoogleIdToken } = require('@/api/googleIdentity.web');
  const promise = requestGoogleIdToken();
  const script = document.getElementById('google-identity-services') as HTMLScriptElement;

  script.dispatchEvent(new Event('error'));

  await expect(promise).rejects.toThrow('Google unavailable');
});
