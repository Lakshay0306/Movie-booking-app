// jest.config.js
export default {
  testEnvironment: 'node',
  transform: {},
  verbose: true,
  testMatch: ['**/src/backend/tests/**/*.test.js'],
  setupFilesAfterEnv: ['./src/backend/tests/setup.js'],
};
