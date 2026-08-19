import { GroupsAuthenticationError, listMyGroups } from '@/api/groups';

const originalFetch = global.fetch;
const originalEnv = process.env.EXPO_PUBLIC_API_BASE_URL;

function mockFetch(status: number, body = []) {
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

test('lists authenticated user groups with a Bearer token', async () => {
  process.env.EXPO_PUBLIC_API_BASE_URL = ' https://api.dailymeal.test/ ';
  const groups = [
    {
      id: 'group-id',
      name: 'Maison Perret',
      createdBy: 'user-id',
      createdAt: '2026-08-19T08:00:00.000Z',
      membersCount: 4,
      role: 'admin',
    },
  ];
  const fetchMock = mockFetch(200, groups);

  await expect(listMyGroups('access-token')).resolves.toEqual(groups);

  expect(fetchMock).toHaveBeenCalledWith('https://api.dailymeal.test/me/groups', {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: 'Bearer access-token',
    },
  });
});

test('maps unauthorized group requests to an authentication error', async () => {
  mockFetch(401);

  await expect(listMyGroups('expired-token')).rejects.toBeInstanceOf(GroupsAuthenticationError);
});

test('maps other group request failures to a generic error', async () => {
  mockFetch(503);

  await expect(listMyGroups('access-token')).rejects.toThrow('Unable to list groups');
});
