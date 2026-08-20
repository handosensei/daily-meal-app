import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

import {
  EmailAlreadyExistsError,
  InvalidCredentialsError,
  loginWithGoogle,
  loginWithPassword,
  registerUser,
} from '@/api/auth';
import { getGroup, GroupsAuthenticationError, listMyGroups } from '@/api/groups';
import GroupsRoute from '@/app/groups';
import IndexRoute from '@/app/index';
import LoginRoute from '@/app/login';
import SignupRoute from '@/app/signup';
import { requestGoogleIdToken } from '@/api/googleIdentity';
import { clearAuthSession, getAuthSession, setAuthSession } from '@/features/auth/session';
import type { MeGroupResponse } from '@/api/groups';

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

jest.mock('@/api/groups', () => {
  const actual = jest.requireActual('@/api/groups');
  return {
    ...actual,
    getGroup: jest.fn(),
    listMyGroups: jest.fn(),
  };
});

const loginWithPasswordMock = loginWithPassword as jest.Mock;
const loginWithGoogleMock = loginWithGoogle as jest.Mock;
const registerUserMock = registerUser as jest.Mock;
const requestGoogleIdTokenMock = requestGoogleIdToken as jest.Mock;
const getGroupMock = getGroup as jest.Mock;
const listMyGroupsMock = listMyGroups as jest.Mock;
const expoRouterMock = jest.requireMock('expo-router') as {
  __resetRouter: () => void;
  __router: {
    push: jest.Mock;
    replace: jest.Mock;
  };
  __setLocalSearchParams: (params: Record<string, string | undefined>) => void;
};
const groupActionLabel = 'Créer ou rejoindre un groupe';
const groupsLoadingLabel = 'Chargement de vos groupes...';

afterEach(() => {
  clearAuthSession();
  expoRouterMock.__resetRouter();
  jest.clearAllMocks();
});

async function waitForGroupsToSettle() {
  await waitFor(() => expect(screen.queryByText(groupsLoadingLabel)).not.toBeOnTheScreen());
}

