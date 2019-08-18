const path = require("path")
const minimatch = require("minimatch")
const asciidoctor = require("asciidoctor.js")()
const _ = require('lodash')
const stringHash = require('string-hash')
const debug = require('debug')('asciidoctor')
const fs = require('fs-promise')

module.exports = options => {
  const defaults = {
    pattern: "**/*.adoc",
    options: {},
    cache: true,
    cacheDirectory: "cache"
  }
  return (files, metalsmith, done) => {

    Promise.resolve().then(async () => {
      const config = _.extend({}, defaults, options)
      config.cacheDirectory = path.join(metalsmith.source(), config.cacheDirectory, 'asciidoctor')
      debug(config)

      for (let filename of _.keys(files)) {
        let file = files[filename]
        if (!(minimatch(filename, config.pattern))) {
          continue
        }
        let html
        let stringContents = file.contents.toString()
        let hash = stringHash(stringContents).toString()
        if (config.cache) {
          try {
            html = await fs.readFile(path.join(config.cacheDirectory, hash))
            debug(`Cache hit`)
          } catch (err) {
            debug(err)
          }
        }
        if (!html) {
          debug(`Cache miss`)
          html = Buffer.from(asciidoctor.convert(stringContents, config.options))
          if (config.cache) {
            await fs.writeFile(path.join(config.cacheDirectory, hash), html)
          }
        }
        file.contents = html

        const directory = path.dirname(filename)
        let outputName = path.basename(filename, path.extname(filename)) + ".html";
        if (directory !== ".") {
          outputName = directory + "/" + outputName
        }
        delete files[filename]
        files[outputName] = file
      }
    }).then(() => {
      return done()
    })
  }
}
