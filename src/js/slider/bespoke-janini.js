const $ = require('jquery')
const _ = require('lodash')

const CodeMirror = require('codemirror')
require('codemirror/mode/clike/clike')
require('codemirror/addon/edit/closebrackets')
require('codemirror/lib/codemirror.css')
const Split = require('split.js').default

module.exports = () => {
  return (deck) => {
    /*
     * Track the active editor across slide changes.
     */
    let active
    deck.on('activate', e => {
      active = e
      if (janinis[active.index]) {
        janinis[active.index].refresh()
      }
    })

    /*
     * Refreshing the editor causes it to immediately respond to font changes.
     */
    const refreshAll = () => {
      _(janinis)
        .each(editor => {
          editor.refresh()
        })
    }
    window.addEventListener('resize', () => { refreshAll() })
    deck.on('overview-end', () => { refreshAll() })

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

    const run = () => {
      if (!(janinis[active.index])) {
        return true
      }
      let source = janinis[active.index]

      const output = $(active.slide).find('.output').first()

      const toRun = source.getValue()
      if (toRun.trim() === '') {
        $(output).html($(output).data('blank'))
        return
      } else {
        $(output).html('<span class="text-warning">Running...</span>')
      }

      source = source.getValue() + '\n'
      const tasks = { execute: true, checkstyle: true }
      const job = {
        label: `slider:${deck.id}:${active.slideID || '(?)'}`,
        arguments: {
          checkstyle: {
            failOnError: true
          }
        }
      }
      if ($(active.slide).hasClass('nocheckstyle')) {
        delete(tasks.checkstyle)
      }
      if ($(active.slide).hasClass('compiler')) {
        tasks.compile = true
        job.sources = [{ path: 'Example.java', contents: source }]
        job.arguments.execution = {
          klass: 'Example',
          method: 'main(String[])'
        }
      } else if ($(active.slide).hasClass('kompiler')) {
        delete(tasks.checkstyle)
        tasks.kompile = true
        job.sources = [{ path: 'Main.kt', contents: source }]
        job.arguments.execution = {
          klass: 'MainKt',
          method: 'main()'
        }
      } else {
        tasks.compile = true
        job.snippet = source
        job.arguments.snippet = {
          indent: 2
        }
      }
      job.tasks = _.keys(tasks)
      console.debug(job)
      if (token) {
        job.authToken = token
      }

      $.ajax({
        url: process.env.JEED,
        type: 'POST',
        data: JSON.stringify(job),
        contentType: 'application/json; charset=utf-8',
        xhrFields: { withCredentials: true },
        crossDomain: true,
        dataType: 'json'
      }).done(result => {
        console.debug(result)
        let resultOutput = ''
        if (result.failed.snippet) {
          const { errors } = result.failed.snippet
          resultOutput += errors.map(error => {
            const { line, column, message } = error
            const originalLine = job.snippet.split('\n')[line - 1]
            return `Line ${line}: error: ${message}
${originalLine}
${new Array(column).join(' ')}^`
          }).join('\n')

          const errorCount = Object.keys(errors).length
          resultOutput += `
${errorCount} error${errorCount > 1 ? 's' : ''}`
        } else if (result.failed.compilation || result.failed.kompilation) {
          const { errors } = result.failed.compilation || result.failed.kompilation
          resultOutput += errors.map(error => {
            const { source, line, column } = error.location
            const originalLine = source === ''
              ? job.snippet.split('\n')[line - 1]
              : job.sources[0].contents.split('\n')[line - 1]
            const firstErrorLine = error.message.split('\n').slice(0, 1).join('\n')
            const restError = error.message.split('\n').slice(1).filter(errorLine => {
              if (source === '' && errorLine.trim().startsWith('location: class')) {
                return false
              } else {
                return true
              }
            }).join('\n')
            return `${source === '' ? 'Line ' : `${source}:`}${line}: error: ${firstErrorLine}
${originalLine}
${new Array(column).join(' ')}^
${restError}`
          }).join('\n')
          const errorCount = Object.keys(errors).length
          resultOutput += `
${errorCount} error${errorCount > 1 ? 's' : ''}`
        } else if (result.failed.checkstyle) {
          const { errors } = result.failed.checkstyle
          resultOutput += errors.map(error => {
            const { source, line } = error.location
            return `${source === '' ? 'Line ' : `${source}:`}${line}: checkstyle error: ${error.message}`
          }).join('\n')
          const errorCount = Object.keys(errors).length
          resultOutput += `
${errorCount} error${errorCount > 1 ? 's' : ''}`
        } else if (result.failed.execution) {
          if (result.failed.execution.classNotFound) {
            resultOutput += `Error: could not find class ${result.failed.execution.classNotFound.klass}`
          } else if (result.failed.execution.methodNotFound) {
            resultOutput += `Error: could not find method ${result.failed.execution.methodNotFound.method}`
          } else if (result.failed.execution.threw) {
            resultOutput += result.failed.execution.threw
          } else {
            resultOutput += 'Something went wrong...'
          }
        }

        if (Object.keys(result.failed).length === 0) {
          if (result.completed.execution) {
            const { execution } = result.completed
            const executionLines = execution.outputLines.map(outputLine => {
              return outputLine.line
            })
            if (execution.timeout) {
              executionLines.push("(Program Timed Out)")
            }
            if (execution.truncatedLines > 0) {
              executionLines.push(`(${execution.truncatedLines} lines were truncated)`)
            }
            resultOutput += executionLines.join("\n")
          }
        }
        $(output).text(resultOutput.trim())
      }).fail((xhr, status, error) => {
        console.error('Request failed')
        console.error(JSON.stringify(xhr, null, 2))
        console.error(JSON.stringify(status, null, 2))
        console.error(JSON.stringify(error, null, 2))
        $(output).html('<span class="text-danger">An error occurred</span>')
      })
    }

    /*
     * Set up Janini editor windows.
     */
    const janinis = {}
    _.each(deck.slides, (slide, i) => {
      $(slide).find('textarea.janini').each((unused, editor) => {
        const kotlin = $(editor).parent().hasClass('kompiler')
        janinis[i] = CodeMirror.fromTextArea($(editor).get(0), {
          mode: kotlin ? 'text/x-kotlin' : 'text/x-java',
          lineNumbers: true,
          matchBrackets: true,
          lineWrapping: true
        })
        $(slide).find('div.output').click((e) => {
          if (!(getSelection().toString().length > 0 &&
            e.target.contains(getSelection().anchorNode))) {
            run()
          }
        })
        $(slide).find('div.output').each((unused, output) => {
          $(output).attr('id', `janini-output-${i}`)
        })
        $(slide).find('.CodeMirror').each((unused, input) => {
          $(input).attr('id', `janini-input-${i}`)
        })
        Split([`#janini-input-${i}`, `#janini-output-${i}`], {
          sizes: [70, 30],
          direction: 'vertical',
          elementStyle: function (dimension, size, gutterSize) {
            return {
              'flex-basis': 'calc(' + size + '% - ' + gutterSize + 'px)'
            }
          },
          gutterStyle: function (dimension, gutterSize) {
            return {
              'flex-basis': gutterSize + 'px'
            }
          }
        })
      })
    })
  }
}
