[![Build Status](https://travis-ci.org/angular-ui/ui-router.png?branch=master)](https://travis-ci.org/angular-ui/ui-router)

# UI-Router

####Finally a de-facto solution to nested views and routing.
>* Latest release 0.0.1: [Compressed](http://angular-ui.github.io/ui-router/release/angular-ui-router.min.js) / [Uncompressed](http://angular-ui.github.io/ui-router/release/angular-ui-router.js)
>* Latest snapshot: [Compressed](http://angular-ui.github.io/ui-router/build/angular-ui-router.min.js) / [Uncompressed](http://angular-ui.github.io/ui-router/build/angular-ui-router.js)


## Main Goal
To evolve the concept of an [angularjs](http://angularjs.org/) [***route***](http://docs.angularjs.org/api/ng.$routeProvider) into a more general concept of a ***state*** for managing complex application UI states.

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
* [API Quick Reference](https://github.com/angular-ui/ui-router/wiki/Quick-Reference)
* [FAQ](https://github.com/angular-ui/ui-router/wiki/Frequently-Asked-Questions)
* [Sample App](http://angular-ui.github.com/ui-router/sample/) ([Source](https://github.com/angular-ui/ui-router/tree/master/sample))
* [Generated Docs](http://angular-ui.github.com/ui-router/build/doc/)

## Quick Start

### Setup

1. Get ui-router:
>* with bower: `bower install angular-ui-router`
>* fork this repo
>* download the latest release ([compressed](http://angular-ui.github.io/ui-router/release/angular-ui-router.min.js) | [uncompressed](http://angular-ui.github.io/ui-router/release/angular-ui-router.js))

1. Add angular-ui-router.min.js to your index.html
> 
```html
<!doctype html>
<html ng-app="myapp">
<head>
      <script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.0.6/angular.min.js"></script>
      <script src="angular-ui-router.min.js"></script> <!-- Insert after main angular.js file -->
```

2. Set `ui.state` as a dependency in your module
>
```javascript
var myapp = angular.module('myapp', ['ui.state']) 
```

### Nested States & Views

The great majority of the power of ui-router is its ability to nest states & views.

1. Follow [Setup](https://github.com/angular-ui/ui-router#setup) instructions above.

2. Add a `ui-view` to your app.
>
```html
<!-- index.html -->
<body>
    <div ui-view></div>
    <!-- Also a way to navigate -->
    <a href="#/route1">Route 1</a>
    <a href="#/route2">Route 2</a>
</body>
```

3. Add some templates. These will plug into the `ui-view` within index.html. Notice that they have their own `ui-view` as well! That is the key to nesting states and views.
>
```html
<!-- route1.html -->
<h1>Route 1</h1>
<hr/>
<a href="#/route1/list">Show List</a>
<div ui-view></div>
```
```html
<!-- route2.html -->
<h1>Route 2</h1>
<hr/>
<a href="#/route2/list">Show List</a>
<div ui-view></div>
```

4. Add some child templates. *These* will get plugged into the `ui-view` of their parent state templates.
```html
<!-- route1.list.html -->
<h3>List of Route 1 Items</h3>
<ul>
  <li ng-repeat="item in items">{{item}}</li>
</ul>
```
```html
<!-- route2.list.html -->
<h3>List of Route 2 Things</h3>
<ul>
  <li ng-repeat="thing in things">{{thing}}</li>
</ul>
```

5. Now let's wire it all up. Set up your states in the module config:
>
```javascript
myapp.config(function($stateProvider, $urlRouterProvider){
      //
      // For any unmatched url, send to /route1
      $urlRouterProvider.otherwise("/route1") 
      //
      // Now set up the states
      $stateProvider
        .state('route1', {
            url: "/route1",
            templateUrl: "route1.html"
        })
          .state('route1.list', {
              url: "/list",
              templateUrl: "route1.list.html",
              controller: function($scope){
                $scope.items = ["A", "List", "Of", "Items"];
              }
          })          
        .state('route2', {
            url: "/route2",
            templateUrl: "route2.html"
        })
          .state('route2.list', {
              url: "/list",
              templateUrl: "route2.list.html",
              controller: function($scope){
                $scope.things = ["A", "Set", "Of", "Things"];
              }
          })
    })
```

4. See this quick start example in action. 
>**[Go to Quick Start Plunker for Nested States & Views](http://plnkr.co/edit/u18KQc?p=preview)**

5. This only scratches the surface! You've only seen Nested Views. 
>**[Dive Deeper!](https://github.com/angular-ui/ui-router/wiki)**


### Multiple & Named Views

Another handy feature is the ability to have more than one view per template. Please note: 95% of the time Nested States & Views is the pattern you'll be looking for, opposed to using multiple views per template.

1. Follow [Setup](https://github.com/angular-ui/ui-router#setup) instructions above.

2. Add one or more `ui-view` to your app, give them names.
>
```html
<!-- index.html -->
<body>
    <div ui-view="viewA"></div>
    <div ui-view="viewB"></div>
    <!-- Also a way to navigate -->
    <a href="#/route1">Route 1</a>
    <a href="#/route2">Route 2</a>
</body>
```

3. Set up your states in the module config:
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

4. See this quick start example in action. 
>**[Go to Quick Start Plunker for Multiple & Named Views](http://plnkr.co/edit/vDURUN?p=preview)**

5. This only scratches the surface! You've only seen Named Views and Parallel Views. 
>**[Dive Deeper!](https://github.com/angular-ui/ui-router/wiki)**

## Developing

UI-Router uses <code>grunt >= 0.4.x</code> make sure to upgrade your environment and read the
[Migration Guide](http://gruntjs.com/upgrading-from-0.3-to-0.4).

Dependencies for building from source and running tests:

* [grunt-cli](https://github.com/gruntjs/grunt-cli) - run: `$ npm install -g grunt-cli`
* Then install development dependencies with: `$ npm install`

There is a number of targets in the gruntfile that is used to building the solution, documents etc.

* `grunt`: Perform a normal build, runs jshint and karma tests
* `grunt build`: Perform a normal build
* `grunt dist`: Perform a clean build and generate documentation
* `grunt dev`: Run dev server (sample app) and watch for changes, builds and runs karma tests on changes.

