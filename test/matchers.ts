/// <reference path='../typings/jasmine/jasmine.d.ts' />
import {equals} from "../src/common/common";
declare var testablePromise;

beforeEach(function() {
  jasmine.addMatchers(<any> {
    toEqualData: function() {
      return {
        compare: function(actual, expected) {
          return { pass: equals(actual, expected) };
        }
      }
    },

    toEqualValues: function() {
      return {
        compare: function(actual, expected) {
          let pass = Object.keys(expected)
              .reduce((acc, key) => acc && equals(actual[key], expected[key]), true);
          return { pass };
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
