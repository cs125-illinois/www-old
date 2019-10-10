const _ = require('lodash')
const expect = require('chai').expect
const cheerio = require('cheerio')
const plantUML = require('node-plantuml-latest')
const through2 = require('through2')
const streamToString = require('stream-to-string')
const unescape = require('unescape')
const objectHash = require('object-hash')
const debug = require('debug')('plantuml')
const path = require('path')
const fs = require('fs-promise')
const handlebars = require('handlebars')
const randomID = require('random-id')
const appRootPath = require('app-root-path')
const common = require(path.join(appRootPath.toString(), 'lib/common.js'))

var defaults = {
	cacheImages: true,
	imgDirectory: 'img'
}

let defaultDigraphTemplate = handlebars.compile(`
@startuml
digraph G {
  node [ fontname="Open Sans", margin="0.2,0.07", fontsize=20, shape="{{ shape }}", color="#e84a27" ]
  edge [ fontname="Open Sans" fontsize=16, color="#13294b" ]
  {{{ html }}}
  rankdir="{{ rankdir }}";
}
@enduml`)

let smallDigraphTemplate = handlebars.compile(`
@startuml
digraph G {
  node [ fontname="Open Sans", margin="0.15,0.05", fontsize=16, shape="{{ shape }}", color="#e84a27" ]
  edge [ fontname="Open Sans" fontsize=14, color="#13294b" ]
  {{{ html }}}
  rankdir="{{ rankdir }}";
}
@enduml`)

let smallerDigraphTemplate = handlebars.compile(`
@startuml
digraph G {
  node [ fontname="Open Sans", margin="0.05,0.03", fontsize=12, shape="{{ shape }}", color="#e84a27" ]
  edge [ fontname="Open Sans" fontsize=10, color="#13294b" ]
  {{{ html }}}
  rankdir="{{ rankdir }}";
}
@enduml`)

let existingDiagrams = {}
let doPlantUML = async (file, filename, config, metadata) => {
  let $ = cheerio.load(file.contents)
  let diagrams = $('div.plantuml, div.digraph').get()
  let hasDiagram = false
  for (let diagram of diagrams) {
    let result
    let html = unescape($(diagram).html())
    let shape = $(diagram).hasClass('tree') ? 'circle' : 'record'
    let rankdir = $(diagram).hasClass('TB') ? 'TB' : 'LR'
    if (!$(diagram).hasClass('LR') && $(diagram).hasClass('tree')) {
      rankDir = 'TB'
    }
    if ($(diagram).hasClass('digraph') && $(diagram).hasClass('default')) {
      html = defaultDigraphTemplate({ html, rankdir, shape })
    } else if ($(diagram).hasClass('digraph') && $(diagram).hasClass('small')) {
      html = smallDigraphTemplate({ html, rankdir, shape })
    } else if ($(diagram).hasClass('digraph') && $(diagram).hasClass('smaller')) {
      html = smallerDigraphTemplate({ html, rankdir, shape })
    }
    let hash = objectHash(html)
    if (config.cacheImages) {
      try {
        let contents = await fs.readFile(path.join(config.cacheDirectory, hash))
        debug(`Cache hit`)
        result = contents.toString()
      } catch (err) {
        debug(err)
      }
    }
    if (!result && !metadata.env.GRAPHVIZ_DOT) {
      throw new Error("Can't generate PlantUML images. Must be cached.")
    }
    if (!result) {
      try {
        debug(`Regenerating SVG`)
        let generateSVG = plantUML.generate({ format: 'svg' })
        let inputStream = through2()
        inputStream.pipe(generateSVG.in)
        inputStream.write(html)
        inputStream.end()
        result = await streamToString(generateSVG.out)
        let svgDOM = cheerio.load(result)
        svgDOM('svg').attr('width', '100%')
        if ($(diagram).hasClass('center')) {
          svgDOM('svg').css('margin-left', 'auto')
          svgDOM('svg').css('margin-right', 'auto')
          svgDOM('svg').css('display', 'block')
        }
        result = svgDOM.html()
        if (config.cacheImages) {
          await fs.writeFile(path.join(config.cacheDirectory, hash), result)
        }
      } catch (err) {
        debug(err)
      }
    }
    if (result) {
      $(diagram).html(result)
      hasDiagram = true
    }
  }
  if (hasDiagram) {
    $('svg').each((i, element) => {
      $(element).addClass('spelling_exception')
      delete($(element).get(0).attribs.xlink)
      delete($(element).get(0).attribs.contentscripttype)
      delete($(element).get(0).attribs.contentstyletype)
      let randomSuffix = randomID(16, "aA")
      $(element).attr('id', `${ randomSuffix }`)
      $(element).find('*').each((i, inner) => {
        let existingID = $(inner).attr('id')
        if (existingID) {
          $(inner).attr('id', `${ existingID }_${ randomSuffix }`)
        }
      })
    })
    file.contents = Buffer.from($.html());
  }
}
exports = module.exports = (config) => {
  config = _.extend(_.clone(defaults), config || {})
  return (files, metalsmith, done) => {
    let metadata = metalsmith.metadata()
    config.cacheDirectory = path.join(metalsmith.source(), config.imgDirectory, 'plantuml')
    Promise.resolve().then(async () => {
      await Promise.all(_.map(common.htmlfiles(files), async (file, filename) => {
        return await doPlantUML(file, filename, config, metadata)
      }))
      return done()
    })
  }
}
