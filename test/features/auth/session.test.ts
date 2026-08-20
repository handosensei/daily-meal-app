import { clearAuthSession, getAuthSession, setAuthSession } from '@/features/auth/session';

afterEach(() => {
  clearAuthSession();
});

test('stores and clears the authenticated session', () => {
  setAuthSession({
    accessToken: 'access-token',
    tokenType: 'Bearer',
    expiresIn: 3600,
    emailVerified: true,
  });

  expect(getAuthSession()).toEqual({
    accessToken: 'access-token',
    emailVerified: true,
  });

  clearAuthSession();

  expect(getAuthSession()).toBeNull();
});

test('stores missing email verification as false', () => {
  setAuthSession({
    accessToken: 'access-token',
    tokenType: 'Bearer',
    expiresIn: 3600,
  });

  expect(getAuthSession()).toEqual({
    accessToken: 'access-token',
    emailVerified: false,
  });
});
