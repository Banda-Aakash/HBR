module.exports = {
  preset: '@react-native/jest-preset',
  globalSetup: '<rootDir>/jest.global-setup.js',
  setupFiles: ['<rootDir>/jest.setup.js'],
  // The first test in a file also compiles React Native when there's no cache yet
  testTimeout: 30000,
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native[^/]*|@react-native(-community)?|@react-navigation)/)',
  ],
};
