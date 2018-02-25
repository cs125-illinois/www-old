const _ = require('lodash')
const expect = require('chai').expect
const cheerio = require('cheerio')
const plantUML = require('node-plantuml')
const through2 = require('through2')
const streamToString = require('stream-to-string')
const unescape = require('unescape')
const debug = require('debug')('plantuml')

let plantUMLServer
let doPlantUML = async (file, filename) => {
  let $ = cheerio.load(file.contents)
  let diagrams = $('div.plantuml').get()
  let hasDiagram = false
  for (let diagram of diagrams) {
    if (!plantUMLServer) {
      plantUMLServer = plantUML.useNailgun()
    }
    try {
      let generateSVG = plantUML.generate({ format: 'svg' })
      let inputStream = through2()
      inputStream.pipe(generateSVG.in)
      inputStream.write(unescape($(diagram).html()))
      inputStream.end()
      let result = await streamToString(generateSVG.out)
      $(diagram).html(result)
      hasDiagram = true
    } catch (err) {
      console.log(err)
    }
  }
  if (hasDiagram) {
    file.contents = new Buffer($.html());
  }
}
exports = module.exports = (config) => {
  return (files, metalsmith, done) => {
    Promise.resolve().then(async () => {
      await Promise.all(_.map(files, async (file, filename) => {
        return await doPlantUML(file, filename)
      }))
      if (plantUMLServer) {
        plantUMLServer.shutdown()
      }
      return done()
    })
  }
}
