var testsContext = require.context(".", true, /.Spec/);
var ignoredSpecs = [/viewDirectiveSpec/];

var notIgnored = function (key) {
  var ignored = ignoredSpecs.reduce(function(memo, regexp) { return memo || regexp.exec(key); }, false);
  if (ignored) console.log("Ignoring Spec: " + key);
  return !ignored;
};

testsContext.keys().filter(notIgnored).forEach(testsContext);