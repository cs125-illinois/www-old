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
      if (file && typeof(file.path) !== 'undefined') {
        debug('found file: ' + file.path);
        var $ = cheerio.load(file.contents);
        $("a[data-active], span[data-active]").each(function () {
          var re = new RegExp($(this).data('active'));
          if (file.path.match(re) != null) {
            $(this).addClass('active');
            $(this).append(`<span class="sr-only">(current)</span>`);
            $(this).parents().each(function () {
              $(this).siblings('a.nav-link').not('.active').each(function () {
                $(this).addClass('active');
              });
            });
            $(this).closest('.collapse').each(function () {
              var dropdownID = $(this).attr('id');
              if (dropdownID === 'sidebar') {
                return
              }
              $(this).addClass('show');
            });
          }
        });
        $("a[data-active]").each(function () {
          $(this).removeAttr('data-active');
        });
        $("nav a").each(function () {
          if ($(this).attr('href') === ("/" + file.path)) {
            $(this).attr('onclick', "return false;")
          }
        });
        file.contents = new Buffer($.html());
      }
      callback();
    }, function () {
      done();
    });
  }
};

// vim: ts=2:sw=2:et
