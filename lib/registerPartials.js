const _ = require('underscore'),
      nodeDir = require('node-dir'),
      handlebars = require('handlebars'),
      path = require('path'),
      fs = require('fs');

const defaults = {
  verbose: true,
  directory: './layouts/partials'
}

exports = module.exports = function(config) {
  config = _.extend(_.clone(defaults), (config || {}));

  return function(files, metalsmith, done) {
    nodeDir.files(config.directory, function (err, files) {
      _.chain(files)
        .filter(function (file) {
          return path.extname(file) === '.hbt';
        })
        .each(function (file) {
          handlebars.registerPartial(
            path.relative(config.directory, file).slice(0, -1 * path.extname(file).length),
            fs.readFileSync(file).toString()
          )
        })
      handlebars.registerHelper('and_list', function (items) {
        var list = items.map(function (e) {
          return "<span style='white-space: nowrap;'>" + e + "</span>";
        });
        if (list.length == 1) {
          list = list[0];
        } else if (list.length == 2) {
          list = list.join(" and ");
        } else {
          comma_list = list.slice(0, -1);
          list = comma_list.join(", ") + ", and " + list.slice(-1)[0];
        }
        return new handlebars.SafeString(list);
      });
      handlebars.registerHelper('or_list', function (items) {
        var list = items.map(function (e) {
          return "<span style='white-space: nowrap;'>" + e + "</span>";
        });
        if (list.length == 1) {
          list = list[0];
        } else if (list.length == 2) {
          list = list.join(" or ");
        } else {
          comma_list = list.slice(0, -1);
          list = comma_list.join(", ") + ", or " + list.slice(-1)[0];
        }
        return new handlebars.SafeString(list);
      });
      var helpers = require('handlebars-helpers')();
      done();
    });
  }
};

// vim: ts=2:sw=2:et
