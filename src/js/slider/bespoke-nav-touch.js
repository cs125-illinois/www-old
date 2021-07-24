const Hammer = require('hammerjs')
delete Hammer.defaults.cssProps.userSelect

function getSelectedText () {
  let text
  if (typeof window.getSelection !== 'undefined') {
    text = window.getSelection().toString()
  } else if (typeof document.selection !== 'undefined' &&
    document.selection.type === 'Text') {
    text = document.selection.createRange().text
  }
  return text
}

module.exports = (options) => {
  return (deck) => {
    const hammertime = new Hammer(deck.parent)

    hammertime.get('swipe').set({ direction: Hammer.DIRECTION_ALL })
    hammertime.on('swipeleft', () => {
      if (!getSelectedText()) {
        deck.next()
      }
    })
    hammertime.on('swiperight', () => {
      if (!getSelectedText()) {
        deck.prev()
      }
    })
    hammertime.on('swipeup', () => {
      deck.fire('menu.toggle')
    })
  }
}
