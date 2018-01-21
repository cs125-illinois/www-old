const appRootPath = require('app-root-path')
const path = require('path')

const metalsmith = require('metalsmith')
const ignore = require('metalsmith-ignore')
const buildDate = require('metalsmith-build-date')
const drafts = require('metalsmith-drafts')
const github = require('./lib/github.js')
const empty = require(path.join(appRootPath.toString(), 'lib/empty.js'))
const asciidoc = require('metalsmith-asciidoctor')
const markdown = require('metalsmith-markdown')
const sections = require(path.join(appRootPath.toString(), 'lib/sections.js'))
const discoverPartials = require('metalsmith-discover-partials')
const discoverHelpers = require('metalsmith-discover-helpers')
const course = require(path.join(appRootPath.toString(), 'lib/course.js'))
const filemetadata = require('metalsmith-filemetadata')
const inPlace = require('metalsmith-in-place')
const permalinks = require('metalsmith-permalinks')
const layouts = require('metalsmith-layouts')
const fixPath = require(path.join(appRootPath.toString(), 'lib/fixPath.js'))
const active = require(path.join(appRootPath.toString(), 'lib/active.js'))
const external = require(path.join(appRootPath.toString(), 'lib/external.js'))
const slides = require(path.join(appRootPath.toString(), 'lib/slides.js'))
const footnotes = require(path.join(appRootPath.toString(), 'lib/footnotes.js'))
const iframes = require(path.join(appRootPath.toString(), 'lib/iframes.js'))
const hacks = require(path.join(appRootPath.toString(), 'lib/hacks.js'))
const highlight = require(path.join(appRootPath.toString(), 'lib/highlight.js'))
const msif = require('metalsmith-if')
const internalize = require(path.join(appRootPath.toString(), 'lib/internalize.js'))
const beautify = require('metalsmith-beautify')
const minifier = require('metalsmith-html-minifier')
const spellcheck = require('metalsmith-spellcheck')
const formatcheck = require('metalsmith-formatcheck')
const linkcheck = require('metalsmith-linkcheck')

const tmp = require('tmp')
const fs = require('fs')
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
const config = _.extend(_.clone(defaults), require('minimist')(process.argv.slice(2)) || {})

const temporaryDestination = tmp.dirSync({ mode: 0775 }).name

const quiet = (config.quiet == true)

const slides_pattern = 'slides/**/*.adoc'
const isSlides = (filename, file, i) => {
  return file.slides == true;
}
const MP_pattern = 'MP/**/*.adoc'
const lab_pattern = 'lab/**/*.adoc'
const info_pattern = 'info/**/*'
const adoc_pattern = '*/**/*.adoc'
const hbs_pattern = '*/**/*.hbs'

const defaultMetadata = {
  layout: 'single.hbs',
  priority: 0.5,
  changefreq: 'monthly',
  doGithub: true
}

metalsmith(__dirname)
  .source(config.source)
  .destination(temporaryDestination)
  .use(ignore([
    'fonts/*',
    'css/*',
    'js/*',
    '**/.*.swp',
    '**/.*.swo'
  ]))
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
    Spring2018: 'info/course.json'
  }))
  .use(filemetadata([
    {
      pattern: slides_pattern,
      metadata: {
        slides: true,
        layout: 'slides/slides.hbs',
        internalize: {
          force: true
        }
      },
      preserve: true
    },
    { pattern: MP_pattern, metadata: { sidebar: 'MP' }, preserve: false },
    { pattern: lab_pattern, metadata: { sidebar: 'lab' }, preserve: false },
    { pattern: info_pattern, metadata: { sidebar: 'info' }, preserve: false },
    { pattern: adoc_pattern, metadata: defaultMetadata, preserve: true },
    { pattern: hbs_pattern, metadata: defaultMetadata, preserve: true }
  ]))
  .use(github())
  .use(inPlace({
    pattern: '**/*.adoc.hbs',
  }))
  .use(empty())
  .use(asciidoc())
  .use(markdown())
  .use(slides())
  .use(footnotes())
  .use((files, metalsmith, done) => {
    let metadata = metalsmith.metadata()
    let assets = _(files)
      .keys()
      .filter(filename => {
        return filename.startsWith('static-assets/main') ||
               filename.startsWith('static-assets/slides')
      })
      .map(filename => {
        return filename.split('/').slice(1).join('/')
      })
      .value()
    let assetMap = {}
    _.each(assets, filename => {
      let components = filename.split('/').slice(-1)[0].split('.')
      assetMap[`${ components[0] }.${ components[2] }`] = path.join('/static-assets', filename)
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
  .use(inPlace({
    pattern: 'conf/redirect.conf.hbs',
  }))
  .use(highlight())
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
