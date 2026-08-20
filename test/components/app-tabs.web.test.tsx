import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { Text, useColorScheme } from 'react-native';

import AppTabs, { CustomTabList, TabButton } from '@/components/app-tabs.web';

const useColorSchemeMock = useColorScheme as jest.Mock;

test('web tabs render tab triggers and docs link', async () => {
  useColorSchemeMock.mockReturnValue('dark');

  await render(<AppTabs />);

  expect(screen.getByText('Home')).toBeOnTheScreen();
  expect(screen.getByText('Explore')).toBeOnTheScreen();
  expect(screen.getByText('Docs')).toBeOnTheScreen();
});

test('TabButton renders focused and unfocused states', async () => {
  useColorSchemeMock.mockReturnValue('light');
  const result = await render(<TabButton isFocused>Focused</TabButton>);

  expect(screen.getByText('Focused')).toBeOnTheScreen();
  await result.rerender(<TabButton isFocused={false}>Unfocused</TabButton>);

  expect(screen.getByText('Unfocused')).toBeOnTheScreen();
});

test('CustomTabList renders children beside the brand and docs shortcut', async () => {
  useColorSchemeMock.mockReturnValue('unspecified');

  await render(
    <CustomTabList>
      <Text>Child tab</Text>
    </CustomTabList>,
  );

  expect(screen.getByText('Expo Starter')).toBeOnTheScreen();
  expect(screen.getByText('Child tab')).toBeOnTheScreen();
  expect(screen.getByText('Docs')).toBeOnTheScreen();
});
