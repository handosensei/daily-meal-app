import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { Platform, useColorScheme } from 'react-native';

import TabLayout from '@/app/_layout';
import ApiScreen from '@/app/api';
import ExploreScreen from '@/app/explore';
import { apiContract, apiEndpointCount, apiServers } from '@/api/openapi';
import { BottomTabInset, Colors, Fonts, MaxContentWidth, Spacing } from '@/constants/theme';

const useColorSchemeMock = useColorScheme as jest.Mock;
const originalPlatform = Platform.OS;

function setPlatform(os: typeof Platform.OS) {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: os });
}

afterEach(() => {
  setPlatform(originalPlatform);
  jest.clearAllMocks();
});

test('API screen renders OpenAPI contract metadata and declared servers', async () => {
  await render(<ApiScreen />);

  expect(screen.getByText(apiContract.info.title)).toBeOnTheScreen();
  expect(screen.getByText(`Version ${apiContract.info.version}`)).toBeOnTheScreen();
  expect(screen.getByText(String(apiEndpointCount))).toBeOnTheScreen();
  apiServers.forEach((server) => {
    expect(screen.getByText(server.url)).toBeOnTheScreen();
  });
});

test('Explore screen renders documentation sections and the web badge on web', async () => {
  setPlatform('web');
  useColorSchemeMock.mockReturnValue('light');

  const result = await render(<ExploreScreen />);

  expect(screen.getByText('Explore')).toBeOnTheScreen();
  expect(screen.getByText('Expo documentation')).toBeOnTheScreen();
  expect(screen.getByText('File-based routing')).toBeOnTheScreen();
  expect(screen.getByText('Android, iOS, and web support')).toBeOnTheScreen();
  expect(screen.getByText(/^v\d+/)).toBeOnTheScreen();
  expect(result.root?.findAll((node) => typeof node.props.style === 'function')[0].props.style({ pressed: true })).toBeTruthy();
});

test('Explore screen applies Android safe-area padding branch without the web badge', async () => {
  setPlatform('android');
  useColorSchemeMock.mockReturnValue('dark');

  await render(<ExploreScreen />);

  expect(screen.getByText('Explore')).toBeOnTheScreen();
  expect(screen.queryByText(/^v\d+/)).toBeNull();
});

test('root layout chooses the dark theme', async () => {
  useColorSchemeMock.mockReturnValue('dark');

  await render(<TabLayout />);

  expect(screen.getByTestId('theme-provider')).toHaveProp('value', { dark: true });
  expect(screen.getByTestId('slot')).toBeOnTheScreen();
});

test('root layout chooses the default theme for light scheme', async () => {
  useColorSchemeMock.mockReturnValue('light');

  await render(<TabLayout />);

  expect(screen.getByTestId('theme-provider')).toHaveProp('value', { dark: false });
});

test('theme constants expose stable design tokens', () => {
  expect(Colors.light.text).toBe('#000000');
  expect(Colors.dark.background).toBe('#000000');
  expect(Fonts.mono).toBeTruthy();
  expect(Spacing.six).toBe(64);
  expect(BottomTabInset).toBeGreaterThanOrEqual(0);
  expect(MaxContentWidth).toBe(800);
});

test('API screen tolerates servers without descriptions', async () => {
  jest.resetModules();
  jest.doMock('@/api/openapi', () => ({
    apiContract: { info: { title: 'Mock API' } },
    apiContractVersion: '1.2.3',
    apiEndpointCount: 1,
    apiServers: [{ url: 'https://api.example.test' }],
  }));
  const { default: MockedApiScreen } = require('@/app/api');

  await render(<MockedApiScreen />);

  expect(screen.getByText('https://api.example.test')).toBeOnTheScreen();
  jest.dontMock('@/api/openapi');
});

test.each([
  ['android', 80],
  ['web', 0],
] as const)('theme constants compute BottomTabInset for %s', (os, expectedInset) => {
  jest.resetModules();
  jest.doMock('react-native', () => ({
    Platform: {
      select: (options: Record<string, unknown>) => options[os],
    },
  }));
  const theme = require('@/constants/theme');

  expect(theme.BottomTabInset).toBe(expectedInset);
  jest.dontMock('react-native');
});
