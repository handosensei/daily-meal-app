import { Platform } from 'react-native';

import {
  InvalidCredentialsError,
  loginWithGoogle,
  loginWithPassword,
} from '@/api/auth';

const originalFetch = global.fetch;
const originalEnv = process.env.EXPO_PUBLIC_API_BASE_URL;
const originalWindow = global.window;
const originalPlatform = Platform.OS;

function mockFetch(status: number, body = { accessToken: 'token', tokenType: 'Bearer', expiresIn: 3600 }) {
  const fetchMock = jest.fn(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
    }),
  );

  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

function setPlatform(os: typeof Platform.OS) {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: os });
}

afterEach(() => {
  global.fetch = originalFetch;
  process.env.EXPO_PUBLIC_API_BASE_URL = originalEnv;
  global.window = originalWindow;
  setPlatform(originalPlatform);
  jest.clearAllMocks();
});

test('posts password credentials to the configured API base URL', async () => {
  process.env.EXPO_PUBLIC_API_BASE_URL = ' https://api.dailymeal.test/ ';
  const fetchMock = mockFetch(200);

  await expect(
    loginWithPassword({ email: 'sam@foyer.fr', password: 'password' }),
  ).resolves.toEqual({ accessToken: 'token', tokenType: 'Bearer', expiresIn: 3600 });

  expect(fetchMock).toHaveBeenCalledWith('https://api.dailymeal.test/auth/login', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: 'sam@foyer.fr', password: 'password' }),
  });
});

test('posts Google ID tokens with the web origin when no API URL is configured', async () => {
  delete process.env.EXPO_PUBLIC_API_BASE_URL;
  setPlatform('web');
  global.window = {
    location: { origin: 'https://app.dailymeal.test/' },
  } as Window & typeof globalThis;
  const fetchMock = mockFetch(200);

  await loginWithGoogle({ idToken: 'id-token' });

  expect(fetchMock).toHaveBeenCalledWith(
    'https://app.dailymeal.test/auth/google',
    expect.objectContaining({
      body: JSON.stringify({ idToken: 'id-token' }),
    }),
  );
});

test.each([400, 401])('maps status %i to invalid credentials', async (status) => {
  delete process.env.EXPO_PUBLIC_API_BASE_URL;
  mockFetch(status);

  await expect(loginWithPassword({ email: 'bad', password: 'bad' })).rejects.toBeInstanceOf(
    InvalidCredentialsError,
  );
});

test('maps other failed responses to a generic sign-in error', async () => {
  mockFetch(503);

  await expect(loginWithGoogle({ idToken: 'id-token' })).rejects.toThrow('Unable to sign in');
});
