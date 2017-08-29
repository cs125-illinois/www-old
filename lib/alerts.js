const appRootPath = require('app-root-path'),
      path = require('path'),
      async = require('async'),
      cheerio = require('cheerio'),
      expect = require('chai').expect,
      debug = require('debug')('alerts');
      common = require(path.join(appRootPath.toString(), 'lib/common.js'));

exports = module.exports = function (config) {
  return function(files, metalsmith, done) {
    async.forEachOf(common.htmlfiles(files), function(file, filename, callback) {

      debug('found file: ' + file.path);
      $("div.tip")
        .addClass("alert alert-success")
        .attr("role", "alert")
        .find("td.icon")
        .replaceWith('<td class="icon"><span class="glyphicon glyphicon-ok" aria-hidden="true"></span></td>');

      $("div.warning")
        .addClass("alert alert-warning")
        .attr("role", "alert")
        .find("td.icon")
        .replaceWith('<td class="icon"><span class="glyphicon glyphicon-alert" aria-hidden="true"></span></td>');

      $("div.caution")
        .addClass("alert alert-danger")
        .attr("role", "alert")
        .find("td.icon")
        .replaceWith('<td class="icon"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></td>');

      file.contents = new Buffer($.html());
      callback();
    }, function () {
      done();
    });
  }
};
