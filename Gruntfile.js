const path = require('path'),
      fs = require('fs'),
      _ = require('underscore'),
      touch = require('touch');

module.exports = function(grunt) {
	grunt.initConfig({
    source: 'src',
    destination: 'build',
		'pkg': grunt.file.readJSON('package.json'),
    'build': {
      options: {
        source: '<%= source %>',
        destination: '<%= destination %>'
      }
    },
    'clean': ['<%= destination %>'],
    'http-server': {
      'build': {
        root: path.join(__dirname, '<%= destination %>'),
        port: 8125,
        host: "127.0.0.1",
        cache: 0,
        showDir: false,
        autoIndex: true,
        ext: "html",
        runInBackground: false,
        openBrowser: true
      }
    },
    'npm-command': {
      options: {
        cmd: 'install',
      },
      quiet: {
        options: {
          args: '--progress=false'
        }
      }
    },
    'googlefonts': {
      build: {
        options: {
          fontPath: '<%= source %>/fonts/',
          cssFile: '<%= source %>/fonts/fonts.css',
          httpPath: './',
          fonts: [
            {
              family: 'Open Sans',
              subsets: [
                'latin',
                'latin-ext',
              ],
              styles: [
                '400', '700', '400i', '600', '700'
              ]
            },
            {
              family: 'Overpass',
              subsets: [
                'latin',
                'latin-ext',
              ],
              styles: [
                '400', '700', '400i', '600', '700'
              ]
            }
          ]
        }
      }
    },
    'lineending': {
      dist: {
        options: {
          overwrite: true,
        },
        files: {
          '': ['<%= source %>/fonts/fonts.css']
        }
      }
    }
	});

  grunt.loadNpmTasks('grunt-http-server');
  grunt.loadNpmTasks('grunt-npm-command');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-google-fonts');
  grunt.loadNpmTasks('grunt-lineending');

	require('./index.js')(grunt);
  grunt.registerTask('after:npm-command', function () {
    touch('node_modules');
  });
  grunt.registerTask('packages', 'Update packages if needed.', function () {
    var packageJSONTime = fs.statSync('package.json').mtime.getTime();
    var doInstall = _.every(fs.readdirSync('node_modules').concat('.'), function (file) {
      return fs.statSync(path.join('node_modules', file)).mtime.getTime() < packageJSONTime;
    });
    if (doInstall) {
      grunt.task.run(['npm-command', 'after:npm-command']);
    }
  });

	grunt.registerTask('run', ['http-server']);
	grunt.registerTask('default', ['packages', 'build']);
  grunt.registerTask('fonts', ['googlefonts', 'lineending']);
}
// vim: ts=2:sw=2:et:ft=javascript
