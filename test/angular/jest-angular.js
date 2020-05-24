// This setup is used to inject specific versions of angularjs to test against

// Jest is configured to alias `import * as angular from 'angular'` to this file in jest.config.js.
// This file then imports angularjs bundle via the 'jest-angular-import' module alias which maps to
// a specific version of the angularjs bundle.
// It then exports the window.angular for use in tests that import from 'angular'

require('jest-angular-import');
module.exports = window.angular;
