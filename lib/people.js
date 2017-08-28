const expect = require('chai').expect,
      path = require('path'),
      _ = require('underscore'),
      cheerio = require('cheerio');

exports = module.exports = function (config) {
  return function(files, metalsmith, done) {
    var metadata = metalsmith.metadata();
    if (!(metadata.course)) {
      return done();
    }
    _.each(metadata.course.staff, function (staff) {
      var slug = staff.email.split('@')[0];
      var staffPath = path.join('people', slug, 'index.html');
      if (!(staffPath in files)) {
        return;
      }
      var staffBio = files[staffPath];
      if (files[staffPath].contents.toString().trim().length === 0) {
        delete(files[staffPath]);
        console.log(staff.email);
      } else {
        staff.link = files[staffPath];
      }
    });
    return done();
  }
};
