import {
  EmailAlreadyExistsError,
  InvalidCredentialsError,
  loginWithGoogle,
  loginWithPassword,
  registerUser,
} from '@/api/auth';

const originalFetch = global.fetch;
const originalEnv = process.env.EXPO_PUBLIC_API_BASE_URL;

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

afterEach(() => {
  global.fetch = originalFetch;
  process.env.EXPO_PUBLIC_API_BASE_URL = originalEnv;
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

test('posts Google ID tokens to the default API base URL when no API URL is configured', async () => {
  delete process.env.EXPO_PUBLIC_API_BASE_URL;
  const fetchMock = mockFetch(200);

  await loginWithGoogle({ idToken: 'id-token' });

  expect(fetchMock).toHaveBeenCalledWith(
    'http://localhost:3000/auth/google',
    expect.objectContaining({
      body: JSON.stringify({ idToken: 'id-token' }),
    }),
  );
});

test('posts registration details with password confirmation', async () => {
  process.env.EXPO_PUBLIC_API_BASE_URL = 'https://api.dailymeal.test';
  const fetchMock = mockFetch(201, {
    id: 'user-id',
    lastname: 'Dupont',
    firstname: 'Sam',
    email: 'sam@foyer.fr',
    provider: null,
    emailVerified: false,
    createdAt: '2026-08-18T10:00:00.000Z',
    lastLogin: null,
  });

  await registerUser({
    lastname: 'Dupont',
    firstname: 'Sam',
    email: 'sam@foyer.fr',
    password: 'password',
  });

  expect(fetchMock).toHaveBeenCalledWith('https://api.dailymeal.test/users', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      lastname: 'Dupont',
      firstname: 'Sam',
      email: 'sam@foyer.fr',
      password: 'password',
      passwordConfirmation: 'password',
    }),
  });
});

test.each([400, 401])('maps status %i to invalid credentials', async (status) => {
  delete process.env.EXPO_PUBLIC_API_BASE_URL;
  mockFetch(status);

  await expect(loginWithPassword({ email: 'bad', password: 'bad' })).rejects.toBeInstanceOf(
    InvalidCredentialsError,
  );
});

test('maps duplicate registration emails to a dedicated error', async () => {
  mockFetch(409);

  await expect(
    registerUser({
      lastname: 'Dupont',
      firstname: 'Sam',
      email: 'sam@foyer.fr',
      password: 'password',
    }),
  ).rejects.toBeInstanceOf(EmailAlreadyExistsError);
});

test('maps other failed responses to a generic sign-in error', async () => {
  mockFetch(503);

  await expect(loginWithGoogle({ idToken: 'id-token' })).rejects.toThrow('Unable to sign in');
});
