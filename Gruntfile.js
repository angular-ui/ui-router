//var testacular = require('testacular');

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
        ' * @license MIT License, http://www.opensource.org/licenses/MIT\n' + ' */',
      prefix: '(function (window, angular, undefined) {',
      suffix: '})(window, window.angular);'
    },
    clean: [ '<%= builddir %>' ],
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
      tasks: ['build','karma:unit']
    },
    // connect: {
      // server: {}
    // },
	karma: {
		unit: {
			configFile: 'test/test-config.js',
			runnerPort: 9999,
			singleRun: true,
			browsers: ['PhantomJS']
		}
	}
  });

  grunt.registerTask('default', ['build', 'jshint', 'karma:unit']);
  grunt.registerTask('build', 'Perform a normal build', ['concat', 'uglify']);
  grunt.registerTask('dist', 'Perform a clean build and generate documentation', ['clean', 'build', 'jsdoc']);
  grunt.registerTask('dev', 'Run dev server and watch for changes', ['build', 'watch']);

  // grunt.registerTask('test-server', 'Start testacular server', function () {
    // //Mark the task as async but never call done, so the server stays up
    // var done = this.async();
    // testacular.server.start({ configFile: 'test/test-config.js'});
  // });

  // grunt.registerTask('test', 'Run tests (make sure test-server task is run first)', function () {
    // var done = this.async();
    // grunt.util.spawn({
      // cmd: process.platform === 'win32' ? 'karma.cmd' : 'karma',
      // args: process.env.TRAVIS ? ['start', 'test/test-config.js', '--single-run', '--no-auto-watch', '--reporter=dots', '--browsers=Firefox'] : ['run']
    // }, function (error, result, code) {
      // if (error) {
        // grunt.warn("Make sure the testacular server is online: run `grunt test-server`.\n" +
          // "Also make sure you have a browser open to http://localhost:8080/.\n" +
          // error.stdout + error.stderr);
        // //the testacular runner somehow modifies the files if it errors(??).
        // //this causes grunt's watch task to re-fire itself constantly,
        // //unless we wait for a sec
        // setTimeout(done, 1000);
      // } else {
        // grunt.log.write(result.stdout);
        // done();
      // }
    // });
  // });

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
