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
