const path = require('path');

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
    }
	});
	require('./index.js')(grunt);
  grunt.loadNpmTasks('grunt-http-server');
	grunt.registerTask('default', ['build']);
}
// vim: ts=2:sw=2:et:ft=javascript
