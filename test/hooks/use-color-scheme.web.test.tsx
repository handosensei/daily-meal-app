import { act, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Text, useColorScheme as useRNColorScheme } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme.web';

const useRNColorSchemeMock = useRNColorScheme as jest.Mock;

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});

test('web color scheme returns light before hydration and native scheme after hydration', async () => {
  jest.useFakeTimers();
  useRNColorSchemeMock.mockReturnValue('dark');

  function Probe() {
    return <Text>{useColorScheme()}</Text>;
  }

  await render(<Probe />);
  expect(screen.getByText('light')).toBeOnTheScreen();

  act(() => {
    jest.runOnlyPendingTimers();
  });

  expect(screen.getByText('dark')).toBeOnTheScreen();
});

test('web color scheme clears the hydration timeout when unmounted', async () => {
  jest.useFakeTimers();
  const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
  useRNColorSchemeMock.mockReturnValue('light');

  function Probe() {
    return <Text>{useColorScheme()}</Text>;
  }

  const { unmount } = await render(<Probe />);
  await unmount();

  expect(clearTimeoutSpy).toHaveBeenCalled();
});
