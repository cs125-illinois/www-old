const expect = require('chai').expect,
      path = require('path'),
      _ = require('lodash'),
      gravatar = require('gravatar');

exports = module.exports = (config) => {
  return (files, metalsmith, done) => {

    let metadata = metalsmith.metadata();
    if (!(metadata.course)) {
      return done()
    }

    _.each(metadata.course, year => {
      _.each(year.staff, staff => {
        staff.photo = gravatar.url(staff.email, {
          s: '460',
          d: encodeURI('https://cs125.cs.illinois.edu/img/logos/cs125-460x460.png'),
        })
      })
    })

    return done()
  }
}
