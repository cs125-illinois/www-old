require('dotenv').config()
const appRootPath = require('app-root-path')
const path = require('path')
const jsYAML = require('js-yaml')

const metalsmith = require('metalsmith')
const ignore = require('metalsmith-ignore')
const buildDate = require('metalsmith-build-date')
const drafts = require('metalsmith-drafts')
const assignUUID = require('./lib/assign-uuid.js')
const github = require('./lib/github.js')
const empty = require(path.join(appRootPath.toString(), 'lib/empty.js'))
const asciidoc = require('./lib/asciidoctor.js')
const markdown = require('metalsmith-markdown')
const sections = require(path.join(appRootPath.toString(), 'lib/sections.js'))
const discoverPartials = require('metalsmith-discover-partials')
const discoverHelpers = require('metalsmith-discover-helpers')
const people = require('./lib/people.js')
const course = require(path.join(appRootPath.toString(), 'lib/course.js'))
const filemetadata = require('metalsmith-filemetadata')
const inPlace = require('metalsmith-in-place')
const permalinks = require('metalsmith-permalinks')
const plantUML = require(path.join(appRootPath.toString(), 'lib/plantUML.js'))
const layouts = require('metalsmith-layouts')
const fixPath = require(path.join(appRootPath.toString(), 'lib/fixPath.js'))
const active = require(path.join(appRootPath.toString(), 'lib/active.js'))
const external = require(path.join(appRootPath.toString(), 'lib/external.js'))
const slides = require(path.join(appRootPath.toString(), 'lib/slides.js'))
const footnotes = require(path.join(appRootPath.toString(), 'lib/footnotes.js'))
const iframes = require(path.join(appRootPath.toString(), 'lib/iframes.js'))
const hacks = require(path.join(appRootPath.toString(), 'lib/hacks.js'))
const highlight = require(path.join(appRootPath.toString(), 'lib/highlight.js'))
const secret = require(path.join(appRootPath.toString(), 'lib/secret.js'))
const msif = require('metalsmith-if')
const internalize = require(path.join(appRootPath.toString(), 'lib/internalize.js'))
const branch = require('metalsmith-branch')
const beautify = require('metalsmith-beautify')
const minifier = require('metalsmith-html-minifier')
const spellcheck = require('metalsmith-spellcheck')
const formatcheck = require('metalsmith-formatcheck')
const linkcheck = require('metalsmith-linkcheck')

const tmp = require('tmp')
const fs = require('fs-extra')
const removeEmptyDirectories = require('remove-empty-directories')
const rsync = require('rsync')
const _ = require('lodash')
require('handlebars-helpers')()

const syllabusPattern = 'syllabus/**/*.adoc'

const defaults = {
  verbose: false,
  source: 'src',
  destination: 'build'
}
const config = _.extend(
  _.clone(defaults),
  jsYAML.safeLoad(fs.readFileSync('config.yaml', 'utf8')),
  require('minimist')(process.argv.slice(2)) || {}
)

const temporaryDestination = tmp.dirSync({ mode: 0775 }).name

const quiet = (config.quiet == true)

const slides_pattern = 'learn/**/*.{adoc,info}'
const isSlides = (filename, file) => {
  return file.slides == true;
}
const Fall2017_MP_pattern = 'MP/2017/fall/**/*.adoc'
const Spring2018_MP_pattern = 'MP/2018/spring/**/*.adoc'
const MP_pattern = 'MP/**/*.adoc'
const Spring2018_lab_pattern = 'lab/2018/spring/*.adoc'
const lab_pattern = 'lab/**/*.adoc'
const info_pattern = 'info/**/*'
const tech_pattern = 'tech/**/*'
const adoc_pattern = '*/**/*.adoc'
const hbs_pattern = '*/**/*.hbs'

let doTransform = (filename, file) => {
  return !(file.transform === false)
}

const defaultMetadata = {
  layout: 'single.hbs',
  priority: 0.5,
  changefreq: 'monthly',
  doGithub: true
}

const moment = require('moment')
let start = moment()
let last = start

let timer = () => {
  return (files, metalsmith, done) => {
    let current = moment()
    console.log(current.diff(start) / 1000, current.diff(last) / 1000)
    last = current
    return done()
  }
}

