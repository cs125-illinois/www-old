const _ = require('lodash')
const expect = require('chai').expect
const cheerio = require('cheerio')
const plantUML = require('node-plantuml')
const through2 = require('through2')
const streamToString = require('stream-to-string')
const unescape = require('unescape')

let plantUMLServer

let doPlantUML = async (file, filename) => {
  let $ = cheerio.load(file.contents)
  let diagrams = $('div.plantuml pre').get()
  for (let diagram of diagrams) {
    if (!plantUMLServer) {
      plantUMLServer = plantUML.useNailgun()
    }
    let generateSVG = plantUML.generate({ format: 'svg' })
    let inputStream = through2()
    console.log(unescape($(diagram).html()))
    inputStream.pipe(generateSVG.in)
    inputStream.write(unescape($(diagram).html()))
    inputStream.end()
    let result = await streamToString(generateSVG.out)
    console.log(result)
  }
}
exports = module.exports = (config) => {
  return (files, metalsmith, done) => {
    Promise.resolve().then(async () => {
      await Promise.all(_.map(files, async (file, filename) => {
        return await doPlantUML(file, filename)
      }))
      console.log("Done")
      if (plantUMLServer) {
        plantUMLServer.shutdown()
      }
      console.log("Shutdown")
      return done()
    })
  }
}
