const appRootPath = require('app-root-path')
const path = require('path')
const async = require('async')
const cheerio = require('cheerio')
const expect = require('chai').expect
const debug = require('debug')('hacks')
const _ = require('lodash')
const common = require(path.join(appRootPath.toString(), 'lib/common.js'))

var preLayout = (config) => {
  return (files, metalsmith, done) => {
    _.each(files, file => {
      if (file.slides) {
        file.slides = file.link || (file.path ? "/" + file.path : undefined)
        file.separator = file.slides && (file.echo || file.youtube)
      }
    })

    let metadata = metalsmith.metadata()
    metadata.sitemap = _.map(common.htmlfiles(files), function (file, filename) {
      return {
        filename: filename,
        priority: file.priority,
        updated: file.updated,
        changefreq: file.changefreq
      }
    })
    metadata.sitemap = _.sortBy(metadata.sitemap, function (file) {
      return file.priority || 0;
    }).reverse()
    return done()
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

    async.forEachOfLimit(common.htmlfiles(files), 16, function(file, filename, callback) {
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
        if (!($(this).closest('div.table-responsive').length === 1)) {
          $(this).wrap(`<div class="table-responsive-sm"></div>`)
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

      $('img').each(function () {
        if ($(this).closest('div.img-fluid').length === 0) {
          return
        }
        let parent = $(this).closest('div.img-fluid')[0]
        $(parent).removeClass('img-fluid')
        $(this).addClass('img-fluid')
      })

      // Lazy-load YouTube videos
      $("div.youtube-container").each(function (i, elem) {
        $(elem).append('<img class="youtube-thumb" src="//i.ytimg.com/vi/' +
          $(elem).data('id') +
          '/mqdefault.jpg" alt="YouTube placeholder"><div class="play-button"><span class="fa fa-play" aria-hidden="true"></span></div>')
      })

      file.contents = new Buffer($.html());
      process.nextTick(callback)
    }, function () {
      return done();
    });
  }
};

module.exports = {
  preLayout: preLayout,
  postLayout: postLayout
}
