const async = require('async'),
      cheerio = require('cheerio'),
      common = require('./common.js');

exports = module.exports = function (config) {
  return function(files, metalsmith, done) {
    async.forEachOf(common.htmlfiles(files), function(file, filename, callback) {
      var $ = cheerio.load(file.contents);
      $('*').each(function (i, elem) {
        var id = $(elem).attr('id');
        if (!id) {
          return;
        }
        $(elem).before('<a class="anchor" id="' + id + '"></a>');
        $(elem).removeAttr('id');
      });
      file.contents = new Buffer($.html());
      callback();
    }, function () {
      done();
    });
  }
};
