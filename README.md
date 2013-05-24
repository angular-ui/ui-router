[![Build Status](https://travis-ci.org/angular-ui/ui-router.png?branch=master)](https://travis-ci.org/angular-ui/ui-router)

# UI-Router

**Attention**: UI-Router uses <code>grunt >= 0.4.x</code> make sure to upgrade your environment and read the
[Migration Guide](http://gruntjs.com/upgrading-from-0.3-to-0.4).

Finally a de-facto solution to nested views and routing.


## Main Goal
To evolve the concept of an Angular "Route" into a more general concept of a "State" for managing complex application UI states.

## Main Features
1. **Robust State Management**
>`$state` and `$stateProvider`

2. **More Powerful Views**
>`ui-view` directive (used in place of `ng-view`)

3. **Named Views**
>`<div ui-view="chart">`

4. **Multiple Parallel Views**
>
```
<div ui-view="chart1">
<div ui-view="chart2">
```
5. **Nested Views**
>load templates that contain nested `ui-view`s as deep as you'd like.

6. **Routing**
>States can map to URLs (though it's not required)


*Basically, do whatever you want with states and routes.*


## Resources

* [In-Depth Overview](https://github.com/angular-ui/ui-router/wiki)
* [FAQ](https://github.com/angular-ui/ui-router/wiki/Frequently-Asked-Questions)
* [Sample App](http://angular-ui.github.com/ui-router/sample/) ([Source](https://github.com/angular-ui/ui-router/tree/master/sample))
* [Generated Docs](http://angular-ui.github.com/ui-router/build/doc/)
* Latest build: [angular-ui-states.min.js](http://angular-ui.github.com/ui-router/build/angular-ui-states.min.js)
  (uncompressed [angular-ui-states.js](http://angular-ui.github.com/ui-router/build/angular-ui-states.js))

## Quick Start
1. Add angular-ui-states.min.js to your index.html
>
```html
<!doctype html>
<html ng-app="myapp">
<head>
      <script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.0.6/angular.min.js"></script>
      <script src="angular-ui-states.js"></script>
```

2. Add one or more `ui-view` to your app, give them names.
>
```html
<body>
    <div ui-view="viewA"></div>
    <div ui-view="viewB"></div>
    <!-- Also a way to navigate -->
    <a href="#/route1">Route 1</a>
    <a href="#/route2">Route 2</a>
</body>
```

3. Set `ui.state` as a dependency in your module
>
```javascript
var myapp = angular.module('myapp', ['ui.state']) 
```

4. Set up your states in the module config
>
```javascript
myapp.config(function($stateProvider, $routeProvider){
  $stateProvider
		.state('index', {
			url: "", // root route
			views: {
				"viewA": {
					templateUrl: "index.viewA.html"
				},
				"viewB": {
					templateUrl: "index.viewB.html"
				}
			}
		})
		.state('route1', {
			url: "/route1",
			views: {
				"viewA": {
					templateUrl: "route1.viewA.html"
				},
				"viewB": {
					templateUrl: "route1.viewB.html"
				}
			}
		})
		.state('route2', {
			url: "/route2",
			views: {
				"viewA": {
					templateUrl: "route2.viewA.html"
				},
				"viewB": {
					templateUrl: "route2.viewB.html"
				}
			}
		})
})
```

5. See this quick start example working. 
>**[Go to Quick Start Plunker](http://plnkr.co/edit/vDURUN?p=preview)**

6. This only scratches the surface! You've only seen Named Views and Parallel Views. Learn more about `state()` options, Nested Views, URL routing options, backwards compatibility, and more! 
>**[Dive Deeper!](https://github.com/angular-ui/ui-router/wiki)**

## Developing

Dependencies for building the solution and running tests:

* [grunt-cli](https://github.com/gruntjs/grunt-cli) - run: `$ npm install -g grunt-cli`
* Then install development dependencies with: `$ npm install`

There is a number of targets in the gruntfile that is used to building the solution, documents etc.

* `grunt`: Perform a normal build, runs jshint and karma tests
* `grunt build`: Perform a normal build
* `grunt dist`: Perform a clean build and generate documentation
* `grunt dev`: Run dev server (sample app) and watch for changes, builds and runs karma tests on changes.

