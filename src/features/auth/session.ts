import type { LoginResponse } from '@/api/auth';

type AuthSession = {
  accessToken: string;
  emailVerified: boolean;
};

let authSession: AuthSession | null = null;

export function setAuthSession(loginResponse: LoginResponse) {
  authSession = {
    accessToken: loginResponse.accessToken,
    emailVerified: loginResponse.emailVerified === true,
  };
}

export function getAuthSession() {
  return authSession;
}

export function clearAuthSession() {
  authSession = null;
}
