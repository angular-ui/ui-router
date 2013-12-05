/*global module:false*/
module.exports = function (grunt) {

  require('load-grunt-tasks')(grunt);

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
    concat: {
      options: {
        banner: '<%= meta.banner %>\n\n'+
                '/* commonjs package manager support (eg componentjs) */\n'+
                'if (typeof module !== "undefined" && typeof exports !== "undefined" && module.exports === exports){\n'+
                '  module.exports = \'ui.router\';\n'+
                '}\n\n'+
                '(function (window, angular, undefined) {\n',
        footer: '})(window, window.angular);'
      },
      build: {
        src: [
          'src/common.js',
          'src/resolve.js',
          'src/templateFactory.js',
          'src/urlMatcherFactory.js',
          'src/urlRouter.js',
          'src/state.js',
          'src/view.js',
          'src/viewDirective.js',
          'src/stateDirectives.js',
          'src/compat.js'
        ],
        dest: '<%= builddir %>/<%= pkg.name %>.js'
      }
    },
    uglify: {
      options: {
        banner: '<%= meta.banner %>\n'
      },
      build: {
        files: {
          '<%= builddir %>/<%= pkg.name %>.min.js': ['<banner:meta.banner>', '<%= concat.build.dest %>']
        }
      }
    },
    release: {
      files: ['<%= pkg.name %>.js', '<%= pkg.name %>.min.js'],
      src: '<%= builddir %>',
      dest: 'release'
    },
    jshint: {
      all: ['Gruntfile.js', 'src/*.js', '<%= builddir %>/<%= pkg.name %>.js'],
      options: {
        eqnull: true
      }
    },
    watch: {
      files: ['src/*.js', 'test/**/*.js'],
      tasks: ['build', 'karma:background:run']
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
        configFile: 'config/karma.js'
      },
      unit: {
        singleRun: true
      },
      background: {
        background: true,
        browsers: [ grunt.option('browser') || 'PhantomJS' ]
      }
    },
    changelog: {
      options: {
        dest: 'CHANGELOG.md'
      }
    }
  });

  grunt.registerTask('default', ['build', 'jshint', 'karma:unit']);
  grunt.registerTask('build', 'Perform a normal build', ['concat', 'uglify']);
  grunt.registerTask('dist', 'Perform a clean build and generate documentation', ['clean', 'build', 'jsdoc']);
  grunt.registerTask('release', 'Tag and perform a release', ['prepare-release', 'dist', 'perform-release']);
  grunt.registerTask('dev', 'Run dev server and watch for changes', ['build', 'connect:server', 'karma:background', 'watch']);
  grunt.registerTask('sample', 'Run connect server with keepalive:true for sample app development', ['connect:sample']);

  grunt.registerTask('jsdoc', 'Generate documentation', function () {
    promising(this,
      system('node_modules/jsdoc/jsdoc -c config/jsdoc.js -d \'' + grunt.config('builddir') + '\'/doc src')
    );
  });

  grunt.registerTask('publish-pages', 'Publish a clean build, docs, and sample to github.io', function () {
    promising(this,
      ensureCleanMaster().then(function () {
        shjs.rm('-rf', 'build');
        return system('git checkout gh-pages');
      }).then(function () {
        return system('git merge master');
      }).then(function () {
        return system('grunt dist');
      }).then(function () {
        return system('git commit -a -m \'Automatic gh-pages build\'');
      }).then(function () {
        return system('git checkout master');
      })
    );
  });

  grunt.registerTask('prepare-release', function () {
    var bower = grunt.file.readJSON('bower.json'),
        component = grunt.file.readJSON('component.json'),
        version = bower.version;
    if (version != grunt.config('pkg.version')) throw 'Version mismatch in bower.json';
    if (version != component.version) throw 'Version mismatch in component.json';

    promising(this,
      ensureCleanMaster().then(function () {
        return exec('git tag -l \'' + version + '\'');
      }).then(function (result) {
        if (result.stdout.trim() !== '') throw 'Tag \'' + version + '\' already exists';
        grunt.config('buildtag', '');
        grunt.config('builddir', 'release');
      })
    );
  });

  grunt.registerTask('perform-release', function () {
    grunt.task.requires([ 'prepare-release', 'dist' ]);

    var version = grunt.config('pkg.version'), releasedir = grunt.config('builddir');
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
      throw 'Failed to run \'' + cmd + '\'';
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
      if (result.stdout.trim() !== 'refs/heads/master') throw 'Not on master branch, aborting';
      return exec('git status --porcelain');
    }).then(function (result) {
      if (result.stdout.trim() !== '') throw 'Working copy is dirty, aborting';
    });
  }
};
