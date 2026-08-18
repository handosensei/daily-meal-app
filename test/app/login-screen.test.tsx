import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

import LoginScreen from '@/app/index';
import {
  EmailAlreadyExistsError,
  InvalidCredentialsError,
  loginWithGoogle,
  loginWithPassword,
  registerUser,
} from '@/api/auth';
import { requestGoogleIdToken } from '@/api/googleIdentity';

jest.mock('@/api/auth', () => {
  const actual = jest.requireActual('@/api/auth');
  return {
    ...actual,
    loginWithGoogle: jest.fn(),
    loginWithPassword: jest.fn(),
    registerUser: jest.fn(),
  };
});

jest.mock('@/api/googleIdentity', () => ({
  requestGoogleIdToken: jest.fn(),
}));

const loginWithPasswordMock = loginWithPassword as jest.Mock;
const loginWithGoogleMock = loginWithGoogle as jest.Mock;
const registerUserMock = registerUser as jest.Mock;
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

test('submits trimmed password credentials and shows the groups page', async () => {
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
  expect(await screen.findByText('Mes groupes')).toBeOnTheScreen();
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

test('submits Google ID tokens and shows the groups page', async () => {
  requestGoogleIdTokenMock.mockResolvedValue('google-token');
  loginWithGoogleMock.mockResolvedValue({ accessToken: 'token', tokenType: 'Bearer', expiresIn: 3600 });
  await render(<LoginScreen />);

  fireEvent.press(screen.getByText('Continuer avec Google'));

  await waitFor(() => expect(loginWithGoogleMock).toHaveBeenCalledWith({ idToken: 'google-token' }));
  expect(await screen.findByText('Mes groupes')).toBeOnTheScreen();
});

test('shows a Google-specific error when Google authentication fails', async () => {
  requestGoogleIdTokenMock.mockRejectedValue(new Error('popup blocked'));
  await render(<LoginScreen />);

  fireEvent.press(screen.getByText('Continuer avec Google'));

  expect(await screen.findByText('Connexion Google impossible pour le moment.')).toBeOnTheScreen();
});

test('opens the registration form from the login screen', async () => {
  const result = await render(<LoginScreen />);

  fireEvent.press(screen.getByText("S'inscrire"));

  expect(screen.getByText('Inscription')).toBeOnTheScreen();
  expect(screen.getByText('Créer un compte')).toBeOnTheScreen();
  expect(screen.getByText('On fait connaissance ?')).toBeOnTheScreen();
  expect(screen.getByLabelText('Nom')).toBeOnTheScreen();
  expect(screen.getByLabelText('Prénom')).toHaveProp('value', 'Sam');
  expect(screen.getByLabelText("E-mail d'inscription")).toHaveProp('value', 'sam@foyer.fr');
  expect(screen.getByText(/Ensuite :/)).toBeOnTheScreen();

  const signupPressedStyles = result.root
    ?.findAll((node) => typeof node.props.style === 'function')
    .map((node) => [node.props.style({ pressed: false }), node.props.style({ pressed: true })]);
  expect(signupPressedStyles?.length).toBeGreaterThanOrEqual(2);
});

test('returns from registration to login', async () => {
  await render(<LoginScreen />);

  fireEvent.press(screen.getByText("S'inscrire"));
  fireEvent.press(screen.getByLabelText('Retour à la connexion'));

  expect(screen.getByText('DailyMeal')).toBeOnTheScreen();
  expect(screen.getByText('Se connecter')).toBeOnTheScreen();
});

test.each([
  ['Nom', 'Sa', 'Le nom doit contenir au moins 3 caractères.'],
  ['Prénom', 'Al', 'Le prénom doit contenir au moins 3 caractères.'],
] as const)('validates minimum length for %s during registration', async (fieldLabel, value, message) => {
  await render(<LoginScreen />);

  fireEvent.press(screen.getByText("S'inscrire"));
  fireEvent.changeText(screen.getByLabelText('Nom'), 'Durand');
  fireEvent.changeText(screen.getByLabelText('Prénom'), 'Alex');
  fireEvent.changeText(screen.getByLabelText(fieldLabel), value);
  fireEvent.changeText(screen.getByLabelText("E-mail d'inscription"), 'sam@foyer.fr');
  fireEvent.changeText(screen.getByLabelText("Mot de passe d'inscription"), 'password');
  fireEvent.press(screen.getByText('Continuer'));

  expect(await screen.findByText(message)).toBeOnTheScreen();
  expect(registerUserMock).not.toHaveBeenCalled();
});

test('validates registration email format', async () => {
  await render(<LoginScreen />);

  fireEvent.press(screen.getByText("S'inscrire"));
  fireEvent.changeText(screen.getByLabelText('Nom'), 'Durand');
  fireEvent.changeText(screen.getByLabelText('Prénom'), 'Alex');
  fireEvent.changeText(screen.getByLabelText("E-mail d'inscription"), 'sam');
  fireEvent.changeText(screen.getByLabelText("Mot de passe d'inscription"), 'password');
  fireEvent.press(screen.getByText('Continuer'));

  expect(await screen.findByText('Saisissez une adresse e-mail valide.')).toBeOnTheScreen();
  expect(registerUserMock).not.toHaveBeenCalled();
});

test('validates registration password policy', async () => {
  await render(<LoginScreen />);

  fireEvent.press(screen.getByText("S'inscrire"));
  fireEvent.changeText(screen.getByLabelText('Nom'), 'Durand');
  fireEvent.changeText(screen.getByLabelText('Prénom'), 'Alex');
  fireEvent.changeText(screen.getByLabelText("E-mail d'inscription"), 'sam@foyer.fr');
  fireEvent.changeText(screen.getByLabelText("Mot de passe d'inscription"), 'short');
  fireEvent.press(screen.getByText('Continuer'));

  expect(await screen.findByText('Le mot de passe doit contenir au moins 8 caractères.')).toBeOnTheScreen();
  expect(registerUserMock).not.toHaveBeenCalled();
});

test('submits registration details and shows the groups page', async () => {
  registerUserMock.mockResolvedValue({ id: 'user-id' });
  await render(<LoginScreen />);

  fireEvent.press(screen.getByText("S'inscrire"));
  fireEvent.changeText(screen.getByLabelText('Nom'), '  Durand  ');
  fireEvent.changeText(screen.getByLabelText('Prénom'), '  Alex  ');
  fireEvent.changeText(screen.getByLabelText("E-mail d'inscription"), '  alex@foyer.fr  ');
  fireEvent.changeText(screen.getByLabelText("Mot de passe d'inscription"), 'password');
  fireEvent.press(screen.getByText('Continuer'));

  await waitFor(() =>
    expect(registerUserMock).toHaveBeenCalledWith({
      lastname: 'Durand',
      firstname: 'Alex',
      email: 'alex@foyer.fr',
      password: 'password',
    }),
  );
  expect(await screen.findByText('Mes groupes')).toBeOnTheScreen();
});

test('shows a duplicate email message during registration', async () => {
  registerUserMock.mockRejectedValue(new EmailAlreadyExistsError());
  await render(<LoginScreen />);

  fireEvent.press(screen.getByText("S'inscrire"));
  fireEvent.changeText(screen.getByLabelText('Nom'), 'Durand');
  fireEvent.changeText(screen.getByLabelText('Prénom'), 'Alex');
  fireEvent.changeText(screen.getByLabelText("E-mail d'inscription"), 'alex@foyer.fr');
  fireEvent.changeText(screen.getByLabelText("Mot de passe d'inscription"), 'password');
  fireEvent.press(screen.getByText('Continuer'));

  expect(await screen.findByText('Cette adresse e-mail est déjà utilisée.')).toBeOnTheScreen();
});

test('shows a generic registration message for unexpected failures', async () => {
  registerUserMock.mockRejectedValue(new Error('offline'));
  await render(<LoginScreen />);

  fireEvent.press(screen.getByText("S'inscrire"));
  fireEvent.changeText(screen.getByLabelText('Nom'), 'Durand');
  fireEvent.changeText(screen.getByLabelText('Prénom'), 'Alex');
  fireEvent.changeText(screen.getByLabelText("E-mail d'inscription"), 'alex@foyer.fr');
  fireEvent.changeText(screen.getByLabelText("Mot de passe d'inscription"), 'password');
  fireEvent.press(screen.getByText('Continuer'));

  expect(await screen.findByText('Inscription impossible pour le moment.')).toBeOnTheScreen();
});
