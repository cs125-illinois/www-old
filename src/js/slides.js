require('jquery')
require('bootstrap')
const bespoke = require('./slides/bespoke.js')
const classes = require('bespoke-classes')
const nav = require('bespoke-nav')
const scale = require('./slides/bespoke-scale.js')
const bullets = require('bespoke-bullets')
const hash = require('bespoke-hash')
const multimedia = require('bespoke-multimedia')
const extern = require('bespoke-extern')
const fullscreen = require('bespoke-fullscreen')
const overview = require('bespoke-overview')
const forms = require('bespoke-forms')
const janini = require('./slides/janini.js')

highlightJS = require('highlight.js')
window.hljs = highlightJS
highlightJSNumbers = require('./lib/highlightjs-line-numbers.js')
highlightJS.initHighlightingOnLoad()
highlightJS.initLineNumbersOnLoad({
  singleLine: true
})

bespoke.from({
  parent: 'article.deck',
  slides: 'div.sect1'
}, [
  classes(),
  nav(),
  scale(),
  bullets('.bullet'),
  hash(),
  multimedia(),
  extern(bespoke),
  fullscreen(),
  overview(),
  forms(),
  janini()
])

$(() => {
  $('div.lazyiframe').each(function() {
    var iframe = $("<iframe/>")
    $.each(JSON.parse(decodeURI($(this).data('attribs'))), (name, value) => {
      $(iframe).attr(name, value);
    })
    $(this).replaceWith(iframe)
  })
  $('[data-toggle="popover"]').popover()
  $('body').on('click', e => {
    $('[data-toggle="popover"]').each(function() {
      if (!$(this).is(e.target) && $(this).has(e.target).length === 0 && $('.popover').has(e.target).length === 0) {
        $(this).popover('hide');
      }
    })
  })
})
