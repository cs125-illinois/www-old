const appRootPath = require('app-root-path'),
      path = require('path'),
      async = require('async'),
      cheerio = require('cheerio'),
      expect = require('chai').expect,
      debug = require('debug')('hacks'),
      common = require(path.join(appRootPath.toString(), 'lib/common.js'));

exports = module.exports = function (config) {
  return function(files, metalsmith, done) {
    async.forEachOf(common.htmlfiles(files), function(file, filename, callback) {
      var $ = cheerio.load(file.contents);

      // AsciiDoctor generates bad alignment classes
      $('.halign-center').each(function (i, elem) {
        $(elem).removeClass('halign-center');
        $(elem).addClass('text-center');
      });

      $('table').each(function (i, elem) {
        if (!($(elem).hasClass('colgroup'))) {
          $(elem).find('colgroup').remove();
        }
      });

      file.contents = new Buffer($.html());
      return callback();
    }, function () {
      return done();
    });
  }
};
