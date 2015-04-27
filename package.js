// package metadata file for Meteor.js
var packageName = 'angularui:angular-ui-router'; // https://atmospherejs.com/angularui/angular-ui-router
var where = 'client'; // where to install: 'client' or 'server'. For both, pass nothing.
var version = '0.2.14';

Package.describe({
  name: packageName,
  version: version,
  summary: 'angular-ui-router (official): Flexible routing with nested views in AngularJS',
  git: 'git@github.com:angular-ui/ui-router.git',
  documentation: null
});

Package.onUse(function(api) {
  api.versionsFrom(['METEOR@0.9.0', 'METEOR@1.0']);

  api.use('angular:angular@1.0.8', where);

  api.addFiles('release/angular-ui-router.js', where);
});