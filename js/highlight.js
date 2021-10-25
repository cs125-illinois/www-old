const highlightJS = require('highlight.js')
window.hljs = highlightJS
const highlightJSNumbers = require('./lib/highlightjs-line-numbers.js')
highlightJS.initHighlightingOnLoad()
highlightJS.initLineNumbersOnLoad({ singleLine: true })
