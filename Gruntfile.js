module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
	});
	require('./index.js')(grunt);
	grunt.registerTask('default', ['build']);
}
// vim: ts=2:sw=2:et:ft=javascript
