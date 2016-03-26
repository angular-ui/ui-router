/*global module:false*/
module.exports = function (grunt) {

  require('load-grunt-tasks')(grunt);
  var files = require('./files').files;
  var systemjs = require('systemjs');
  //var jspm = require('jspm');

  // Project configuration.
  grunt.initConfig({
    builddir: 'build',
    pkg: grunt.file.readJSON('package.json'),
    buildtag: '-dev-' + grunt.template.today('yyyy-mm-dd'),
    meta: {
      banner: '/**\n' +
        ' * <%= pkg.description %>\n' +
        ' * @version v<%= pkg.version %><%= buildtag %>\n' +
        ' * @link <%= pkg.homepage %>\n' +
        ' * @license MIT License, http://www.opensource.org/licenses/MIT\n' +
        ' */'
    },
    clean: [ '<%= builddir %>' ],
    ts: {
      ng1: { tsconfig: 'tsconfig.json' },
      ng2: { tsconfig: 'tsconfig-ng2.json' }
    },
    uglify: {
      options: {
        banner: '<%= meta.banner %>\n',
        mangle: true
      },
      build: {
        files: {
          '<%= builddir %>/ui-router-ng2.min.js': ['<banner:meta.banner>', '<%= builddir %>/ui-router-ng2.js'],
          '<%= builddir %>/angular-ui-router.min.js': ['<banner:meta.banner>', '<%= builddir %>/angular-ui-router.js'],
          '<%= builddir %>/ng1/stateEvents.min.js': ['<banner:meta.banner>', '<%= builddir %>/ng1/stateEvents.js']
        }
      }
    },
    webpack: {
      build: {
        entry: files.ng1CommonJsEntrypoint,
        output: {
          path: '<%= builddir %>',
          filename: 'angular-ui-router.js',
          library: 'ui.router',
          libraryTarget: 'umd'
        },
        module: { loaders: [] },
        externals: [
          { angular: { root: 'angular', commonjs2: 'angular', commonjs: 'angular' } }
        ]
      },
      ng2: {
        entry: files.ng2CommonJsEntrypoint,
        output: {
          path: '<%= builddir %>',
          filename: 'ui-router-ng2.js',
          library: 'uiRouter',
          libraryTarget: 'umd'
        },
        module: { loaders: [] },
        externals: [{
          'angular2/core': {root: ['ng', 'core'], commonjs: 'angular2/core', commonjs2: 'angular2/core', amd: 'angular2/core'},
          'angular2/common': {root: ['ng', 'common'], commonjs: 'angular2/common', commonjs2: 'angular2/common', amd: 'angular2/common'}
        }]
      }
      //,core: {
      //  entry: files.justjsCommonJsEntrypoint,
      //  output: {
      //    path: '<%= builddir %>',
      //    filename: 'ui-router-justjs.js',
      //    library: 'uiRouter',
      //    libraryTarget: 'umd'
      //  },
      //  module: {
      //    loaders: []
      //  }
      //}
    },
    release: {
      files: ['<%= pkg.name %>.js', '<%= pkg.name %>.min.js'],
      src: '<%= builddir %>',
      dest: 'release'
    },
    watch: {
      files: ['src/**/*.ts', 'src/**/*.js', 'test/**/*.js'],
      tasks: ['ts:es5', 'webpack', 'karma:ng14']
    },
    connect: {
      server: {},
      sample: {
        options:{
          port: 5555,
          keepalive: true
        }
      }
    },
    karma: {
      options: {
        configFile: 'config/karma.js',
        // Serve and load angular files using regular Karma mode
        browsers: [ grunt.option('browser') || 'PhantomJS' ]
      },
      // Same as karma:base
      unit: {
      },
      // Launch Karma in Chrome, click debug button, debug tests
      debug: {
        singleRun: false,
        background: false,
        autoWatch: true,
        autoWatchInterval: 1,
        browsers: [ grunt.option('browser') || 'Chrome' ]
      },
      // Test with angular 1.2
      ng12: {
        options: { files: files.karmaServedFiles('1.2.28') }
      },
      // Test with angular 1.3
      ng13: {
        options: { files: files.karmaServedFiles('1.3.16') }
      },
      // Test with angular 1.4
      ng14: {
        options: { files: files.karmaServedFiles('1.4.9') }
      },
      // Test with angular 1.5
      ng15: {
        options: { files: files.karmaServedFiles('1.5.0') }
      },
      background: {
          background: true
      },
      // PhantomJS in the console; watch for changes to tests/src
      watch: {
        singleRun: false,
        autoWatch: true,
        autoWatchInterval: 1
      }
    },
    changelog: {
      options: {
        dest: 'CHANGELOG.md'
      }
    },
    ngdocs: {
      options: {
        dest: 'site',
        styles: [ 'ngdoc_assets/uirouter-docs.css' ],
        html5Mode: false,
        title: 'UI Router',
        startPage: '/api/ui.router',
        navTemplate: 'ngdoc_assets/docnav.html'
      },
      api: {
        src: ['src/**/*.js'],
        title: 'API Reference'
      }
    }
  });

  grunt.registerTask('integrate', ['clean', 'build', 'karma:ng12', 'karma:ng13', 'karma:ng14', 'karma:ng15']);
  grunt.registerTask('default', ['build', 'karma:unit', 'docs']);
  grunt.registerTask('build', 'Perform a normal build', ['clean', 'ts', 'bundles', 'uglify']);
  grunt.registerTask('dist-docs', 'Perform a clean build and generate documentation', ['build', 'ngdocs']);
  grunt.registerTask('release', 'Tag and perform a release', ['prepare-release', 'build', 'perform-release']);
  grunt.registerTask('dev', 'Run dev server and watch for changes', ['build', 'connect:server', 'karma:background', 'watch']);
  grunt.registerTask('sample', 'Run connect server with keepalive:true for sample app development', ['connect:sample']);

  grunt.registerTask('docs', 'Generate documentation to _doc', function() { 
    promising(this, 
      system('./node_modules/typedoc/bin/typedoc --experimentalDecorators --readme ./README.md --name "UI-Router" --theme ./typedoctheme --mode modules --module commonjs --target es5 --out _doc  src typings/es6-shim/es6-shim.d.ts typings/angularjs/angular.d.ts')
    );
  });

  grunt.registerTask('bundles', 'Create the bundles and reorganize any additional dist files (addons, etc)', function() {
    var builddir = grunt.config('builddir');
    grunt.task.requires([ 'clean', 'ts' ]);
    grunt.task.run(['webpack']);

    ['stateEvents.js', 'stateEvents.js.map'].forEach(function(file) {
      grunt.file.copy(builddir + "/es5/ng1/" + file, builddir + "/ng1/" + file);
    })
  });

  grunt.registerTask('publish-pages', 'Publish a clean build, docs, and sample to github.io', function () {
    promising(this,
      ensureCleanMaster().then(function () {
        shjs.rm('-rf', 'build');
        return system('git checkout gh-pages');
      }).then(function () {
        return system('git merge master');
      }).then(function () {
        return system('grunt dist-docs');
      }).then(function () {
        return system('git commit -a -m \'Automatic gh-pages build\'');
      }).then(function () {
        return system('git checkout master');
      })
    );
  });

  grunt.registerTask('push-pages', 'Push published pages', function () {
    promising(this,
      ensureCleanMaster().then(function () {
        shjs.rm('-rf', 'build');
        return system('git checkout gh-pages');
      }).then(function () {
        return system('git push origin gh-pages');
      }).then(function () {
        return system('git checkout master');
      })
    );
  });

  grunt.registerTask('prepare-release', function () {
    var bower = grunt.file.readJSON('bower.json'),
        component = grunt.file.readJSON('component.json'),
        version = bower.version;
    if (version != grunt.config('pkg.version')) throw new Error('Version mismatch in bower.json');
    if (version != component.version) throw new Error('Version mismatch in component.json');

    promising(this,
      ensureCleanMaster().then(function () {
        return exec('git tag -l \'' + version + '\'');
      }).then(function (result) {
        if (result.stdout.trim() !== '') throw new Error('Tag \'' + version + '\' already exists');
        grunt.config('buildtag', '');
        grunt.config('builddir', 'release');
      })
    );
  });

  grunt.registerTask('perform-release', function () {
    var version = grunt.config('pkg.version'), releasedir = grunt.config('builddir');
    grunt.task.requires([ 'prepare-release', 'build' ]);
    grunt.file.delete(releasedir + "/es5");
    grunt.file.delete(releasedir + "/es6");
    promising(this,
      system('git add \'' + releasedir + '\'').then(function () {
        return system('git commit -m \'release ' + version + '\'');
      }).then(function () {
        return system('git tag \'' + version + '\'');
      })
    );
  });


  // Helpers for custom tasks, mainly around promises / exec
  var exec = require('faithful-exec'), shjs = require('shelljs');

  function system(cmd) {
    grunt.log.write('% ' + cmd + '\n');
    return exec(cmd).then(function (result) {
      grunt.log.write(result.stderr + result.stdout);
    }, function (error) {
      grunt.log.write(error.stderr + '\n');
      throw new Error('Failed to run \'' + cmd + '\'');
    });
  }

  function promising(task, promise) {
    var done = task.async();
    promise.then(function () {
      done();
    }, function (error) {
      grunt.log.write(error + '\n');
      done(false);
    });
  }

  function ensureCleanMaster() {
    return exec('git symbolic-ref HEAD').then(function (result) {
      if (result.stdout.trim() !== 'refs/heads/master') throw new Error('Not on master branch, aborting');
      return exec('git status --porcelain');
    }).then(function (result) {
      if (result.stdout.trim() !== '') throw new Error('Working copy is dirty, aborting');
    });
  }
};
