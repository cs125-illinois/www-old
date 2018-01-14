const expect = require('chai').expect
const path = require('path')
const _ = require('underscore')
const yamljs = require('yamljs')
const fs = require('fs')
const gravatar = require('gravatar')

exports = module.exports = function(courses) {
  return function(files, metalsmith, done) {

    var metadata = metalsmith.metadata();
    _.each(courses, (courseFile, name) => {
      try {
        courses[name] = JSON.parse(files[courseFile].contents.toString())
        return
      } catch (err) { }
      courses[name] = yamljs.parse(files[courseFile].contents.toString())
    })
    metadata.course = courses

    _.each(metadata.course, course => {
      course.staffSorted = _.chain(course.staff)
        .sortBy(function (staff) {
          return staff.name;
        })
        .sortBy(function (staff) {
          if (staff.role === 'Instructor') {
            return 0;
          } else if (staff.role === 'TA') {
            return 1;
          } else if (staff.role === 'Doyen' || staff.role === 'Volunteer') {
            return 2;
          }
          return Infinity;
        }).value();

      course.staffBySlug = {};
      course.staffByRole = {};
      var staffByEmail = {};
      _.each(course.staffSorted, function (staff) {
        if (!(staff.role in course.staffByRole)) {
          course.staffByRole[staff.role] = [];
        }
        course.staffByRole[staff.role].push(staff);
        course.staffBySlug[staff.email.split('@')[0]] = staff;
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
      course.timesSorted = _.chain(course.times)
        .sortBy(function(time) {
          return time.start;
        })
        .sortBy(function (time) {
          return daySort[time.days];
        })
        .value();

      course.timesByType = {};
      _.each(course.timesSorted, function (time) {
        if (!(time.type in course.timesByType)) {
          course.timesByType[time.type] = [];
        }
        course.timesByType[time.type].push(time);
        time.instructor = staffByEmail[time.instructor];
        time.doyens = _.map(time.doyens, function (doyen) {
          return staffByEmail[doyen];
        });
      });

      _.each(course.staff, function (staff) {

        staff.photo = gravatar.url(staff.email, {
          s: '460',
          d: encodeURI('https://cs125.cs.illinois.edu/img/logos/cs125-460x460.png'),
        });
      });

      return done();
    })
  }
};
