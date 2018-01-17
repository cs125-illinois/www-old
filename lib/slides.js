const _ = require('lodash')
const cheerio = require('cheerio')

exports = module.exports = (config) => {
  return (files, metalsmith, done) => {
    let slides = _.filter(files, file => {
      return file.slides
    })
    _.each(slides, file => {
      let $ = cheerio.load(file.contents)

      // Set title and first h1 properly
      $('h2').first().replaceWith((i, element) => {
        file.title = $(element).text()
        return `<h1>${ $(element).html() }</h1>`
      })

      file.contents = new Buffer($.html())
    })

    done()
  }
}
