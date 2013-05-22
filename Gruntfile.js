/*global module:false*/
module.exports = function (grunt) {

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-karma');
  
  // Project configuration.
  grunt.initConfig({
    builddir: 'build',
    pkg: grunt.file.readJSON('package.json'),
    meta: {
      banner: '/**\n' + ' * <%= pkg.description %>\n' +
        ' * @version v<%= pkg.version %> - ' + '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
        ' * @link <%= pkg.homepage %>\n' +
        ' * @license MIT License, http://www.opensource.org/licenses/MIT\n' + ' */'
    },
    clean: [ '<%= builddir %>' ],
    concat: {
      options: {
        banner: '<%= meta.banner %>\n(function (window, angular, undefined) {\n',
        footer: '})(window, window.angular);'
      },
      build: {
        src: [
          'src/common.js',
          'src/templateFactory.js',
          'src/urlMatcherFactory.js',
          'src/urlRouter.js',
          'src/state.js',
          'src/viewDirective.js',
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
    jshint: {
      all: ['Gruntfile.js', 'src/*.js', '<%= builddir %>/<%= pkg.name %>.js'],
      options: {
        eqnull: true
      }
    },
    watch: {
      files: ['src/*.js', 'test/**/*.js'],
      tasks: ['build', 'karma:debug:run']
    },
    connect: {
      server: {}
    },
  karma: {
    unit: {
      configFile: 'test/test-config.js',
      runnerPort: 9999,
      singleRun: true,
      browsers: ['PhantomJS']
    },
    
    debug: {
      configFile: 'test/test-config.js',
      runnerPort: 9999,
      background: true,
      browsers: ['Chrome']
    }
  }
  });

  grunt.registerTask('default', ['build', 'jshint', 'karma:unit']);

  grunt.registerTask('build', 'Perform a normal build', ['concat', 'uglify']);
  grunt.registerTask('dist', 'Perform a clean build and generate documentation', ['clean', 'build', 'jsdoc']);
  grunt.registerTask('dev', 'Run dev server and watch for changes', ['build', 'connect', 'karma:debug', 'watch']);

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

  grunt.registerTask('jsdoc', 'Generate documentation', function () {
    promising(this,
      system("node_modules/jsdoc/jsdoc -c jsdoc-conf.json -d '" + grunt.config('builddir') + "'/doc src")
    );
  });

  grunt.registerTask('publish-pages', 'Publish a clean build, docs, and sample to github.io', function () {
    promising(this,
      exec('git symbolic-ref HEAD').then(function (result) {
        if (result.stdout.trim() !== 'refs/heads/master') throw 'Not on master branch, aborting';
      }).then(function () {
        return exec('git status --porcelain');
      }).then(function (result) {
        if (result.stdout.trim() !== '') throw 'Working copy is dirty, aborting';
      }).then(function () {
        shjs.rm('-rf', 'build');
        return system('git checkout gh-pages');
      }).then(function () {
        return system('grunt dist');
      }).then(function () {
        return system('git commit -a -m "Automatic gh-pages build"');
      }).then(function () {
        return system('git checkout master');
      })
    );
  });
};