metalsmith(__dirname)
  .source(config.source)
  .destination(temporaryDestination)
  .use(ignore([
    'fonts/**/.*',
    'css/**/.*',
    'js/**/.*',
    'cache/**',
    '**/.*.swp',
    '**/.*.swo'
  ]))
  .use((files, metalsmith, done) => {
    let metadata = metalsmith.metadata()
    metadata.env = process.env
    metadata.fair = {
      Fall2018: JSON.parse(files['info/fair.json'].contents.toString()),
      Spring2018: JSON.parse(files['info/2018/spring/fair.json'].contents.toString())
    }
    metadata.config = config
    return done()
  })
  .use(buildDate())
  .use(drafts())
  .use(discoverPartials({
    directory: 'layouts/partials',
    pattern: /\.hbs$/
  }))
  .use(discoverHelpers({
    directory: 'layouts/helpers',
    pattern: /\.js$/
  }))
  .use(course({
    Fall2017: 'info/2017/fall/course.yaml',
    Spring2018: 'info/2018/spring/course.json',
    Fall2018: 'info/course.json'
  }))
  .use(people())
  .use(filemetadata([
    {
      pattern: slides_pattern,
      metadata: {
        slides: true,
        layout: 'slides/slides.hbs',
        internalize: {
          force: true
        },
        addUUID: true,
        width: 640,
        height: 480
      },
      preserve: true
    },
    { pattern: Spring2018_MP_pattern, metadata: { sidebar: 'Spring-2018-MP' }, preserve: true },
    { pattern: Fall2017_MP_pattern, metadata: { sidebar: 'Fall-2017-MP' }, preserve: true },
    { pattern: MP_pattern, metadata: { sidebar: 'MP' }, preserve: true },
    { pattern: Spring2018_lab_pattern, metadata: { sidebar: 'Spring-2018-lab' }, preserve: true },
    { pattern: lab_pattern, metadata: { sidebar: 'lab' }, preserve: true },
    { pattern: info_pattern, metadata: { sidebar: 'info' }, preserve: false },
    { pattern: tech_pattern, metadata: { sidebar: 'tech' }, preserve: false },
    { pattern: adoc_pattern, metadata: defaultMetadata, preserve: true },
    { pattern: hbs_pattern, metadata: defaultMetadata, preserve: true }
  ]))
  .use(assignUUID())
  .use(ignore([
    '**/.*.uuid'
  ]))
  .use(github())
  .use(inPlace({
    pattern: '**/*.adoc.hbs',
  }))
  .use(empty({ notempty: true }))
  .use(asciidoc())
  .use(markdown())
  .use(slides())
  .use(footnotes())
  .use((files, metalsmith, done) => {
    let metadata = metalsmith.metadata()
    let assets = _(files)
      .keys()
      .filter(filename => {
        return filename.startsWith('static-assets')
      })
      .map(filename => {
        return filename.split('/').slice(1).join('/')
      })
      .value()
    let assetMap = {}
    _.each(assets, filename => {
      let components = filename.split('/').slice(-1)[0].split('.')
      if (components.length === 3) {
        assetMap[`${ components[0] }.${ components[2] }`] = path.join('/static-assets', filename)
      }
    })
    metadata.webpack = {
      assets: assetMap
    }
    return done()
  })
  .use(permalinks({ relative: false }))
  .use(plantUML())
  .use(hacks.preLayout())
  .use(highlight())
  .use(inPlace({
    pattern: '**/*.html.hbs',
  }))
  .use(permalinks({ relative: false }))
  .use(sections())
  .use(inPlace({
    pattern: '**/*.xml.hbs',
  }))
  .use(layouts({
    engine: 'handlebars'
  }))
  .use(fixPath())
  .use(active())
  .use(external())
  .use(iframes())
  .use(hacks.postLayout())
  .use(inPlace({
    pattern: 'conf/redirect.conf.hbs',
  }))
  .use(empty())
  .use(secret())
  .use(branch(doTransform)
    .use(msif(config.check,
      internalize()))
    .use(msif(config.check,
      spellcheck({ dicFile: 'dicts/en_US.dic',
                   affFile: 'dicts/en_US.aff',
                   exceptionFile: 'dicts/spelling_exceptions.yaml',
                   checkedPart: "#content",
                   failErrors: false,
                   verbose: !quiet})))
    .use(msif(config.check,
      minifier()))
    .use(msif(config.check,
      beautify({'indent_size': 2, 'css': false, 'js': false})))
    .use(msif(config.check && config.checkFormat !== 'false',
      formatcheck({ verbose: !quiet , failWithoutNetwork: false })))
    .use(msif(config.check,
      linkcheck({ verbose: !quiet , failWithoutNetwork: false })))
  )
  .build(err => {
    if (err) {
      try {
        fs.removeSync(temporaryDestination)
      } catch (e) {}
      throw(err)
    } else {
      removeEmptyDirectories(temporaryDestination)
      var copyToRealDestination = new rsync()
        .flags('rlgoDc')
        .delete()
        .source(temporaryDestination + "/")
        .destination(config.destination)
      copyToRealDestination.execute(err => {
        try {
          fs.removeSync(temporaryDestination)
        } catch (e) {}
        if (err) {
          throw(err)
        }
      })
    }
  })

// vim: ts=2:sw=2:et:ft=javascript
