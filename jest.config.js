export default {
  testEnvironment: 'node',
  transform: {},
  testEnvironmentOptions: {},
  projects: [
    {
      displayName: 'backend',
      testMatch: ['<rootDir>/tests-unit/**/*.node.test.js'],
      testEnvironment: 'node',
      moduleNameMapper: {
        "^Salud/Controlador/firebase.js$": "<rootDir>/__mocks__/firebaseMock.js"
      },
    },
    {
      displayName: 'frontend',
      testMatch: ['<rootDir>/tests-unit/**/*.js'],
      testEnvironment: 'jsdom',
      moduleNameMapper: {
        "^Salud/Controlador/firebase.js$": "<rootDir>/__mocks__/firebaseMock.js"
      },
    },
  ],
};
