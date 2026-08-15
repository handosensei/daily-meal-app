import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Image, Text, useColorScheme } from 'react-native';

import { ExternalLink } from '@/components/external-link';
import { HintRow } from '@/components/hint-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Collapsible } from '@/components/ui/collapsible';
import { WebBadge } from '@/components/web-badge';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const openBrowserAsync = require('expo-web-browser').openBrowserAsync as jest.Mock;
const useColorSchemeMock = useColorScheme as jest.Mock;

afterEach(() => {
  delete process.env.EXPO_OS;
  jest.clearAllMocks();
});

test('ThemedText applies every supported text variant and theme color', async () => {
  useColorSchemeMock.mockReturnValue('dark');
  const variants = ['default', 'title', 'small', 'smallBold', 'subtitle', 'link', 'linkPrimary', 'code'] as const;

  await render(
    <>
      {variants.map((type) => (
        <ThemedText key={type} type={type} themeColor="textSecondary">
          {type}
        </ThemedText>
      ))}
    </>,
  );

  variants.filter((type) => type !== 'linkPrimary').forEach((type) => {
    expect(screen.getByText(type)).toHaveStyle({ color: Colors.dark.textSecondary });
  });
  expect(screen.getByText('linkPrimary')).toHaveStyle({ color: '#3c87f7' });
});

test('ThemedView applies default and selected themed backgrounds', async () => {
  useColorSchemeMock.mockReturnValue('light');

  await render(
    <>
      <ThemedView testID="default-view" />
      <ThemedView testID="selected-view" type="backgroundSelected" />
    </>,
  );

  expect(screen.getByTestId('default-view')).toHaveStyle({ backgroundColor: Colors.light.background });
  expect(screen.getByTestId('selected-view')).toHaveStyle({
    backgroundColor: Colors.light.backgroundSelected,
  });
});

test('useTheme falls back to light colors when scheme is unspecified', async () => {
  useColorSchemeMock.mockReturnValue('unspecified');

  function Probe() {
    const theme = useTheme();
    return <Text>{theme.background}</Text>;
  }

  await render(<Probe />);

  expect(screen.getByText(Colors.light.background)).toBeOnTheScreen();
});

test('HintRow renders default and custom interface text', async () => {
  await render(
    <>
      <HintRow />
      <HintRow title="Custom title" hint={<Text>Custom hint</Text>} />
    </>,
  );

  expect(screen.getByText('Try editing')).toBeOnTheScreen();
  expect(screen.getByText('app/index.tsx')).toBeOnTheScreen();
  expect(screen.getByText('Custom title')).toBeOnTheScreen();
  expect(screen.getByText('Custom hint')).toBeOnTheScreen();
});

test('Collapsible toggles its content from the interface', async () => {
  useColorSchemeMock.mockReturnValue('light');
  const result = await render(
    <Collapsible title="Details">
      <Text>Hidden content</Text>
    </Collapsible>,
  );

  const heading = result.root?.findAll((node) => typeof node.props.style === 'function')[0];
  expect(heading?.props.style({ pressed: true })).toEqual(
    expect.arrayContaining([expect.any(Object)]),
  );
  expect(screen.queryByText('Hidden content')).toBeNull();

  fireEvent.press(screen.getByText('Details'));
  expect(screen.getByText('Hidden content')).toBeOnTheScreen();

  fireEvent.press(screen.getByText('Details'));
  expect(screen.queryByText('Hidden content')).toBeNull();
});

test('ExternalLink opens native links in the in-app browser and leaves web links alone', async () => {
  process.env.EXPO_OS = 'ios';
  const preventDefault = jest.fn();
  const nativeResult = await render(
    <ExternalLink href="https://docs.expo.dev">
      <Text>Native docs</Text>
    </ExternalLink>,
  );

  await nativeResult.root?.findByProps({ href: 'https://docs.expo.dev' }).props.onClick({
    preventDefault,
  });

  expect(preventDefault).toHaveBeenCalled();
  expect(openBrowserAsync).toHaveBeenCalledWith('https://docs.expo.dev', {
    presentationStyle: 'automatic',
  });

  expect(openBrowserAsync).toHaveBeenCalledTimes(1);
});

test('WebBadge switches badge artwork with the color scheme', async () => {
  useColorSchemeMock.mockReturnValue('dark');
  const result = await render(<WebBadge />);

  expect(screen.getByText(/^v\d+/)).toBeOnTheScreen();
  expect(result.root?.findAllByType(Image)).toHaveLength(1);

  useColorSchemeMock.mockReturnValue('light');
  await result.rerender(<WebBadge />);

  expect(screen.getByText(/^v\d+/)).toBeOnTheScreen();
  expect(result.root?.findAllByType(Image)).toHaveLength(1);
});
