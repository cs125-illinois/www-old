const bespoke = require('bespoke')
const classes = require('bespoke-classes')
const nav = require('bespoke-nav')
const scale = require('bespoke-scale')
const bullets = require('bespoke-bullets')
const hash = require('bespoke-hash')
const prism = require('bespoke-prism')
const multimedia = require('bespoke-multimedia')
const progress = require('bespoke-progress')
const extern = require('bespoke-extern')

bespoke.from({ parent: 'article.deck', slides: 'div.sect1' }, [
  classes(),
  nav(),
  scale(),
  bullets('.build, .build-items > *:not(.build-items)'),
  hash(),
  prism(),
  multimedia(),
  progress(),
  extern(bespoke)
])
