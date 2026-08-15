module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/test/setup/jest.setup.ts'],
  watchman: false,
  testMatch: ['<rootDir>/test/**/*.(test|spec).(js|ts|tsx)'],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/test/functional/'],
  moduleNameMapper: {
    '\\.(css)$': '<rootDir>/test/mocks/styleMock.js',
    '^@/global\\.css$': '<rootDir>/test/mocks/styleMock.js',
    '^@/assets/(.*)$': '<rootDir>/assets/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/types/**'],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
};
