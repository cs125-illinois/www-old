const async = require('async'),
      cheerio = require('cheerio'),
      common = require('./common.js'),
      _ = require('underscore');

exports = module.exports = function (config) {
  return function(files, metalsmith, done) {
    async.forEachOfLimit(common.htmlfiles(files), 16, function(file, filename, callback) {
      var $ = cheerio.load(file.contents);

      $('iframe').not('.nolazy').each(function () {
        var attr = encodeURI(JSON.stringify(this.attribs));
        $(this).replaceWith(`<div class="lazyiframe" data-attribs="${attr}"></div>`)
      });

      file.contents = Buffer.from($.html());
      process.nextTick(callback)
    }, function () {
      done();
    });
  }
};

// vim: ts=2:sw=2:et
