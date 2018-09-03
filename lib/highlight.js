var async = require('async'),
    _ = require('underscore'),
    cheerio = require('cheerio'),
    common = require('./common.js');

function doHighlight(file, filename) {
	var $ = cheerio.load(file.contents);

	$('div.listingblock pre').each(function (i, elem) {
		var code = $(elem).children('code');
		if ($(code).length == 0) {
			code = elem;
		}
		var classes = $(code).attr('class') || "";
		var match = classes.match(/(?:^|\w)language-(.+)(?:$|\w)/);
    $(code).addClass('spelling_exception');
		if (match) {
			$(code).addClass('lang-' + match[1]);
      file.highlightjs = true
		} else {
			return;
		}
	});

  file.contents = new Buffer($.html());
	return;
};

exports = module.exports = function(options) {
  return function(files, metalsmith, done) {
		async.forEachOfLimit(common.htmlfiles(files), 16, function (file, filename, finished) {
			doHighlight(file, filename);
			finished();
		}, function () {
			done();
		});
  }
}
module.exports.doHighlight = doHighlight;
