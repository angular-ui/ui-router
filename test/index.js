// require all source files ending in "Spec" from the
// current directory and all subdirectories

require('./util');

require('../src/index');

var testsContext = require.context(".", true, /Spec$/);
testsContext.keys().forEach(testsContext);
