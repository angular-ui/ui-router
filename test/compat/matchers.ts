/// <reference path='../../typings/jasmine/jasmine.d.ts' />
/// <reference path='../../typings/angularjs/angular.d.ts' />
/// <reference path='../../typings/angularjs/angular-mocks.d.ts' />
import {map} from "../../src/common/common"

beforeEach(function() {
  jasmine.addMatchers(<any> {
    toEqualData: function() {
      return {
        compare: function(actual, expected) {
          return { pass: angular.equals(actual, expected) };
        }
      }
    },

    toHaveClass: function() {
      return {
        compare: function(actual, clazz) {
          var pass = actual.hasClass ?
            actual.hasClass(clazz) :
            angular.element(actual).hasClass(clazz);

          var message = pass ? undefined :  "Expected '" + angular.mock.dump(this.actual) + "' to have class '" + clazz + "'.";

          return { pass: pass, message: message};
        }
      };
    }

  });
});
