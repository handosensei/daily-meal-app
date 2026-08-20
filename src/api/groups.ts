import { getApiBaseUrl } from '@/api/config';

export type MeGroupResponse = {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
  membersCount: number;
  role: 'admin' | 'member';
};

export type GroupResponse = {
  id: string;
  name: string;
  frequency: string;
  membersCount: number;
  role: 'admin' | 'member';
  members: GroupMemberResponse[];
};

export type GroupMemberResponse = {
  id: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'member';
};

export class GroupsAuthenticationError extends Error {
  constructor() {
    super('Authentication required');
    this.name = 'GroupsAuthenticationError';
  }
}

export async function listMyGroups(accessToken: string) {
  const response = await fetch(`${getApiBaseUrl()}/me/groups`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 401) {
    throw new GroupsAuthenticationError();
  }

  if (!response.ok) {
    throw new Error('Unable to list groups');
  }

  return (await response.json()) as MeGroupResponse[];
}

export async function getGroup(accessToken: string, groupId: string) {
  const response = await fetch(`${getApiBaseUrl()}/groups/${encodeURIComponent(groupId)}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 401) {
    throw new GroupsAuthenticationError();
  }

  if (!response.ok) {
    throw new Error('Unable to get group');
  }

  return (await response.json()) as GroupResponse;
}
