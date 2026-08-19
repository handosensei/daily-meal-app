import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

import {
  EmailAlreadyExistsError,
  InvalidCredentialsError,
  loginWithGoogle,
  loginWithPassword,
  registerUser,
} from '@/api/auth';
import GroupsRoute from '@/app/groups';
import IndexRoute from '@/app/index';
import LoginRoute from '@/app/login';
import SignupRoute from '@/app/signup';
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
const expoRouterMock = jest.requireMock('expo-router') as {
  __resetRouter: () => void;
  __router: {
    push: jest.Mock;
    replace: jest.Mock;
  };
  __setLocalSearchParams: (params: Record<string, string | undefined>) => void;
};
const groupActionLabel = 'Créer ou rejoindre un groupe';

afterEach(() => {
  expoRouterMock.__resetRouter();
  jest.clearAllMocks();
});

test('redirects the index route to the login page', async () => {
  await render(<IndexRoute />);

  expect(screen.getByTestId('redirect')).toHaveProp('href', '/login');
});

test('renders the login page with default credentials and actions', async () => {
  const result = await render(<LoginRoute />);

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

test('submits trimmed password credentials and routes to verified groups', async () => {
  loginWithPasswordMock.mockResolvedValue({
    accessToken: 'token',
    tokenType: 'Bearer',
    expiresIn: 3600,
    emailVerified: true,
  });
  await render(<LoginRoute />);

  fireEvent.changeText(screen.getByLabelText('E-mail'), '  sam@foyer.fr  ');
  fireEvent.changeText(screen.getByLabelText('Mot de passe'), 'secret');
  fireEvent.press(screen.getByText('Se connecter'));

  await waitFor(() =>
    expect(loginWithPasswordMock).toHaveBeenCalledWith({
      email: 'sam@foyer.fr',
      password: 'secret',
    }),
  );
  expect(expoRouterMock.__router.replace).toHaveBeenCalledWith({
    pathname: '/groups',
    params: { emailVerified: 'true' },
  });
});

test('routes password authentication to unverified groups when email is not verified', async () => {
  loginWithPasswordMock.mockResolvedValue({
    accessToken: 'token',
    tokenType: 'Bearer',
    expiresIn: 3600,
    emailVerified: false,
  });
  await render(<LoginRoute />);

  fireEvent.press(screen.getByText('Se connecter'));

  await waitFor(() =>
    expect(expoRouterMock.__router.replace).toHaveBeenCalledWith({
      pathname: '/groups',
      params: { emailVerified: 'false' },
    }),
  );
});

test('shows the invalid credentials message for password authentication failures', async () => {
  loginWithPasswordMock.mockRejectedValue(new InvalidCredentialsError());
  await render(<LoginRoute />);

  fireEvent.press(screen.getByText('Se connecter'));

  expect(await screen.findByText("L'email ou le mot de passe est incorrect.")).toBeOnTheScreen();
});

test('shows a generic password error for unexpected failures', async () => {
  loginWithPasswordMock.mockRejectedValue(new Error('network'));
  await render(<LoginRoute />);

  fireEvent.press(screen.getByText('Se connecter'));

  expect(await screen.findByText('Connexion impossible pour le moment.')).toBeOnTheScreen();
});

test('submits Google ID tokens and routes to the groups page', async () => {
  requestGoogleIdTokenMock.mockResolvedValue('google-token');
  loginWithGoogleMock.mockResolvedValue({ accessToken: 'token', tokenType: 'Bearer', expiresIn: 3600 });
  await render(<LoginRoute />);

  fireEvent.press(screen.getByText('Continuer avec Google'));

  await waitFor(() => expect(loginWithGoogleMock).toHaveBeenCalledWith({ idToken: 'google-token' }));
  expect(expoRouterMock.__router.replace).toHaveBeenCalledWith({
    pathname: '/groups',
    params: { emailVerified: 'false' },
  });
});

test('shows a Google-specific error when Google authentication fails', async () => {
  requestGoogleIdTokenMock.mockRejectedValue(new Error('popup blocked'));
  await render(<LoginRoute />);

  fireEvent.press(screen.getByText('Continuer avec Google'));

  expect(await screen.findByText('Connexion Google impossible pour le moment.')).toBeOnTheScreen();
});

test('opens the registration page from the login page', async () => {
  await render(<LoginRoute />);

  fireEvent.press(screen.getByText("S'inscrire"));

  expect(expoRouterMock.__router.push).toHaveBeenCalledWith('/signup');
});

test('renders the registration page', async () => {
  const result = await render(<SignupRoute />);

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
  await render(<SignupRoute />);

  fireEvent.press(screen.getByLabelText('Retour à la connexion'));

  expect(expoRouterMock.__router.replace).toHaveBeenCalledWith('/login');
});

test.each([
  ['Nom', 'Sa', 'Le nom doit contenir au moins 3 caractères.'],
  ['Prénom', 'Al', 'Le prénom doit contenir au moins 3 caractères.'],
] as const)('validates minimum length for %s during registration', async (fieldLabel, value, message) => {
  await render(<SignupRoute />);

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
  await render(<SignupRoute />);

  fireEvent.changeText(screen.getByLabelText('Nom'), 'Durand');
  fireEvent.changeText(screen.getByLabelText('Prénom'), 'Alex');
  fireEvent.changeText(screen.getByLabelText("E-mail d'inscription"), 'sam');
  fireEvent.changeText(screen.getByLabelText("Mot de passe d'inscription"), 'password');
  fireEvent.press(screen.getByText('Continuer'));

  expect(await screen.findByText('Saisissez une adresse e-mail valide.')).toBeOnTheScreen();
  expect(registerUserMock).not.toHaveBeenCalled();
});

test('validates registration password policy', async () => {
  await render(<SignupRoute />);

  fireEvent.changeText(screen.getByLabelText('Nom'), 'Durand');
  fireEvent.changeText(screen.getByLabelText('Prénom'), 'Alex');
  fireEvent.changeText(screen.getByLabelText("E-mail d'inscription"), 'sam@foyer.fr');
  fireEvent.changeText(screen.getByLabelText("Mot de passe d'inscription"), 'short');
  fireEvent.press(screen.getByText('Continuer'));

  expect(await screen.findByText('Le mot de passe doit contenir au moins 8 caractères.')).toBeOnTheScreen();
  expect(registerUserMock).not.toHaveBeenCalled();
});

test('submits registration details and routes to the groups page', async () => {
  registerUserMock.mockResolvedValue({
    id: 'user-id',
    lastname: 'Durand',
    firstname: 'Alex',
    email: 'alex@foyer.fr',
    provider: null,
    emailVerified: false,
    createdAt: '2026-08-19T07:30:00.000Z',
    lastLogin: null,
  });
  await render(<SignupRoute />);

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
  expect(expoRouterMock.__router.replace).toHaveBeenCalledWith({
    pathname: '/groups',
    params: { emailVerified: 'false' },
  });
});

test('shows a duplicate email message during registration', async () => {
  registerUserMock.mockRejectedValue(new EmailAlreadyExistsError());
  await render(<SignupRoute />);

  fireEvent.changeText(screen.getByLabelText('Nom'), 'Durand');
  fireEvent.changeText(screen.getByLabelText('Prénom'), 'Alex');
  fireEvent.changeText(screen.getByLabelText("E-mail d'inscription"), 'alex@foyer.fr');
  fireEvent.changeText(screen.getByLabelText("Mot de passe d'inscription"), 'password');
  fireEvent.press(screen.getByText('Continuer'));

  expect(await screen.findByText('Cette adresse e-mail est déjà utilisée.')).toBeOnTheScreen();
});

test('shows a generic registration message for unexpected failures', async () => {
  registerUserMock.mockRejectedValue(new Error('offline'));
  await render(<SignupRoute />);

  fireEvent.changeText(screen.getByLabelText('Nom'), 'Durand');
  fireEvent.changeText(screen.getByLabelText('Prénom'), 'Alex');
  fireEvent.changeText(screen.getByLabelText("E-mail d'inscription"), 'alex@foyer.fr');
  fireEvent.changeText(screen.getByLabelText("Mot de passe d'inscription"), 'password');
  fireEvent.press(screen.getByText('Continuer'));

  expect(await screen.findByText('Inscription impossible pour le moment.')).toBeOnTheScreen();
});

test('shows the group action on the groups page when email is verified', async () => {
  expoRouterMock.__setLocalSearchParams({ emailVerified: 'true' });
  const result = await render(<GroupsRoute />);

  expect(screen.getByText('Mes groupes')).toBeOnTheScreen();
  expect(screen.getByText(groupActionLabel)).toBeOnTheScreen();
  const connectedPressedStyles = result.root
    ?.findAll((node) => typeof node.props.style === 'function')
    .map((node) => [node.props.style({ pressed: false }), node.props.style({ pressed: true })]);
  expect(connectedPressedStyles?.length).toBeGreaterThanOrEqual(1);
  fireEvent.press(screen.getByText(groupActionLabel));
});

test('hides the group action on the groups page when email is not verified', async () => {
  expoRouterMock.__setLocalSearchParams({ emailVerified: 'false' });
  await render(<GroupsRoute />);

  expect(screen.getByText('Mes groupes')).toBeOnTheScreen();
  expect(screen.queryByText(groupActionLabel)).not.toBeOnTheScreen();
});
