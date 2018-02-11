const $ = require('jquery')
const _ = require('lodash')

let CodeMirror = require('codemirror')
require("codemirror/mode/clike/clike")
require("codemirror/addon/edit/closebrackets")
require("codemirror/lib/codemirror.css")
let Split = require('split.js')

module.exports = () => {
  return (deck) => {
    /*
     * Track the active editor across slide changes.
     */
    let active
    deck.on('activate', e => {
      active = e
    })

    /*
     * Refreshing the editor causes it to immediately respond to font changes.
     */
    window.addEventListener('resize', () => {
      _(janinis)
        .each(editor => {
          editor.refresh()
        })
    })

    /*
     * Handle run events.
     */
    $(window).keypress(function (event) {
      if (!(event.which === 13 && event.ctrlKey) &&
          !(event.which === 10 && event.ctrlKey)) {
        return true
      }
      event.preventDefault()
      run()
    })

    let run = () => {
      if (!(janinis[active.index])) {
        return true
      }
      let source = janinis[active.index]
      let output = $(active.slide).find('.output').first()

      let toRun = source.getValue()
      if (toRun.trim() === "") {
        $(output).text($(output).data('blank'))
        return
      } else {
        $(output).html(`<span class="text-warning">Running...</span>`)
      }

      $.post("https://cs125.cs.illinois.edu/janini/", JSON.stringify({
        source: source.getValue() + "\n"
      })).done(result => {
        if (result.completed) {
          if (result.output.trim() !== "") {
            $(output).text(result.output.trim())
          } else {
            $(output).html(`<span class="text-success">(Completed with no or blank output)</span>`)
          }
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
        $(output).html(`<span class="text-danger">An error occurred</span>`)
      })
    }

    /*
     * Set up Janini editor windows.
     */
    let janinis = {}
    _.each(deck.slides, (slide, i) => {
      $(slide).find("textarea.janini").each((unused, editor) => {
        janinis[i] = CodeMirror.fromTextArea($(editor).get(0), {
          mode: 'text/x-java',
          lineNumbers: true,
          matchBrackets: true,
          lineWrapping: true
        })
        $(slide).find("div.output").click(() => {
          run()
        })
        $(slide).find("div.output").each((unused, output) => {
          $(output).attr('id', `janini-output-${ i }`)
        })
        $(slide).find(".CodeMirror").each((unused, input) => {
          $(input).attr('id', `janini-input-${ i }`)
        })
        Split([`#janini-input-${ i }`, `#janini-output-${ i }`], {
          sizes: [ 50, 50 ],
          direction: 'vertical',
          elementStyle: function (dimension, size, gutterSize) {
            return {
              'flex-basis': 'calc(' + size + '% - ' + gutterSize + 'px)'
            }
          },
          gutterStyle: function (dimension, gutterSize) {
            return {
              'flex-basis':  gutterSize + 'px'
            }
          }
        })
      })
    })

  }
}
