import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { Platform, useColorScheme } from 'react-native';

import TabLayout from '@/app/_layout';
import ExploreScreen from '@/app/explore';
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
