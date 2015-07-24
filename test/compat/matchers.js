beforeEach(function() {
  jasmine.addMatchers({

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
