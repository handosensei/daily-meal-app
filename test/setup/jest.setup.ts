import * as matchers from '@testing-library/react-native/matchers';

expect.extend(matchers);

jest.spyOn(require('react-native'), 'useColorScheme').mockReturnValue('light');

jest.mock('expo-image', () => {
  const { Image } = require('react-native');
  return { Image };
});

jest.mock('expo-symbols', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    SymbolView: ({ name, ...props }: { name: string | Record<string, string> }) =>
      React.createElement(Text, props, typeof name === 'string' ? name : name.web ?? name.ios),
  };
});

jest.mock('expo-splash-screen', () => ({
  hideAsync: jest.fn(() => Promise.resolve()),
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn(() => Promise.resolve()),
  WebBrowserPresentationStyle: {
    AUTOMATIC: 'automatic',
  },
}));

jest.mock('expo-router', () => {
  const React = require('react');
  const { View } = require('react-native');
  let localSearchParams: Record<string, string | undefined> = {};
  const router = {
    push: jest.fn(),
    replace: jest.fn(),
  };

  const Link = ({ children, onPress, ...props }: Record<string, unknown>) =>
    React.createElement(View, { ...props, onClick: onPress }, children);

  return {
    __resetRouter: () => {
      router.push.mockClear();
      router.replace.mockClear();
      localSearchParams = {};
    },
    __router: router,
    __setLocalSearchParams: (params: Record<string, string | undefined>) => {
      localSearchParams = params;
    },
    DarkTheme: { dark: true },
    DefaultTheme: { dark: false },
    Link,
    Redirect: ({ href }: { href: string }) => React.createElement(View, { href, testID: 'redirect' }),
    Slot: () => React.createElement(View, { testID: 'slot' }),
    ThemeProvider: ({ children, value }: { children: React.ReactNode; value: unknown }) =>
      React.createElement(View, { testID: 'theme-provider', value }, children),
    useLocalSearchParams: () => localSearchParams,
    useRouter: () => router,
  };
});

jest.mock('expo-router/ui', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    Tabs: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, { testID: 'tabs' }, children),
    TabSlot: (props: Record<string, unknown>) => React.createElement(View, { testID: 'tab-slot', ...props }),
    TabList: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, { testID: 'tab-list' }, children),
    TabTrigger: ({ children, name, href }: { children: React.ReactNode; name: string; href: string }) =>
      React.createElement(View, { testID: `tab-trigger-${name}`, href }, children),
  };
});

jest.mock('expo-router/unstable-native-tabs', () => {
  const React = require('react');
  const { View, Text } = require('react-native');

  function NativeTabs({ children, ...props }: Record<string, unknown> & { children: React.ReactNode }) {
    return React.createElement(View, { testID: 'native-tabs', ...props }, children);
  }

  const Trigger = ({ children, name }: { children: React.ReactNode; name: string }) =>
    React.createElement(View, { testID: `native-tab-${name}` }, children);
  Trigger.Label = ({ children }: { children: React.ReactNode }) =>
    React.createElement(Text, null, children);
  Trigger.Icon = (props: Record<string, unknown>) =>
    React.createElement(View, { testID: 'native-tab-icon', ...props });
  NativeTabs.Trigger = Trigger;

  return { NativeTabs };
});

jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View } = require('react-native');

  class Keyframe {
    definition: unknown;

    constructor(definition: unknown) {
      this.definition = definition;
    }

    duration() {
      return this;
    }

    withCallback(callback: (finished: boolean) => void) {
      callback(false);
      callback(true);
      return this;
    }
  }

  const AnimatedView = React.forwardRef((props: Record<string, unknown>, ref: unknown) =>
    React.createElement(View, { ...props, ref }),
  );

  return {
    __esModule: true,
    default: { View: AnimatedView },
    View: AnimatedView,
    Easing: {
      elastic: jest.fn((value: number) => `elastic(${value})`),
    },
    FadeIn: {
      duration: jest.fn(() => ({ type: 'fade-in' })),
    },
    Keyframe,
  };
});

jest.mock('react-native-worklets', () => ({
  scheduleOnRN: jest.fn((callback: (...args: unknown[]) => void, ...args: unknown[]) =>
    callback(...args),
  ),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: require('react-native').View,
  useSafeAreaInsets: jest.fn(() => ({ top: 1, right: 2, bottom: 3, left: 4 })),
}));
