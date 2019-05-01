var async = require('async');

exports = module.exports = function(config) {
  return function(files, metalsmith, done) {
    async.forEachOfLimit(files, 16, function(file, filename, finished) {
      if (typeof file.path !== 'undefined' && !file.path.endsWith('/')) {
        file.path = file.path + "/";
      }
      process.nextTick(finished)
    }, function () {
      done();
    });
  }
};
