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

var defaults = {
	cacheImages: true,
	imgDirectory: 'img'
}

let defaultDigraphTemplate = handlebars.compile(`
@startuml
digraph G {
  node [ fontname="Open Sans", margin="0.2,0.07", fontsize=20, shape="record", color="#e84a27" ]
  edge [ fontname="Open Sans" fontsize=16, color="#13294b" ]
  {{{ html }}}
  rankdir="LR";
}
@enduml`)

let smallDigraphTemplate = handlebars.compile(`
@startuml
digraph G {
  node [ fontname="Open Sans", margin="0.15,0.05", fontsize=16, shape="record", color="#e84a27" ]
  edge [ fontname="Open Sans" fontsize=14, color="#13294b" ]
  {{{ html }}}
  rankdir="LR";
}
@enduml`)

let plantUMLServer
let doPlantUML = async (file, filename, config, metadata) => {
  let $ = cheerio.load(file.contents)
  let diagrams = $('div.plantuml, div.digraph').get()
  let hasDiagram = false
  for (let diagram of diagrams) {
    let result
    let html = unescape($(diagram).html())
    if ($(diagram).hasClass('digraph') && $(diagram).hasClass('default')) {
      html = defaultDigraphTemplate({ html })
    } else if ($(diagram).hasClass('digraph') && $(diagram).hasClass('small')) {
      html = smallDigraphTemplate({ html })
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
      } catch (err) {
        debug(err)
      }
    }
    if (result) {
      if (config.cacheImages) {
        await fs.writeFile(path.join(config.cacheDirectory, hash), result)
      }
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
    })
    file.contents = new Buffer($.html());
  }
}
exports = module.exports = (config) => {
  config = _.extend(_.clone(defaults), config || {})
  return (files, metalsmith, done) => {
    let metadata = metalsmith.metadata()
    config.cacheDirectory = path.join(metalsmith.source(), config.imgDirectory, 'plantuml')
    Promise.resolve().then(async () => {
      await Promise.all(_.map(files, async (file, filename) => {
        return await doPlantUML(file, filename, config, metadata)
      }))
      if (plantUMLServer) {
        plantUMLServer.shutdown()
      }
      return done()
    })
  }
}
