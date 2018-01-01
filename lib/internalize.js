const debug = require('debug')('metalsmith-internalize');
const path = require('path')
const fs = require('fs')
const async = require('async')
const _ = require('underscore')
const cheerio = require('cheerio')
let _request = require('request')
const request = _request.defaults({ jar: _request.jar() })
const minimatch = require('minimatch')
const moment = require('moment')
const MD5 = require('md5')


var defaults = {
  default: false,
	failWithoutNetwork: true,
	failErrors: true,
	cacheImages: true,
	imgDirectory: 'img',
	recheckDays: 7
}

function processConfig(config, src) {
	config = config || {}
	config = _.extend(_.clone(defaults), config)
	if (src) {
		config.imgDir = path.join(src, config.imgDirectory)
	}
	return config
}

function stripURL(url) {
	url = url.split("#")[0]
	url = url.split("?")[0]
	return url
}

function internalize(config) {
	return function(files, metalsmith, done) {

		config = processConfig(config)

		var fileImages = {}
		var allImages = {}
		var getImages = {}

		var imgPattern = new RegExp(/((?:http\:|https\:|\/\/).*)/)
		var backgroundPattern = new RegExp(/^url\("((?:http\:|https\:|\/\/).*?)"\)/)

		var htmlfiles = _.pick(files, function(file, filename) {
      return (path.extname(filename) === '.html') &&
        ((config.default === false && file.internalize && file.internalize.force === true) ||
         (config.default === true && file.internalize && file.internalize.force !== false))
		})

		async.series([
				function (callback) {
					request("http://www.google.com", function (error, response, body) {
						if (error || !response || response.statusCode != 200) {
							console.log("metalsmith-internalize: network failure");
							if (config.failWithoutNetwork) {
								removeFiles(files, config);
								done(new Error("network failure"));
								return;
							} else {
								done();
								return;
							}
						} else {
							callback();
						}
					});
				},
				function (callback) {
					async.forEachOf(htmlfiles, function (file, filename, finished) {
            var recheckDays = (file.internalize && file.internalize.recheckDays) || config.recheckDays;
						fileImages[filename] = [];
						var $ = cheerio.load(file.contents);
            let fileCount = 0;
						$('*').each(function (i, elem) {
							if ($(elem).is('img')) {
								var match = imgPattern.exec($(elem).attr('src'));
								if (match) {
                  fileCount++;
                  fileImages[filename].push({
                    URL: match[1],
                    recheckDays: recheckDays
                  })
								}
							}
							if ($(elem).css('background-image')) {
								var match = backgroundPattern.exec($(elem).css('background-image'));
								if (match) {
                  fileCount++;
                  fileImages[filename].push({
                    URL: match[1],
                    recheckDays: recheckDays
                  })
								}
							}
            });
            debug(`Found ${ fileCount } images in ${ filename }`);
						finished();
					},
					function() {
            var imagesByURL = {}
						_.each(fileImages, function (images) {
              _.each(images, function (image) {
                if (!(image.URL in imagesByURL)) {
                  imagesByURL[image.URL] = image;
                } else {
                  var currentImage = imagesByURL[image.URL];
                  if (currentImage.recheckDays === 'never' && image.recheckDays !== 'never') {
                    imagesByURL[image.URL].recheckDays = image.recheckDays;
                  } else if (currentImage.recheckDays !== 'never' && image.recheckDays !== 'never') {
                    imagesByURL[image.URL].recheckDays =
                      Math.min(parseInt(currentImage.recheckDays),
                        parseInt(image.recheckDays));
                  }
                }
              })
						});
            var imageList = _.values(imagesByURL);
						_.each(imageList, function (image) {
							var hash = MD5(image.URL);
							var name = stripURL(image.URL);
							var filename = path.join(metalsmith.source(), config.imgDirectory, 'internalize', hash + path.extname(name));
							var getImage = true;
							var reason = "missing";
							if (config.cacheImages) {
								try {
									fs.accessSync(filename, fs.R_OK);
                  if (image.recheckDays === 'never') {
                    getImage = false;
                  }
									getImage = (moment(fs.statSync(filename)['mtime']).add(config.recheckDays, 'days')
											< moment())
									if (getImage) {
										reason = "age";
									}
								} catch (err) {};
							}

							var filename = path.join(config.imgDirectory,
									'internalize', hash + path.extname(name));
							var realFilename = path.join(metalsmith.source(), filename);
							var tmpFilename = realFilename + "_" +
								(Math.random().toString(36)+'00000000000000000').slice(2, 10+2);

							allImages[image.URL] = {
								filename: filename,
								realFilename: realFilename,
								tmpFilename: tmpFilename,
								get: getImage,
								succeeded: !getImage,
								reason: reason
							}
						});
						callback();
					});
				},
				function (callback) {
					var dir = path.join(metalsmith.source(), config.imgDirectory, 'internalize');
					if (!fs.existsSync(dir)) {
						fs.mkdirSync(dir);
					} else {
						if (!fs.lstatSync(dir).isDirectory()) {
							done(new Error(dir + " exists but is not a directory"));
							return;
						}
					}
					_.each(allImages, function (filename, image) {
						if (filename.get) {
							getImages[image] = filename;
						}
					});
          _.each(getImages, function (filename, image) {
							debug(`Getting ${ image } (${ filename.reason })`);
						});
					async.forEachOfLimit(getImages, 8, function (filename, image, finished) {
						if (image.indexOf("//") == 0) {
							image = "http:" + image;
						}
						var options = {
							'uri': image,
							'headers': {
								'User-Agent': "Mozilla/5.0 (X11; Linux i686) AppleWebKit/537.31 (KHTML, like Gecko) Chrome/26.0.1410."
							},
							'maxRedirects': 5
						};
						try {
							request(options)
								.on('error', function() {
									finished();
								})
								.pipe(fs.createWriteStream(filename.tmpFilename))
								.on('finish', function() {
									finished();
								});
						} catch (err) {
              debug(`Couldn't get ${ image }: ${ err }`);
							finished();
						}
					},
					function () {
						callback();
					});
				},
				function (callback) {
					async.forEachOf(getImages, function (filename, image, finished) {
						var empty = true;
						try {
							empty = (fs.statSync(filename.tmpFilename)['size'] === 0);
							if (!empty) {
								fs.renameSync(filename.tmpFilename, filename.realFilename);
								delete(files[filename.filename]);
								files[filename.filename] = {
									contents: fs.readFileSync(filename.realFilename)
								}
							} else {
                debug(`Retrieved empty file for ${ image }`);
								fs.unlinkSync(filename.tmpFilename);
							}
						} catch (err) {
              debug(`Failed to retrieve ${ image }`);
						};

						try {
							filename.succeeded = (fs.statSync(filename.realFilename)['size'] !== 0);
						} catch (err) {
							filename.succeeded = false;
						}
            if (empty && !filename.succeeded) {
              done(new Error(`metalsmith-internalize: ${ image } is broken. It will break in the browser, so remove it.`));
            } else if (empty && filename.succeeded) {
              debug(`${ image } is broken but cached locally. Consider removing it.`);
            }
						if (!filename.succeeded) {
							try {
								fs.unlinkSync(filename.filename);
							} catch (err) {};
						}
						finished();
					},
					function () {
						callback();
					});
				},
				function (callback) {
					async.forEachOf(htmlfiles, function (file, filename, finished) {
						var $ = cheerio.load(file.contents);
						$('*').each(function (i, elem) {
							if ($(elem).is('img')) {
								var match = imgPattern.exec($(elem).attr('src'));
								if (match && allImages[match[1]] && allImages[match[1]].succeeded) {
									$(elem).attr('src', "/" + allImages[match[1]].filename);
								}
							}

							if ($(elem).css('background-image')) {
								var match = backgroundPattern.exec($(elem).css('background-image'));
								if (match && allImages[match[1]].succeeded) {
									$(elem).css('background-image', 'url("/' + allImages[match[1]].filename + '")');
								}
							}
						});
						file.contents = new Buffer($.html());
						finished();
					});
					callback();
				}
		],
		function() {
			done();
		});
	}
};

exports = module.exports = internalize
exports.defaults = defaults;
exports.processConfig = processConfig;

// vim: ts=2:sw=2:et
