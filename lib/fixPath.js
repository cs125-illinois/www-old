var async = require('async');

exports = module.exports = function(config) {
  return function(files, metalsmith, done) {
    async.forEachOf(files, function(file, filename, finished) {
      if (typeof file.path !== 'undefined' && !file.path.endsWith('/')) {
        file.path = file.path + "/";
      }
      finished();
    }, function () {
      done();
    });
  }
};
