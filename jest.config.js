const NG = process.env.NG || '1.7';

console.log(`Testing with AngularJS ${NG}`);

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['src', 'test'],
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)', '**/?*Spec.[jt]s'],
  setupFilesAfterEnv: ['./test/jest.init.ts'],
  moduleNameMapper: {
    '^angular$': '<rootDir>/test/angular/jest-angular.js',
    '^jest-angular-import$': `<rootDir>/test/angular/${NG}/angular.js`,
    '^angular-animate$': `<rootDir>/test/angular/${NG}/angular-animate.js`,
    '^angular-mocks$': `<rootDir>/test/angular/${NG}/angular-mocks.js`,
  },
};
