const metalsmith = require('metalsmith');

const _ = require('underscore');

const defaults = {
  'verbose': false,
  'source': 'src',
  'destination': '.build'
};

function build(config, done) {
  config = _.extend(_.clone(defaults), config || {});
  metalsmith(__dirname)
    .source(config.source)
    .destination(config.destination)
    .clean(true)
    .build(done);
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
      build(config, done);
    });
  }
}

// vim: ts=2:sw=2:et:ft=javascript
