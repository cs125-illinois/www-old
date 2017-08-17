const metalsmith = require('metalsmith'),
      tmp = require('tmp'),
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
  var temporaryDestination = tmp.dirSync().name;
  metalsmith(__dirname)
    .source(config.source)
    .destination(temporaryDestination)
    .clean(true)
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
