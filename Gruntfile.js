var testacular = require('testacular');

/*global module:false*/
module.exports = function (grunt) {

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');

  // Project configuration.
  grunt.initConfig({
    builddir: 'build',
    pkg: grunt.file.readJSON('package.json'),
    meta: {
      banner: '/**\n' + ' * <%= pkg.description %>\n' +
        ' * @version v<%= pkg.version %> - ' + '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
        ' * @link <%= pkg.homepage %>\n' +
        ' * @license MIT License, http://www.opensource.org/licenses/MIT\n' + ' */',
      prefix: '(function (window, angular, undefined) {',
      suffix: '})(window, window.angular);'
    },
    concat: {
      build: {
        src: [
          '<banner:meta.banner>',
          '<banner:meta.prefix>',
          'src/common.js',
          'src/templateFactory.js',
          'src/urlMatcherFactory.js',
          'src/urlRouter.js',
          'src/state.js',
          'src/viewDirective.js',
          'src/compat.js',
          '<banner:meta.suffix>'
        ],
        dest: '<%= builddir %>/<%= pkg.name %>.js'
      }
    },
    uglify: {
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
      tasks: 'build test'
    }
  });

  // Default task.
  grunt.registerTask('build', ['concat', 'uglify']);
  grunt.registerTask('dist', ['build', 'jsdoc']);
  grunt.registerTask('default', ['build', 'jshint', 'test']);

  grunt.registerTask('test-server', 'Start testacular server', function () {
    //Mark the task as async but never call done, so the server stays up
    var done = this.async();
    testacular.server.start({ configFile: 'test/test-config.js'});
  });

  grunt.registerTask('test', 'Run tests (make sure test-server task is run first)', function () {
    var done = this.async();
    grunt.util.spawn({
      cmd: process.platform === 'win32' ? 'testacular.cmd' : 'testacular',
      args: process.env.TRAVIS ? ['start', 'test/test-config.js', '--single-run', '--no-auto-watch', '--reporter=dots', '--browsers=Firefox'] : ['run']
    }, function (error, result, code) {
      if (error) {
        grunt.warn("Make sure the testacular server is online: run `grunt test-server`.\n" +
          "Also make sure you have a browser open to http://localhost:8080/.\n" +
          error.stdout + error.stderr);
        //the testacular runner somehow modifies the files if it errors(??).
        //this causes grunt's watch task to re-fire itself constantly,
        //unless we wait for a sec
        setTimeout(done, 1000);
      } else {
        grunt.log.write(result.stdout);
        done();
      }
    });
  });

  grunt.registerTask('jsdoc', 'Generate documentation', function () {
    var done = this.async();
    grunt.util.spawn({
      cmd: 'node_modules/jsdoc/jsdoc',
      args: [ '-c', 'jsdoc-conf.json', '-d', grunt.config('builddir') + '/doc', 'src' ]
    }, function (error, result, code) {
      if (error) {
        grunt.log.write(error.stderr + '\n');
        grunt.warn("jsdoc generation failed");
      } else {
        grunt.log.write(result.stderr + result.stdout);
      }
      done();
    });
  });
};
