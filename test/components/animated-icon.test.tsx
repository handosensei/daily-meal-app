import { act, fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Image } from 'react-native';

import { AnimatedIcon, AnimatedSplashOverlay } from '@/components/animated-icon';

const SplashScreen = require('expo-splash-screen');

test('AnimatedIcon renders the mobile icon layers', async () => {
  const result = await render(<AnimatedIcon />);

  expect(result.root?.findAllByType(Image).length).toBeGreaterThanOrEqual(2);
});

test('AnimatedSplashOverlay hides the native splash screen before animating out', async () => {
  const result = await render(<AnimatedSplashOverlay />);
  const layoutNode = result.root?.find((node) => typeof node.props.onLayout === 'function');

  await act(async () => {
    fireEvent(layoutNode!, 'layout');
  });

  expect(SplashScreen.hideAsync).toHaveBeenCalled();
});
