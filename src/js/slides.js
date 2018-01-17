const $ = require('jquery')
const _ = require('lodash')

let CodeMirror = require('codemirror')
require("codemirror/mode/clike/clike")
require("codemirror/addon/edit/closebrackets")
require("codemirror/lib/codemirror.css")

const janini = () => {
  return (deck) => {
    let janinis = {}
    _.each(deck.slides, (element, i) => {
      $(element).find("textarea.janini").each((unused, element) => {
        let newCodeMirror = CodeMirror.fromTextArea($(element).get(0), {
          mode: 'text/x-java',
          lineNumbers: true,
          matchBrackets: true
        })
        janinis[i] = newCodeMirror
      })
    })
    let active

    let firstSlide = deck.slides[0]
    let slideHeight = firstSlide.offsetHeight
    let slideWidth = firstSlide.offsetWidth
    let noZoomResize = () => {
      let xScale = deck.parent.offsetWidth / slideWidth;
      let yScale = deck.parent.offsetHeight / slideHeight;
      let scale = Math.min(xScale, yScale)
      _(deck.slides)
        .filter(element => {
          return $(element).hasClass('nozoom')
        })
        .each(element => {
          let newWidth = Math.round(slideWidth * scale)
          let newHeight = Math.round(slideHeight * scale)
          $(element).width(newWidth)
          $(element).height(newHeight)
          $(element).css('margin-left', `-${ Math.round(newWidth / 2) }px`)
          $(element).css('margin-top', `-${ Math.round(newHeight / 2) }px`)
        })
    }
    window.addEventListener('resize', noZoomResize)
    noZoomResize()

    deck.on('activate', e => {
      active = e
    })

    $(window).keypress(function (event) {
      if (!(event.which === 115 && event.ctrlKey) && !(event.which === 19)) {
        return true
      } else if (!(janinis[active.index])) {
        return true
      }
      event.preventDefault()
      let source = janinis[active.index]
      let output = $(active.slide).find('.output').first()

      let toRun = source.getValue()
      if (toRun.trim() === "") {
        $(output).text(`> Hit Control-S to run your Java code...`)
        return
      }

      $.post("https://cs125.cs.illinois.edu/janini/", JSON.stringify({
        source: source.getValue()
      })).done(result => {
        console.log(JSON.stringify(result, null, 2))
        if (result.completed) {
          $(output).text(result.output)
        } else if (result.timeout) {
          $(output).html(`<span class="text-danger">Timeout</span>`)
        } else if (!result.compiled) {
          $(output).html(`<span class="text-danger">Compiler error:\n${ result.compileError }</span>`)
        } else if (!result.ran) {
          $(output).html(`<span class="text-danger">Runtime error:\n${ result.runtimeError }</span>`)
        }
      }).fail((xhr, status, error) => {
        console.error("Request failed")
        console.error(JSON.stringify(xhr, null, 2))
        console.error(JSON.stringify(status, null, 2))
        console.error(JSON.stringify(error, null, 2))
      })
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

