const metalsmith = require('metalsmith'),
      buildDate = require('metalsmith-build-date'),
      drafts = require('metalsmith-drafts'),
      partial = require('metalsmith-partial'),
      inPlace = require('metalsmith-in-place'),
      layouts = require('metalsmith-layouts'),
      ignore = require('metalsmith-ignore'),
      webpack = require('ms-webpack');

const tmp = require('tmp'),
      removeEmptyDirectories = require('remove-empty-directories'),
      rsync = require('rsync');

const _ = require('underscore');

const defaults = {
  'verbose': false,
  'source': 'src',
  'destination': 'build'
};

var webpackConfiguration = require('./webpack.config.js');

function build(config, done) {
  config = _.extend(_.clone(defaults), config || {});
  var temporaryDestination = tmp.dirSync().name;
  webpackConfiguration.output.path = temporaryDestination;
  metalsmith(__dirname)
    .source(config.source)
    .destination(temporaryDestination)
    .clean(true)
    .use(buildDate())
    .use(drafts())
    .use(partial({
      directory: './layouts/partials',
      engine: 'handlebars'
    }))
    .use(inPlace({
      pattern: '**/*.html.hbs',
    }))
    .use(layouts({
      engine: 'handlebars'
    }))
    .use(ignore([
      'fonts/*',
      'css/*'
    ]))
    .use(webpack(webpackConfiguration))
    .use(function (files, metalsmith, done) {
      var metadata = metalsmith.metadata();
      console.log(JSON.stringify(metadata.webpack.assets, null, 2));
      done();
    })
    .build(function(err) {
      if (err) {
        done(err);
      } else {
        removeEmptyDirectories(temporaryDestination);
        var copyToRealDestination = new rsync()
          .flags('rlpgoDc')
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
