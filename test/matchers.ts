/// <reference path='../typings/jasmine/jasmine.d.ts' />
import {equals} from "../src/common/common";

beforeEach(function() {
  jasmine.addMatchers(<any> {
    toEqualData: function() {
      return {
        compare: function(actual, expected) {
          return { pass: equals(actual, expected) };
        }
      }
    },

    toBeResolved: () => ({
      compare: actual => ({
        pass: !!testablePromise(actual).$$resolved
      })
    }),

    toHaveClass: function() {
      return {
        compare: function(actual, clazz) {
          var classes = Array.prototype.slice.call(actual[0].classList);
          var pass = classes.indexOf(clazz) !== -1;
          var message = pass ? undefined :  "Expected '" + (actual) + "' to have class '" + clazz + "'.";

          return { pass: pass, message: message};
        }
      };
    }

  });
});
