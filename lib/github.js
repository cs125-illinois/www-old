var async = require('async'),
		path = require('path'),
    _ = require('underscore'),
    git = require('git-rev-sync');

function doGithub(file, filename) {
	file.github = {
		'blob': 'https://github.com/cs125-illinois/www/blob/master/src/' + filename,
		'commits': 'https://github.com/cs125-illinois/www/commits/master/src/' + filename,
		'commit_id': git.short(),
		'commit': 'https://github.com/cs125-illinois/www/commit/' + git.long()
	}
	return;
};

function githubFiles(files) {
  return _.pick(files, function(file, filename) {
		return file.doGithub;
  });
}

module.exports = function(config) {
  return function(files, metalsmith, done) {
    async.forEachOfLimit(githubFiles(files), 16, function(file, filename, finished) {
      doGithub(file, filename);
      process.nextTick(finished)
    }, function () {
      done();
    });
  }
};

