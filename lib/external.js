const appRootPath = require('app-root-path'),
      path = require('path'),
      async = require('async'),
      cheerio = require('cheerio'),
      expect = require('chai').expect,
      debug = require('debug')('external'),
      common = require(path.join(appRootPath.toString(), 'lib/common.js'));

function doExternal(contents) {
  var $ = cheerio.load(contents);
  $("a[href^='http://'], a[href^='https://'], a[href^='//'], a.external")
    .not('.noexternal')
    .attr("target", "_blank");
  $("a[href^='http://'], a[href^='https://'], a[href^='//'], a.external")
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

  $("a.noclick").removeClass('external').addClass('spelling_exception');

  return Buffer.from($.html());
};

exports = module.exports = function (config) {
  return function(files, metalsmith, done) {
    async.forEachOfLimit(common.htmlfiles(files), 16, function(file, filename, callback) {
      debug('found file: ' + file.path);
      file.contents = doExternal(file.contents);
      process.nextTick(callback)
      return
    }, function () {
      done();
    });
  }
};
module.exports.external = doExternal
