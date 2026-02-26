/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.cjs'],
  moduleFileExtensions: ['cjs', 'js', 'jsx', 'json'],
};
