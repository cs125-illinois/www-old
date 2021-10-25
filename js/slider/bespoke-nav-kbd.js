module.exports = function () {
  return function (deck) {
    var KEY_SP = 32; var KEY_PGUP = 33; var KEY_PGDN = 34; var KEY_END = 35; var KEY_HME = 36
    var KEY_LT = 37; var KEY_RT = 39; var KD = 'keydown'
    var modified = function (e, k) {
      return e.ctrlKey || (e.shiftKey && (k === KEY_HME || k === KEY_END)) || e.altKey || e.metaKey
    }
    var onKey = function (e) {
      if (!modified(e, e.which)) {
        switch (e.which) {
          case KEY_SP: return (e.shiftKey ? deck.prev : deck.next)()
          case KEY_RT: case KEY_PGDN: return deck.next()
          case KEY_LT: case KEY_PGUP: return deck.prev()
          case KEY_HME: return deck.slide(0)
          case KEY_END: return deck.slide(deck.slides.length - 1)
        }
      }
    }
    deck.on('destroy', function () { document.removeEventListener(KD, onKey) })
    document.addEventListener(KD, onKey)
  }
}