function createDeferred<T>() {
  let resolvePromise: (value: T) => void = () => undefined;
  let rejectPromise: (reason: unknown) => void = () => undefined;
  const promise = new Promise<T>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });

  return {
    promise,
    reject: rejectPromise,
    resolve: resolvePromise,
  };
}

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
  expect(getAuthSession()).toEqual({
    accessToken: 'token',
    emailVerified: true,
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
  expect(getAuthSession()).toEqual({
    accessToken: 'token',
    emailVerified: false,
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

test('shows a loading state while groups are being loaded', async () => {
  setAuthSession({
    accessToken: 'token',
    tokenType: 'Bearer',
    expiresIn: 3600,
    emailVerified: true,
  });
  listMyGroupsMock.mockImplementation(() => new Promise(() => undefined));

  await render(<GroupsRoute />);

  expect(screen.getByText(groupsLoadingLabel)).toBeOnTheScreen();
  expect(listMyGroupsMock).toHaveBeenCalledWith('token');
});

test('ignores loaded groups after the groups page unmounts', async () => {
  setAuthSession({
    accessToken: 'token',
    tokenType: 'Bearer',
    expiresIn: 3600,
    emailVerified: true,
  });
  const groupsRequest = createDeferred<MeGroupResponse[]>();
  listMyGroupsMock.mockReturnValue(groupsRequest.promise);
  const result = await render(<GroupsRoute />);

  result.unmount();

  await act(async () => {
    groupsRequest.resolve([]);
  });

  expect(listMyGroupsMock).toHaveBeenCalledWith('token');
});

test('ignores group loading errors after the groups page unmounts', async () => {
  setAuthSession({
    accessToken: 'token',
    tokenType: 'Bearer',
    expiresIn: 3600,
    emailVerified: true,
  });
  const groupsRequest = createDeferred<MeGroupResponse[]>();
  listMyGroupsMock.mockReturnValue(groupsRequest.promise);
  const result = await render(<GroupsRoute />);

  result.unmount();

  await act(async () => {
    groupsRequest.reject(new Error('offline'));
  });

  expect(listMyGroupsMock).toHaveBeenCalledWith('token');
});

test('shows authenticated user groups on the groups page', async () => {
  expoRouterMock.__setLocalSearchParams({ emailVerified: 'true' });
  setAuthSession({
    accessToken: 'token',
    tokenType: 'Bearer',
    expiresIn: 3600,
    emailVerified: true,
  });
  const groupsRequest = createDeferred<MeGroupResponse[]>();
  const groupDetailRequest = createDeferred<Awaited<ReturnType<typeof getGroup>>>();
  listMyGroupsMock.mockReturnValue(groupsRequest.promise);
  getGroupMock.mockReturnValue(groupDetailRequest.promise);
  const groups = [
    {
      id: 'home',
      name: 'Maison Perret',
      createdBy: 'sam',
      createdAt: '2026-08-19T08:00:00.000Z',
      membersCount: 4,
      role: 'admin',
    },
    {
      id: 'flatshare',
      name: 'Coloc Voltaire',
      createdBy: 'alex',
      createdAt: '2026-08-18T08:00:00.000Z',
      membersCount: 1,
      role: 'member',
    },
  ] satisfies MeGroupResponse[];
  const result = await render(<GroupsRoute />);

  await act(async () => {
    groupsRequest.resolve(groups);
  });

  expect(screen.getByText('Mes groupes')).toBeOnTheScreen();
  expect(await screen.findByText('Maison Perret')).toBeOnTheScreen();
  await waitForGroupsToSettle();
  expect(screen.getByText('Coloc Voltaire')).toBeOnTheScreen();
  expect(screen.getByText('Responsable')).toBeOnTheScreen();
  expect(screen.getByText('Membre')).toBeOnTheScreen();
  expect(screen.getByText('4 membres')).toBeOnTheScreen();
  expect(screen.getByText('1 membre')).toBeOnTheScreen();
  expect(screen.getByText(groupActionLabel)).toBeOnTheScreen();
  const connectedPressedStyles = result.root
    ?.findAll((node) => typeof node.props.style === 'function')
    .map((node) => [node.props.style({ pressed: false }), node.props.style({ pressed: true })]);
  expect(connectedPressedStyles?.length).toBeGreaterThanOrEqual(3);
  fireEvent.press(screen.getByText(groupActionLabel));
  fireEvent.press(screen.getByLabelText('Maison Perret, Responsable, 4 membres'));
  expect(getGroupMock).toHaveBeenCalledWith('token', 'home');
  expect(screen.getByLabelText('Retour à la liste des groupes')).toBeOnTheScreen();
  expect(screen.getByLabelText('Paramètres du groupe Maison Perret')).toBeOnTheScreen();
  expect(screen.getByText('Chargement du groupe...')).toBeOnTheScreen();

  await act(async () => {
    groupDetailRequest.resolve({
      id: 'home',
      name: 'Maison Perret',
      frequency: 'Planning à la semaine',
      membersCount: 4,
      role: 'admin',
      members: [
        { id: 'sam', firstName: 'Sam', lastName: 'Perret', role: 'admin' },
        { id: 'mo', firstName: 'Mo', lastName: 'Durand', role: 'member' },
        { id: 'lina', firstName: 'Lina', lastName: 'Martin', role: 'member' },
        { id: 'theo', firstName: 'Théo', lastName: 'Bernard', role: 'member' },
      ],
    });
  });

  expect(screen.getByText('Membres & rôles')).toBeOnTheScreen();
  expect(screen.getAllByText('Planning à la semaine').length).toBeGreaterThanOrEqual(2);
  expect(screen.getByText('Sam P.')).toBeOnTheScreen();
  expect(screen.getByText('Admin')).toBeOnTheScreen();
  expect(screen.getByText('Mo D.')).toBeOnTheScreen();
  expect(screen.getAllByText('Membre').length).toBeGreaterThanOrEqual(2);
  expect(screen.getByText('Inviter')).toBeOnTheScreen();
  const detailPressedStyles = result.root
    ?.findAll((node) => typeof node.props.style === 'function')
    .map((node) => [node.props.style({ pressed: false }), node.props.style({ pressed: true })]);
  expect(detailPressedStyles?.length).toBeGreaterThanOrEqual(3);
  fireEvent.press(screen.getByLabelText('Paramètres du groupe Maison Perret'));
  fireEvent.press(screen.getByLabelText('Inviter des membres dans Maison Perret'));
  fireEvent.press(screen.getByLabelText('Retour à la liste des groupes'));
  expect(screen.getByText('Coloc Voltaire')).toBeOnTheScreen();
});

test('shows a calm empty members state when a selected group has no members', async () => {
  expoRouterMock.__setLocalSearchParams({ emailVerified: 'true' });
  setAuthSession({
    accessToken: 'token',
    tokenType: 'Bearer',
    expiresIn: 3600,
    emailVerified: true,
  });
  const groupsRequest = createDeferred<MeGroupResponse[]>();
  const groupDetailRequest = createDeferred<Awaited<ReturnType<typeof getGroup>>>();
  listMyGroupsMock.mockReturnValue(groupsRequest.promise);
  getGroupMock.mockReturnValue(groupDetailRequest.promise);
  const groups = [
    {
      id: 'flatshare',
      name: 'Coloc Voltaire',
      createdBy: 'alex',
      createdAt: '2026-08-18T08:00:00.000Z',
      membersCount: 1,
      role: 'member',
    },
  ] satisfies MeGroupResponse[];
  await render(<GroupsRoute />);

  await act(async () => {
    groupsRequest.resolve(groups);
  });

  fireEvent.press(await screen.findByLabelText('Coloc Voltaire, Membre, 1 membre'));

  await act(async () => {
    groupDetailRequest.resolve({
      id: 'flatshare',
      name: 'Coloc Voltaire',
      frequency: 'Tous les quinze jours',
      membersCount: 0,
      role: 'member',
      members: [],
    });
  });

  expect(screen.getByText('Coloc Voltaire')).toBeOnTheScreen();
  expect(screen.getAllByText('Tous les quinze jours').length).toBeGreaterThanOrEqual(2);
  expect(screen.getByText('Aucun membre à afficher pour le moment.')).toBeOnTheScreen();
  expect(screen.getByText('Inviter')).toBeOnTheScreen();
});

test('shows an expired session message when the group detail API rejects authentication', async () => {
  expoRouterMock.__setLocalSearchParams({ emailVerified: 'true' });
  setAuthSession({
    accessToken: 'token',
    tokenType: 'Bearer',
    expiresIn: 3600,
    emailVerified: true,
  });
  const groupsRequest = createDeferred<MeGroupResponse[]>();
  const groupDetailRequest = createDeferred<Awaited<ReturnType<typeof getGroup>>>();
  listMyGroupsMock.mockReturnValue(groupsRequest.promise);
  getGroupMock.mockReturnValue(groupDetailRequest.promise);
  await render(<GroupsRoute />);

  await act(async () => {
    groupsRequest.resolve([
      {
        id: 'home',
        name: 'Maison Perret',
        createdBy: 'sam',
        createdAt: '2026-08-19T08:00:00.000Z',
        membersCount: 4,
        role: 'admin',
      },
    ] satisfies MeGroupResponse[]);
  });

  fireEvent.press(await screen.findByLabelText('Maison Perret, Responsable, 4 membres'));

  await act(async () => {
    groupDetailRequest.reject(new GroupsAuthenticationError());
  });

  expect(await screen.findByText('Votre session a expiré. Connectez-vous à nouveau.')).toBeOnTheScreen();
});

test('shows a generic message when loading group detail fails unexpectedly', async () => {
  expoRouterMock.__setLocalSearchParams({ emailVerified: 'true' });
  setAuthSession({
    accessToken: 'token',
    tokenType: 'Bearer',
    expiresIn: 3600,
    emailVerified: true,
  });
  const groupsRequest = createDeferred<MeGroupResponse[]>();
  const groupDetailRequest = createDeferred<Awaited<ReturnType<typeof getGroup>>>();
  listMyGroupsMock.mockReturnValue(groupsRequest.promise);
  getGroupMock.mockReturnValue(groupDetailRequest.promise);
  await render(<GroupsRoute />);

  await act(async () => {
    groupsRequest.resolve([
      {
        id: 'home',
        name: 'Maison Perret',
        createdBy: 'sam',
        createdAt: '2026-08-19T08:00:00.000Z',
        membersCount: 4,
        role: 'admin',
      },
    ] satisfies MeGroupResponse[]);
  });

  fireEvent.press(await screen.findByLabelText('Maison Perret, Responsable, 4 membres'));

  await act(async () => {
    groupDetailRequest.reject(new Error('offline'));
  });

  expect(await screen.findByText('Impossible de charger ce groupe pour le moment.')).toBeOnTheScreen();
});

test('ignores loaded group detail after returning to the groups list', async () => {
  expoRouterMock.__setLocalSearchParams({ emailVerified: 'true' });
  setAuthSession({
    accessToken: 'token',
    tokenType: 'Bearer',
    expiresIn: 3600,
    emailVerified: true,
  });
  const groupsRequest = createDeferred<MeGroupResponse[]>();
  const groupDetailRequest = createDeferred<Awaited<ReturnType<typeof getGroup>>>();
  listMyGroupsMock.mockReturnValue(groupsRequest.promise);
  getGroupMock.mockReturnValue(groupDetailRequest.promise);
  await render(<GroupsRoute />);

  await act(async () => {
    groupsRequest.resolve([
      {
        id: 'home',
        name: 'Maison Perret',
        createdBy: 'sam',
        createdAt: '2026-08-19T08:00:00.000Z',
        membersCount: 4,
        role: 'admin',
      },
    ] satisfies MeGroupResponse[]);
  });

  fireEvent.press(await screen.findByLabelText('Maison Perret, Responsable, 4 membres'));
  fireEvent.press(screen.getByLabelText('Retour à la liste des groupes'));

  await act(async () => {
    groupDetailRequest.resolve({
      id: 'home',
      name: 'Maison Perret',
      frequency: 'Planning à la semaine',
      membersCount: 1,
      role: 'admin',
      members: [{ id: 'sam', firstName: 'Sam', lastName: 'Perret', role: 'admin' }],
    });
  });

  expect(screen.getByText('Mes groupes')).toBeOnTheScreen();
  expect(screen.queryByText('Sam P.')).not.toBeOnTheScreen();
});

test('ignores group detail errors after returning to the groups list', async () => {
  expoRouterMock.__setLocalSearchParams({ emailVerified: 'true' });
  setAuthSession({
    accessToken: 'token',
    tokenType: 'Bearer',
    expiresIn: 3600,
    emailVerified: true,
  });
  const groupsRequest = createDeferred<MeGroupResponse[]>();
  const groupDetailRequest = createDeferred<Awaited<ReturnType<typeof getGroup>>>();
  listMyGroupsMock.mockReturnValue(groupsRequest.promise);
  getGroupMock.mockReturnValue(groupDetailRequest.promise);
  await render(<GroupsRoute />);

  await act(async () => {
    groupsRequest.resolve([
      {
        id: 'home',
        name: 'Maison Perret',
        createdBy: 'sam',
        createdAt: '2026-08-19T08:00:00.000Z',
        membersCount: 4,
        role: 'admin',
      },
    ] satisfies MeGroupResponse[]);
  });

  fireEvent.press(await screen.findByLabelText('Maison Perret, Responsable, 4 membres'));
  fireEvent.press(screen.getByLabelText('Retour à la liste des groupes'));

  await act(async () => {
    groupDetailRequest.reject(new Error('offline'));
  });

  expect(screen.getByText('Mes groupes')).toBeOnTheScreen();
  expect(screen.queryByText('Impossible de charger ce groupe pour le moment.')).not.toBeOnTheScreen();
});

test('ignores group detail loading completion after returning to the groups list', async () => {
  expoRouterMock.__setLocalSearchParams({ emailVerified: 'true' });
  setAuthSession({
    accessToken: 'token',
    tokenType: 'Bearer',
    expiresIn: 3600,
    emailVerified: true,
  });
  const groupsRequest = createDeferred<MeGroupResponse[]>();
  const groupDetailRequest = createDeferred<Awaited<ReturnType<typeof getGroup>>>();
  listMyGroupsMock.mockReturnValue(groupsRequest.promise);
  getGroupMock.mockReturnValue(groupDetailRequest.promise);
  await render(<GroupsRoute />);

  await act(async () => {
    groupsRequest.resolve([
      {
        id: 'home',
        name: 'Maison Perret',
        createdBy: 'sam',
        createdAt: '2026-08-19T08:00:00.000Z',
        membersCount: 4,
        role: 'admin',
      },
    ] satisfies MeGroupResponse[]);
  });

  fireEvent.press(await screen.findByLabelText('Maison Perret, Responsable, 4 membres'));
  fireEvent.press(screen.getByLabelText('Retour à la liste des groupes'));

  await act(async () => {
    groupDetailRequest.resolve({
      id: 'home',
      name: 'Maison Perret',
      frequency: 'Planning à la semaine',
      membersCount: 1,
      role: 'admin',
      members: [{ id: 'sam', firstName: 'Sam', lastName: 'Perret', role: 'admin' }],
    });
  });

  expect(screen.queryByText('Chargement du groupe...')).not.toBeOnTheScreen();
});

test('shows member first name without a last initial when the last name is blank', async () => {
  expoRouterMock.__setLocalSearchParams({ emailVerified: 'true' });
  setAuthSession({
    accessToken: 'token',
    tokenType: 'Bearer',
    expiresIn: 3600,
    emailVerified: true,
  });
  const groupsRequest = createDeferred<MeGroupResponse[]>();
  const groupDetailRequest = createDeferred<Awaited<ReturnType<typeof getGroup>>>();
  listMyGroupsMock.mockReturnValue(groupsRequest.promise);
  getGroupMock.mockReturnValue(groupDetailRequest.promise);
  await render(<GroupsRoute />);

  await act(async () => {
    groupsRequest.resolve([
      {
        id: 'home',
        name: 'Maison Perret',
        createdBy: 'sam',
        createdAt: '2026-08-19T08:00:00.000Z',
        membersCount: 1,
        role: 'admin',
      },
    ] satisfies MeGroupResponse[]);
  });

  fireEvent.press(await screen.findByLabelText('Maison Perret, Responsable, 1 membre'));

  await act(async () => {
    groupDetailRequest.resolve({
      id: 'home',
      name: 'Maison Perret',
      frequency: 'Planning à la semaine',
      membersCount: 1,
      role: 'admin',
      members: [{ id: 'sam', firstName: 'Sam', lastName: ' ', role: 'admin' }],
    });
  });

  expect(screen.getByText('Sam')).toBeOnTheScreen();
});

test('keeps the group detail visible when a member name is missing from the API response', async () => {
  expoRouterMock.__setLocalSearchParams({ emailVerified: 'true' });
  setAuthSession({
    accessToken: 'token',
    tokenType: 'Bearer',
    expiresIn: 3600,
    emailVerified: true,
  });
  const groupsRequest = createDeferred<MeGroupResponse[]>();
  const groupDetailRequest = createDeferred<Awaited<ReturnType<typeof getGroup>>>();
  listMyGroupsMock.mockReturnValue(groupsRequest.promise);
  getGroupMock.mockReturnValue(groupDetailRequest.promise);
  await render(<GroupsRoute />);

  await act(async () => {
    groupsRequest.resolve([
      {
        id: 'home',
        name: 'Maison Perret',
        createdBy: 'sam',
        createdAt: '2026-08-19T08:00:00.000Z',
        membersCount: 1,
        role: 'admin',
      },
    ] satisfies MeGroupResponse[]);
  });

  fireEvent.press(await screen.findByLabelText('Maison Perret, Responsable, 1 membre'));

  await act(async () => {
    groupDetailRequest.resolve({
      id: 'home',
      name: 'Maison Perret',
      frequency: 'Planning à la semaine',
      membersCount: 1,
      role: 'admin',
      members: [{ id: 'guest', role: 'member' }],
    });
  });

  expect(screen.getByText('Maison Perret')).toBeOnTheScreen();
  expect(screen.getAllByText('Membre').length).toBeGreaterThanOrEqual(2);
});

test('keeps the groups list mounted when a group is selected without an auth session', async () => {
  await render(<GroupsRoute />);

  expect(screen.getByText('Mes groupes')).toBeOnTheScreen();
});

test('placeholder summary avatars handle groups without a member count', async () => {
  expoRouterMock.__setLocalSearchParams({ emailVerified: 'true' });
  setAuthSession({
    accessToken: 'token',
    tokenType: 'Bearer',
    expiresIn: 3600,
    emailVerified: true,
  });
  const groupsRequest = createDeferred<MeGroupResponse[]>();
  const groupDetailRequest = createDeferred<Awaited<ReturnType<typeof getGroup>>>();
  listMyGroupsMock.mockReturnValue(groupsRequest.promise);
  getGroupMock.mockReturnValue(groupDetailRequest.promise);
  await render(<GroupsRoute />);

  await act(async () => {
    groupsRequest.resolve([
      {
        id: 'home',
        name: 'Maison Perret',
        createdBy: 'sam',
        createdAt: '2026-08-19T08:00:00.000Z',
        membersCount: 0,
        role: 'admin',
      },
    ] satisfies MeGroupResponse[]);
  });

  fireEvent.press(await screen.findByLabelText('Maison Perret, Responsable, 0 membre'));

  expect(screen.getByText('Chargement de la fréquence')).toBeOnTheScreen();
});

test('hides the group action on the groups page when email is not verified', async () => {
  expoRouterMock.__setLocalSearchParams({ emailVerified: 'false' });
  setAuthSession({
    accessToken: 'token',
    tokenType: 'Bearer',
    expiresIn: 3600,
    emailVerified: false,
  });
  const groupsRequest = createDeferred<MeGroupResponse[]>();
  listMyGroupsMock.mockReturnValue(groupsRequest.promise);
  await render(<GroupsRoute />);

  await act(async () => {
    groupsRequest.resolve([]);
  });

  expect(screen.getByText('Mes groupes')).toBeOnTheScreen();
  expect(await screen.findByText("Vous n'appartenez à aucun groupe pour le moment.")).toBeOnTheScreen();
  await waitForGroupsToSettle();
  expect(screen.queryByText(groupActionLabel)).not.toBeOnTheScreen();
});

test('shows a login prompt on the groups page without an auth session', async () => {
  await render(<GroupsRoute />);

  expect(screen.getByText('Mes groupes')).toBeOnTheScreen();
  expect(await screen.findByText('Connectez-vous pour afficher vos groupes.')).toBeOnTheScreen();
  await waitForGroupsToSettle();
  expect(listMyGroupsMock).not.toHaveBeenCalled();
});

test('shows an expired session message when the groups API rejects authentication', async () => {
  setAuthSession({
    accessToken: 'token',
    tokenType: 'Bearer',
    expiresIn: 3600,
    emailVerified: true,
  });
  const groupsRequest = createDeferred<MeGroupResponse[]>();
  listMyGroupsMock.mockReturnValue(groupsRequest.promise);

  await render(<GroupsRoute />);

  await act(async () => {
    groupsRequest.reject(new GroupsAuthenticationError());
  });

  expect(await screen.findByText('Votre session a expiré. Connectez-vous à nouveau.')).toBeOnTheScreen();
  await waitForGroupsToSettle();
});

test('shows a generic message when loading groups fails unexpectedly', async () => {
  setAuthSession({
    accessToken: 'token',
    tokenType: 'Bearer',
    expiresIn: 3600,
    emailVerified: true,
  });
  const groupsRequest = createDeferred<MeGroupResponse[]>();
  listMyGroupsMock.mockReturnValue(groupsRequest.promise);

  await render(<GroupsRoute />);

  await act(async () => {
    groupsRequest.reject(new Error('offline'));
  });

  expect(await screen.findByText('Impossible de charger vos groupes pour le moment.')).toBeOnTheScreen();
  await waitForGroupsToSettle();
});
