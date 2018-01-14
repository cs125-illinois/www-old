const appRootPath = require('app-root-path'),
      path = require('path'),
      async = require('async'),
      cheerio = require('cheerio'),
      expect = require('chai').expect,
      debug = require('debug')('hacks'),
      common = require(path.join(appRootPath.toString(), 'lib/common.js'));

var preLayout = function (config) {
  return function(files, metalsmith, done) {
    return done();
  }
};

var postLayout = function (config) {
  return function(files, metalsmith, done) {
    let $ = cheerio.load(files['index.html'].contents)
    let metadata = metalsmith.metadata()
    metadata.redirects = []
    $('#navbarTop a.nav-link').each((i, element) => {
      if ($(element).data('redirect')) {
        metadata.redirects.push({
          from: $(element).data('redirect'),
            to: $(element).attr('href')
        })
      }
    })

    async.forEachOf(common.htmlfiles(files), function(file, filename, callback) {
      var $ = cheerio.load(file.contents);

      // AsciiDoctor generates bad alignment classes
      $('.halign-center').each(function () {
        $(this).removeClass('halign-center');
        $(this).addClass('text-center');
      });

      $('table').each(function () {
        if (!($(this).hasClass('colgroup'))) {
          $(this).find('colgroup').remove();
        }
      });
      $('table').not('.datatables').each(function () {
        $('table').addClass('notdatatables');
      });

      // Add DataTables CSS if needed
      if ($(".datatables").length > 0) {
        $("head").append('<link rel="stylesheet" href="https://cdn.datatables.net/1.10.15/css/jquery.dataTables.min.css">');
        if (file.datatables) {
          $(".datatables").each(function () {
            if ($(this).attr('id') && ($(this).attr('id') in file.datatables)) {
              $(this).attr('data-datatables', JSON.stringify(file.datatables[$(this).attr('id')]));
            } else {
              $(this).attr('data-datatables', JSON.stringify({}));
            }
          });
        }
      }

      file.contents = new Buffer($.html());
      return callback();
    }, function () {
      return done();
    });
  }
};

module.exports = {
  preLayout: preLayout,
  postLayout: postLayout
}
