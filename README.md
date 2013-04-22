[![Build Status](https://travis-ci.org/angular-ui/ui-router.png?branch=master)](https://travis-ci.org/angular-ui/ui-router)

# UI-Router

**Attention**: UI-Router uses <code>grunt >= 0.4.x</code> make sure to upgrade your environment and read the
[Migration Guide](http://gruntjs.com/upgrading-from-0.3-to-0.4).

Finally a de-facto solution to nested views and routing.


## Main Goal
To evolve the concept of an Angular "Route" into a more general concept of a "State" for managing coarse application UI states.

## Main Features
1. A state manager `$stateProvider` and `$state`, keeps state logic separate from routing logic.
2. Nested states (parent/child relationships).
3. Can set multiple views via named views. `ui-view` directive.
4. URL Routing
5. Backwards compatible with Angular v1 router
6. Various other nuggets of goodness

## Resources

* [In-depth Overview](https://github.com/angular-ui/ui-router/wiki)
* [Sample App](http://angular-ui.github.com/ui-router/sample/) ([Source](https://github.com/angular-ui/ui-router/tree/ui-states/sample))
* [Generated Docs](http://angular-ui.github.com/ui-router/build/doc/)
* Latest build: [angular-ui-states.min.js](http://angular-ui.github.com/ui-router/build/angular-ui-states.min.js)
  (uncompressed [angular-ui-states.js](http://angular-ui.github.com/ui-router/build/angular-ui-states.js))

# Developing

Dependencies for building the solution and running tests:

* [grunt-cli](https://github.com/gruntjs/grunt-cli) - run: `$ npm install -g grunt-cli`
* Then install development dependencies with: `$ npm install`

There is a number of targets in the gruntfile that is used to building the solution, documents etc.

* `grunt`: Perform a normal build, runs jshint and karma tests
* `grunt build`: Perform a normal build
* `grunt dist`: Perform a clean build and generate documentation
* `grunt dev`: Run dev server (sample app) and watch for changes, builds and runs karma tests on changes.

