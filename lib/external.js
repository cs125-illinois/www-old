const appRootPath = require('app-root-path'),
      path = require('path'),
      async = require('async'),
      cheerio = require('cheerio'),
      expect = require('chai').expect,
      debug = require('debug')('external'),
      common = require(path.join(appRootPath.toString(), 'lib/common.js'));

exports = module.exports = function (config) {
  return function(files, metalsmith, done) {
    async.forEachOf(common.htmlfiles(files), function(file, filename, callback) {
      debug('found file: ' + file.path);

      $("a[href^='http://'], a[href^='https://'], a[href^='//']")
        .not('.noexternal')
        .attr("target", "_blank");
      $("a[href^='http://'], a[href^='https://'], a[href^='//']")
        .not(":has(> img:first-child)")
        .not('.noexternal')
        .addClass('external');
      $("a[href^='http://'], a[href^='https://'], a[href^='//']").each(function () {
        if ($(this).parents('.noexternal').length) {
          $(this).removeClass('external');
        }
      });
      $("a[href$='.pdf']")
        .not('.nopdf')
        .append(" (PDF)")
        .attr("target", "_blank");

      file.contents = new Buffer($.html());
      return callback();
    }, function () {
      done();
    });
  }
};
