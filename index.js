const metalsmith = require('metalsmith'),
      ignore = require('metalsmith-ignore'),
      buildDate = require('metalsmith-build-date'),
      drafts = require('metalsmith-drafts'),
      registerPartials = require('./lib/registerPartials'),
      inPlace = require('metalsmith-in-place'),
      layouts = require('metalsmith-layouts'),
      webpack = require('ms-webpack');

const tmp = require('tmp'),
      fs = require('fs'),
      removeEmptyDirectories = require('remove-empty-directories'),
      rsync = require('rsync');

const _ = require('underscore');

const defaults = {
  'verbose': false,
  'source': 'src',
  'destination': 'build'
};

function build(config, done) {
  config = _.extend(_.clone(defaults), config || {});

  const temporaryDestination = tmp.dirSync({ mode: 0775 }).name;
  var webpackConfiguration = require('./webpack.config.js');
  webpackConfiguration.output.path = temporaryDestination;

  metalsmith(__dirname)
    .source(config.source)
    .destination(temporaryDestination)
    .use(ignore([
      'fonts/*',
      'css/*'
    ]))
    .use(buildDate())
    .use(drafts())
    .use(registerPartials())
    .use(webpack(webpackConfiguration))
    .use(inPlace({
      pattern: '**/*.html.hbs',
    }))
    .use(layouts({
      engine: 'handlebars'
    }))
    .build(function(err) {
      if (err) {
        done(err);
      } else {
        removeEmptyDirectories(temporaryDestination);
        var copyToRealDestination = new rsync()
          .flags('rlgoDc')
          .delete()
          .source(temporaryDestination + "/")
          .destination(config.destination);
        copyToRealDestination.execute(function (err) {
          done(err);
        });
      }
    });
}

if (require.main === module) {
  var config = require('minimist')(process.argv.slice(2));
  build(config, function(err) {
    if (err) {
      throw err;
    }
  });
} else {
  module.exports = function (grunt) {
    grunt.registerTask('build', 'Build the site.', function(config) {
      var done = this.async();
      build(this.options(), done);
    });
  }
}

// vim: ts=2:sw=2:et:ft=javascript
