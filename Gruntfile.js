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
		'pkg': grunt.file.readJSON('package.json'),
    'build': {
      options: {
        source: '<%= source %>',
        destination: '<%= destination %>'
      }
    },
    'clean': ['<%= destination %>'],
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
    },
	});

  grunt.loadNpmTasks('grunt-http-server');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-google-fonts');
  grunt.loadNpmTasks('grunt-lineending');

  grunt.registerTask('after:npm-command', function () {
    touch('node_modules');
  });
  grunt.registerTask('packages', 'Update packages if needed.', function () {
    var packageJSONTime = fs.statSync('package.json').mtime.getTime();
    var doInstall = _.every(fs.readdirSync('node_modules').concat('.'), function (file) {
      return fs.statSync(path.join('node_modules', file)).mtime.getTime() < packageJSONTime;
    });
    if (doInstall) {
      grunt.loadNpmTasks('grunt-npm-command');
      grunt.task.run(['npm-command', 'after:npm-command']);
    }
  });

  grunt.registerTask('people', 'Set up staff bio directories from YAML file.', function () {
    var course = yamljs.load(path.join(__dirname, grunt.config('source'), 'course.yaml'));
    var userTemplate = `---
bio: true
# Write your biography below this header in Markdown format.
# If you want to use AsciiDoc, rename this file to have an .adoc extension.
# You can also add attributes to this front matter in YAML format.
---
`;
    _.each(course.staff, function (staff) {
      var bioPath = path.join(__dirname, grunt.config('source'), 'people', staff.email.split('@')[0], 'index.md');
      fs.mkdirsSync(path.dirname(bioPath));
      fs.writeFileSync(bioPath, userTemplate);
    });
  });

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

  require('./index.js')(grunt);
	grunt.registerTask('run', ['http-server']);
	grunt.registerTask('default', ['packages', 'build']);
  grunt.registerTask('fonts', ['googlefonts', 'lineending']);
}
// vim: ts=2:sw=2:et:ft=javascript
