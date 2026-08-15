import { render } from '@testing-library/react-native';
import React from 'react';
import { Image } from 'react-native';

import { AnimatedIcon, AnimatedSplashOverlay } from '@/components/animated-icon.web';

test('web splash overlay is disabled', async () => {
  const { toJSON } = await render(<AnimatedSplashOverlay />);

  expect(toJSON()).toBeNull();
});

test('web animated icon renders the logo artwork', async () => {
  const result = await render(<AnimatedIcon />);

  expect(result.root?.findAllByType(Image).length).toBeGreaterThanOrEqual(2);
});
