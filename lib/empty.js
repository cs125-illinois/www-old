const async = require('async');

exports = module.exports = function (config) {
  return function(files, metalsmith, done) {
    async.forEachOfLimit(files, 16, function(file, filename, callback) {
      if ((config && config.notempty) && file.notempty) {
        process.nextTick(callback)
        return
      }
      if (!file.contents || !file.contents.toString().length) {
        delete files[filename];
      }
      process.nextTick(callback)
    }, function () {
      done();
    });
  }
};

// vim: ts=2:sw=2:et
