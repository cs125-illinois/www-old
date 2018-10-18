const async = require('async'),
      cheerio = require('cheerio'),
      common = require('./common.js');

exports = module.exports = function (config) {
  return function(files, metalsmith, done) {
    async.forEachOfLimit(common.htmlfiles(files), 16, function(file, filename, callback) {
      if (file.slides) {
        process.nextTick(callback)
        return
      }
      var $ = cheerio.load(file.contents);

      if (file.doTOC !== false) {
        var first = true;
        file.TOC = [];
        $('h2').each(function () {
          var children = [];
          $(this).parent().find('h3').each(function () {
            children.push({ text: $(this).text(), id: $(this).attr('id') });
          });
          if (first) {
            file.TOC.push({ text: $(this).text(), id: "top", children: children });
            first = false;
          } else {
            file.TOC.push({ text: $(this).text(), id: $(this).attr('id'), children: children });
          }
        });
      }

      $('h1,h2,h3,h4,h5,h6,p').each(function (i, elem) {
        var id = $(elem).attr('id');
        if (!id) {
          return;
        }
        $(elem).before('<a class="anchor" id="' + id + '"></a>');
        $(elem).removeAttr('id');
      });
      file.contents = new Buffer($.html());
      process.nextTick(callback)
    }, function () {
      done();
    });
  }
};

// vim: ts=2:sw=2:et
