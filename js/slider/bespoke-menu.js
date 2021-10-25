const $ = require('jquery')

module.exports = () => {
  return (deck) => {
    const isModifierPressed = e => {
      return !!(e.ctrlKey || e.shiftKey || e.altKey || e.metaKey)
    }

    const toggleMenu = (show) => {
      show = show !== undefined ? show : $('nav').css('display') === 'none'
      if (show) {
        $('nav').show()
      } else {
        $('nav').hide()
      }
      deck.fire('should-scale')
    }
    const toggleHelp = () => {
      $('#helpModal').modal('toggle')
    }
    document.addEventListener('keydown', e => {
      if (e.which === 77 && !isModifierPressed(e)) {
        toggleMenu()
      } else if (e.which === 72 && !isModifierPressed(e)) {
        toggleHelp()
      }
    })

    deck.on('menu.toggle', () => {
      toggleMenu()
    })
    $('.menuToggle').click(() => {
      toggleMenu()
    })
    deck.on('menu.show', () => {
      toggleMenu(true)
    })
    deck.on('menu.hide', () => {
      toggleMenu(false)
    })

    deck.on('help.toggle', () => {
      toggleHelp()
    })
    $('.helpToggle').click(() => {
      toggleHelp()
    })

    $('.overviewToggle').click(() => {
      deck.fire('overview')
    })
  }
}
