const appRootPath = require('app-root-path'),
      path = require('path'),
      async = require('async'),
      cheerio = require('cheerio'),
      expect = require('chai').expect,
      debug = require('debug')('active');
      common = require(path.join(appRootPath.toString(), 'lib/common.js'));

exports = module.exports = function (config) {
  return function(files, metalsmith, done) {
    async.forEachOf(common.htmlfiles(files), function(file, filename, callback) {
      if (file && file.path) {
        debug('found file: ' + file.path);
        var $ = cheerio.load(file.contents);
        var prefix = file.path.split("/")[0] || "/";
        if (prefix) {
          var element = $(`#navbarTop a.nav-link[data-prefix="${prefix}"]`);
          expect(element).to.have.lengthOf.below(2);
          if ($(element).length) {
            $(element).addClass('active');
            $(element).append(`<span class="sr-only">(current)</span>`);
          }
        }
        file.contents = new Buffer($.html());
      }
      callback();
    }, function () {
      done();
    });
  }
};
