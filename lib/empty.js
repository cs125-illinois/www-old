const async = require('async');

exports = module.exports = function (config) {
  return function(files, metalsmith, done) {
    async.forEachOf(files, function(file, filename, callback) {
      if (!file.contents || !file.contents.toString().length) {
        delete files[filename];
      }
      callback();
    }, function () {
      done();
    });
  }
};

// vim: ts=2:sw=2:et
