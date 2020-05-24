const noop = () => {};
Object.defineProperty(window, 'scrollTo', { value: noop, writable: true });

import 'angular';
import 'angular-mocks';
import 'angular-animate';
import './util/testUtilsNg1';

require('../src/index');
