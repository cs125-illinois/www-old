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
      done();
    });
  }
};

// vim: ts=2:sw=2:et
