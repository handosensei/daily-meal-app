import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { useColorScheme } from 'react-native';

import AppTabs from '@/components/app-tabs';

const useColorSchemeMock = useColorScheme as jest.Mock;

test('native tabs expose the app destinations', async () => {
  useColorSchemeMock.mockReturnValue('unspecified');

  const result = await render(<AppTabs />);

  expect(screen.getByText('Home')).toBeOnTheScreen();
  expect(screen.getByText('Explore')).toBeOnTheScreen();

  useColorSchemeMock.mockReturnValue('dark');
  await result.rerender(<AppTabs />);
  expect(screen.getByText('Home')).toBeOnTheScreen();
});
