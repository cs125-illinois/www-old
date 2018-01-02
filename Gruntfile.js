const path = require('path'),
      fs = require('fs-extra'),
      _ = require('underscore'),
      touch = require('touch'),
      yamljs = require('yamljs'),
      favicons = require('favicons');

module.exports = function(grunt) {
	grunt.initConfig({
    source: 'src',
    destination: 'build',
    googlefonts: {
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
    lineending: {
      dist: {
        options: {
          overwrite: true,
        },
        files: {
          '': ['<%= source %>/fonts/fonts.css']
        }
      }
    },
	});

  grunt.loadNpmTasks('grunt-google-fonts');
  grunt.loadNpmTasks('grunt-lineending');

  grunt.registerTask('favicons', "Create favicons.", function () {
    var done = this.async();
	  favicons(path.join(grunt.config('source'), 'img/logos/cs125-60x60.png'),
      {
				appName: 'CS 125',
				appDescription: 'CS 125: Introduction to Computer Science at the University of Illinois',
				developerName: 'CS 125 Course Staff',
				developerURL: 'https://cs125.cs.illinois.edu/info/people/',
				background: "#fff",
				theme_color: "#e84a27",
				path: "/img/favicon/",
				display: "standalone",
				orientation: "portrait",
				start_url: "/?homescreen=1",
				version: "0.1",
				logging: false,
				online: false,
				preferOnline: false,
				icons: {
					android: true,
					appleIcon: true,
          appleStartup: false,
					coast: { offset: 25 },
					favicons: true,
					firefox: true,
					windows: true,
					yandex: true
				}
			},
      function (err, response) {
				if (err) {
          console.log(err);
					return done();
				}
        var files = response.images.concat(response.files);
        _.each(files, function (file) {
          var filePath = path.join(grunt.config('source'), 'img/favicon', file.name);
          fs.mkdirsSync(path.dirname(filePath));
          fs.writeFileSync(filePath, file.contents);
        });
        var faviconTemplate = 'layouts/partials/favicon.hbt';
        fs.mkdirsSync(path.dirname(faviconTemplate));
        response.html.push('\n');
        fs.writeFileSync(faviconTemplate, response.html.join('\n'));
        return done();
			});
  });

	grunt.registerTask('default', ['build']);
  grunt.registerTask('fonts', ['googlefonts', 'lineending']);
}
// vim: ts=2:sw=2:et:ft=javascript
