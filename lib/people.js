const expect = require('chai').expect,
      path = require('path'),
      _ = require('underscore'),
      gravatar = require('gravatar');

exports = module.exports = function(config) {
  return function(files, metalsmith, done) {

    var metadata = metalsmith.metadata();
    if (!(metadata.course)) {
      return done();
    }

    _.each(metadata.course.staff, function (staff) {

      staff.photo = gravatar.url(staff.email, {
        s: '460',
        d: encodeURI('https://cs125.cs.illinois.edu/img/logos/cs125-460x460.png'),
      });

      var slug = staff.email.split('@')[0];
      var staffPath = path.join('people', slug, 'index.html');
      if (!(staffPath in files)) {
        return;
      }
      var staffBio = files[staffPath];
      if (files[staffPath].contents.toString().trim().length === 0) {
        delete(files[staffPath]);
      } else {
        staff.link = files[staffPath];
      }
    });

    return done();
  }
};
