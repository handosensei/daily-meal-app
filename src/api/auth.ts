type LoginRequest = {
  email: string;
  password: string;
};

type GoogleLoginRequest = {
  idToken: string;
};

export type LoginResponse = {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
};

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid email or password');
    this.name = 'InvalidCredentialsError';
  }
}

const DEFAULT_API_BASE_URL = 'http://localhost:3000';

function getApiBaseUrl() {
  const configuredUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, '');
  }

  return DEFAULT_API_BASE_URL;
}

async function postAuthRequest<TPayload>(path: '/auth/login' | '/auth/google', payload: TPayload) {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (response.status === 400 || response.status === 401) {
    throw new InvalidCredentialsError();
  }

  if (!response.ok) {
    throw new Error('Unable to sign in');
  }

  return (await response.json()) as LoginResponse;
}

export function loginWithPassword(credentials: LoginRequest) {
  return postAuthRequest('/auth/login', credentials);
}

export function loginWithGoogle(payload: GoogleLoginRequest) {
  return postAuthRequest('/auth/google', payload);
}
