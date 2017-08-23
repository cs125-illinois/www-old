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
        port: 8008,
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
	});

  grunt.loadNpmTasks('grunt-http-server');
  grunt.loadNpmTasks('grunt-npm-command');
  grunt.loadNpmTasks('grunt-contrib-clean');

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
}
// vim: ts=2:sw=2:et:ft=javascript
