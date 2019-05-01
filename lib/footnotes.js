const appRootPath = require('app-root-path'),
      path = require('path'),
      async = require('async'),
      cheerio = require('cheerio'),
      external = require(path.join(appRootPath.toString(), 'lib/external.js')).external,
      common = require(path.join(appRootPath.toString(), 'lib/common.js'));

function doFootnotes(file) {
  function escapeHtml(string) {
    var entityMap = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': '&quot;',
      "'": '&#39;',
      "/": '&#x2F;'
    };
    return String(string).replace(/[&<>"'\/]/g, function (s) {
        return entityMap[s];
        });
  }
  var $ = cheerio.load(file.contents);
  var parsed_snippet;
  var footnotes = $("sup.footnote, span.footnote");
  if (footnotes.length == 0) {
    return;
  }

  if (file.snippet) {
    parsed_snippet = cheerio.load(file.snippet);
  }

  var back_references = [];
  $(footnotes).each(function (i, elem) {
    back_references.push("#" + $("a", elem).first().attr('id'));
  });
  $("a").each(function (i, elem) {
    if (back_references.indexOf($(elem).attr('href')) != -1) {
      $(elem).remove();
    }
  });
  $("sup.footnote, span.footnote").each(function (i, elem) {
    var link = $("a", elem).first();
    var index = $(link).text();
    var text = $("#" + $(link).attr('href').slice(1)).html().trim();
    if (this.tagName == "sup" && text.indexOf(". ") == 0) {
      text = text.slice(2);
    }
    text = escapeHtml(external(text));
    var new_element = '<span class="badge badge-illinois-orange" ' +
      'data-toggle="popover" data-placement="top" ' +
      'data-html="true" ' +
      'data-content="' + text + '">' + index + '</span>';
    $(elem).replaceWith($(new_element));
  });
  if (file.snippet) {
    parsed_snippet("sup.footnote, span.footnote").each(function (i, elem) {
      var link = $("a", elem).first();
      var index = $(link).text();
      var text = $("#" + $(link).attr('href').slice(1)).html().trim();
      if (this.tagName == "sup" && text.indexOf(". ") == 0) {
        text = text.slice(2);
      }
      text = escapeHtml(external(text));
      var new_element = '<span class="badge badge-illinois-orange" ' +
        'data-toggle="popover" data-placement="top" ' +
        'data-html="true" ' +
        'data-content="' + text + '">' + index + '</span>';
      parsed_snippet(elem).replaceWith($(new_element));
    });
  }
  $("div#footnotes").remove();

  file.contents = new Buffer($.html());
  if (file.snippet) {
    file.snippet = new Buffer(parsed_snippet.html());
  }
  return;
};

exports = module.exports = function(config) {
  return function(files, metalsmith, done) {
    async.forEachOfLimit(common.htmlfiles(files), 16, function(file, filename, finished) {
      doFootnotes(file);
      process.nextTick(finished)
    }, function () {
      done();
    });
  }
};
module.exports.doFootnotes = doFootnotes
