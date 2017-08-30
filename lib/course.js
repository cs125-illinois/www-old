const expect = require('chai').expect,
      path = require('path'),
      _ = require('underscore');

exports = module.exports = function(config) {
  return function(files, metalsmith, done) {

    var metadata = metalsmith.metadata();
    if (!(metadata.course)) {
      return done();
    }

    metadata.course.staffSorted = _.chain(metadata.course.staff)
      .sortBy(function (staff) {
        return staff.name;
      })
      .sortBy(function (staff) {
        if (staff.role === 'Instructor') {
          return 0;
        } else if (staff.role === 'TA') {
          return 1;
        } else if (staff.role === 'Doyen') {
          return 2;
        }
        return Infinity;
      }).value();

    metadata.course.staffBySlug = {};
    metadata.course.staffByRole = {};
    var staffByEmail = {};
    _.each(metadata.course.staffSorted, function (staff) {
      if (!(staff.role in metadata.course.staffByRole)) {
        metadata.course.staffByRole[staff.role] = [];
      }
      metadata.course.staffByRole[staff.role].push(staff);
      metadata.course.staffBySlug[staff.email.split('@')[0]] = staff;
      staffByEmail[staff.email] = staff;
    });

    var daySort = {
      'MWF': 0,
      'M': 1,
      'T': 2,
      'W': 3,
      'R': 4,
      'F': 5
    }
    metadata.course.timesSorted = _.chain(metadata.course.times)
      .sortBy(function(time) {
        return time.start;
      })
      .sortBy(function (time) {
        return daySort[time.days];
      })
      .value();

    metadata.course.timesByType = {};
    _.each(metadata.course.timesSorted, function (time) {
      if (!(time.type in metadata.course.timesByType)) {
        metadata.course.timesByType[time.type] = [];
      }
      metadata.course.timesByType[time.type].push(time);
      time.instructor = staffByEmail[time.instructor];
      time.doyens = _.map(time.doyens, function (doyen) {
        return staffByEmail[doyen];
      });
    });

    return done();
  }
};
