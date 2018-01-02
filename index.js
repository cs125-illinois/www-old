const appRootPath = require('app-root-path')
const path = require('path')
const webpackConfiguration = require('./webpack.config.js')

const metalsmith = require('metalsmith')
const ignore = require('metalsmith-ignore')
const buildDate = require('metalsmith-build-date')
const drafts = require('metalsmith-drafts')
const filemetadata = require('metalsmith-filemetadata')
const metadata = require('metalsmith-metadata')
const empty = require(path.join(appRootPath.toString(), 'lib/empty.js'))
const asciidoc = require('metalsmith-asciidoc')
const markdown = require('metalsmith-markdown')
const sections = require(path.join(appRootPath.toString(), 'lib/sections.js'))
const course = require(path.join(appRootPath.toString(), 'lib/course.js'))
const registerPartials = require(path.join(appRootPath.toString(), 'lib/registerPartials.js'))
const webpack = require('ms-webpack')
const inPlace = require('metalsmith-in-place')
const permalinks = require('metalsmith-permalinks')
const layouts = require('metalsmith-layouts')
const fixPath = require(path.join(appRootPath.toString(), 'lib/fixPath.js'))
const active = require(path.join(appRootPath.toString(), 'lib/active.js'))
const external = require(path.join(appRootPath.toString(), 'lib/external.js'))
const footnotes = require(path.join(appRootPath.toString(), 'lib/footnotes.js'))
const people = require(path.join(appRootPath.toString(), 'lib/people.js'))
const iframes = require(path.join(appRootPath.toString(), 'lib/iframes.js'))
const hacks = require(path.join(appRootPath.toString(), 'lib/hacks.js'))
const highlight = require(path.join(appRootPath.toString(), 'lib/highlight.js'))
const msif = require('metalsmith-if')
const internalize = require(path.join(appRootPath.toString(), 'lib/internalize.js'))
const spellcheck = require('metalsmith-spellcheck')
const formatcheck = require('metalsmith-formatcheck')
const linkcheck = require('metalsmith-linkcheck')

const tmp = require('tmp')
const fs = require('fs')
const removeEmptyDirectories = require('remove-empty-directories')
const rsync = require('rsync')
const _ = require('lodash')

const syllabusPattern = 'syllabus/**/*.adoc'

const defaults = {
  verbose: false,
  source: 'src',
  destination: 'build'
}
const config = _.extend(_.clone(defaults), require('minimist')(process.argv.slice(2)) || {})

const temporaryDestination = tmp.dirSync({ mode: 0775 }).name
webpackConfiguration.output.path = temporaryDestination

const quiet = (config.quiet == true)

metalsmith(__dirname)
  .source(config.source)
  .destination(temporaryDestination)
  .use(ignore([
    'fonts/*',
    'css/*',
    'js/*',
    '**/*.swp',
    '**/*.swo'
  ]))
  .use(buildDate())
  .use(drafts())
  .use(metadata({
    course: 'course.yaml',
    dates: 'schedule/dates.yaml'
  }))
  .use(registerPartials())
  .use(course())
  .use(people())
  .use(inPlace({
    pattern: '**/*.adoc.hbs',
  }))
  .use(empty())
  .use(asciidoc())
  .use(markdown())
  .use(footnotes())
  .use((files, metalsmith, done) => {
    let metadata = metalsmith.metadata()
    let assets = _(files)
      .keys()
      .filter(filename => {
        return filename.startsWith('assets/css') || filename.startsWith('assets/js')
      })
      .map(filename => {
        return filename.split('/').slice(1).join('/')
      })
      .value()
    let assetMap = {}
    _.each(assets, filename => {
      let components = filename.split('/').slice(-1)[0].split('.')
      assetMap[`${ components[0] }.${ components[2] }`] = path.join('/assets', filename)
    })
    metadata.webpack = {
      assets: assetMap
    }
    return done()
  })
  .use(inPlace({
    pattern: '**/*.html.hbs',
  }))
  .use(sections())
  .use(permalinks({ relative: false }))
  .use(hacks.preLayout())
  .use(layouts({
    engine: 'handlebars'
  }))
  .use(fixPath())
  .use(active())
  .use(external())
  .use(iframes())
  .use(hacks.postLayout())
  .use(highlight())
  .use(internalize())
  .use(msif((config.check),
    spellcheck({ dicFile: 'dicts/en_US.dic',
                 affFile: 'dicts/en_US.aff',
                 exceptionFile: 'dicts/spelling_exceptions.yaml',
                 checkedPart: "#content",
                 failErrors: false,
                 verbose: !quiet})))
  .use(msif(config.check,
    formatcheck({ verbose: !quiet , failWithoutNetwork: false })))
  .use(msif(config.check,
    linkcheck({ verbose: !quiet , failWithoutNetwork: false })))
  .build(err => {
    if (err) {
      throw(err)
    } else {
      removeEmptyDirectories(temporaryDestination)
      var copyToRealDestination = new rsync()
        .flags('rlgoDc')
        .delete()
        .source(temporaryDestination + "/")
        .destination(config.destination)
      copyToRealDestination.execute(err => {
        if (err) {
          throw(err)
        }
      })
    }
  })

// vim: ts=2:sw=2:et:ft=javascript
