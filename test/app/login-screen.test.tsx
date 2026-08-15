import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

import LoginScreen from '@/app/index';
import { InvalidCredentialsError, loginWithGoogle, loginWithPassword } from '@/api/auth';
import { requestGoogleIdToken } from '@/api/googleIdentity';

jest.mock('@/api/auth', () => {
  const actual = jest.requireActual('@/api/auth');
  return {
    ...actual,
    loginWithGoogle: jest.fn(),
    loginWithPassword: jest.fn(),
  };
});

jest.mock('@/api/googleIdentity', () => ({
  requestGoogleIdToken: jest.fn(),
}));

const loginWithPasswordMock = loginWithPassword as jest.Mock;
const loginWithGoogleMock = loginWithGoogle as jest.Mock;
const requestGoogleIdTokenMock = requestGoogleIdToken as jest.Mock;

afterEach(() => {
  jest.clearAllMocks();
});

test('renders the login form with default credentials and actions', async () => {
  const result = await render(<LoginScreen />);

  expect(screen.getByText('DailyMeal')).toBeOnTheScreen();
  expect(screen.getByLabelText('E-mail')).toHaveProp('value', 'sam@foyer.fr');
  expect(screen.getByLabelText('Mot de passe')).toHaveProp('value', 'password');
  expect(screen.getByText('Se connecter')).toBeOnTheScreen();
  expect(screen.getByText('Continuer avec Google')).toBeOnTheScreen();
  expect(screen.getByText("S'inscrire")).toBeOnTheScreen();

  const pressedStyles = result.root
    ?.findAll((node) => typeof node.props.style === 'function')
    .map((node) => node.props.style({ pressed: true }));
  expect(pressedStyles?.length).toBeGreaterThanOrEqual(2);
});

test('submits trimmed password credentials and shows the connected interface', async () => {
  loginWithPasswordMock.mockResolvedValue({ accessToken: 'token', tokenType: 'Bearer', expiresIn: 3600 });
  await render(<LoginScreen />);

  fireEvent.changeText(screen.getByLabelText('E-mail'), '  sam@foyer.fr  ');
  fireEvent.changeText(screen.getByLabelText('Mot de passe'), 'secret');
  fireEvent.press(screen.getByText('Se connecter'));

  await waitFor(() =>
    expect(loginWithPasswordMock).toHaveBeenCalledWith({
      email: 'sam@foyer.fr',
      password: 'secret',
    }),
  );
  expect(await screen.findByText('Vous êtes connecté.')).toBeOnTheScreen();
});

test('shows the invalid credentials message for password authentication failures', async () => {
  loginWithPasswordMock.mockRejectedValue(new InvalidCredentialsError());
  await render(<LoginScreen />);

  fireEvent.press(screen.getByText('Se connecter'));

  expect(await screen.findByText("L'email ou le mot de passe est incorrect.")).toBeOnTheScreen();
});

test('shows a generic password error for unexpected failures', async () => {
  loginWithPasswordMock.mockRejectedValue(new Error('network'));
  await render(<LoginScreen />);

  fireEvent.press(screen.getByText('Se connecter'));

  expect(await screen.findByText('Connexion impossible pour le moment.')).toBeOnTheScreen();
});

test('submits Google ID tokens and shows the connected interface', async () => {
  requestGoogleIdTokenMock.mockResolvedValue('google-token');
  loginWithGoogleMock.mockResolvedValue({ accessToken: 'token', tokenType: 'Bearer', expiresIn: 3600 });
  await render(<LoginScreen />);

  fireEvent.press(screen.getByText('Continuer avec Google'));

  await waitFor(() => expect(loginWithGoogleMock).toHaveBeenCalledWith({ idToken: 'google-token' }));
  expect(await screen.findByText('Vous êtes connecté.')).toBeOnTheScreen();
});

test('shows a Google-specific error when Google authentication fails', async () => {
  requestGoogleIdTokenMock.mockRejectedValue(new Error('popup blocked'));
  await render(<LoginScreen />);

  fireEvent.press(screen.getByText('Continuer avec Google'));

  expect(await screen.findByText('Connexion Google impossible pour le moment.')).toBeOnTheScreen();
});
