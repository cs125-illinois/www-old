const $ = require('jquery')
const _ = require('lodash')

let CodeMirror = require('codemirror')
require("codemirror/mode/clike/clike")
require("codemirror/addon/edit/closebrackets")
require("codemirror/lib/codemirror.css")

const janini = () => {
  $("textarea.janini").each((i, element) => {
    let newCodeMirror = CodeMirror.fromTextArea($(element).get(0))
  })
  return (deck) => {
    deck.on('activate', e => {
      console.log(e.slide)
    })
  }
}

const bespoke = require('bespoke')
const classes = require('bespoke-classes')
const nav = require('bespoke-nav')
const scale = require('./slides/bespoke-scale.js')
const bullets = require('bespoke-bullets')
const hash = require('bespoke-hash')
const multimedia = require('bespoke-multimedia')
const progress = require('bespoke-progress')
const extern = require('bespoke-extern')
const fullscreen = require('bespoke-fullscreen')
const overview = require('bespoke-overview')
const forms = require('bespoke-forms')

bespoke.from({ parent: 'article.deck', slides: 'div.sect1' }, [
  classes(),
  nav(),
  scale(),
  bullets('.build, .build-items > *:not(.build-items)'),
  hash(),
  multimedia(),
  progress(),
  extern(bespoke),
  fullscreen(),
  overview(),
  forms(),
  janini()
])

