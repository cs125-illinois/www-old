const $ = require('jquery')

module.exports = function (options) {
  return function (deck) {
    /*
     * Wrap all slides.
     */
    $.each(deck.slides, (i, slide) => {
      $(slide).wrap('<div class="bespoke-scale-parent"></div>')
    })

    /*
     * Determine the correct transform property.
     */
    let transformProperty = 'transform'
    $.each(['Moz', 'Webkit', 'O', 'ms'], (i, prefix) => {
      if (prefix + 'Transform' in document.body.style) {
        transformProperty = `-${prefix}-transform`.toLowerCase()
      }
    })

    const slideWidth = $(deck.parent).attr('data-width')
    const slideHeight = $(deck.parent).attr('data-height')

    const scaleAll = (doOverview) => {
      const ratio = Math.min(deck.parent.offsetWidth / slideWidth,
        deck.parent.offsetHeight / slideHeight)
      const overview = doOverview || $('.bespoke-parent').first().hasClass('bespoke-overview')
      const newNavWidth = Math.round(slideWidth * ratio)
      $('nav').width(newNavWidth)
      $.each(deck.slides, (i, slide) => {
        const wrapper = $(slide).parent('.bespoke-scale-parent')
        if (!($(slide).attr('data-font-size'))) {
          $(slide).attr('data-font-size', $(slide).css('fontSize'))
        }
        const originalFontSize = parseInt($(slide).attr('data-font-size'))
        if (!($(slide).hasClass('nozoom')) || overview) {
          $(wrapper).css(transformProperty, `scale(${ratio})`)
          if ($(slide).hasClass('nozoom')) {
            $(slide).width(slideWidth)
            $(slide).height(slideHeight)
            $(slide).css('margin-left', '')
            $(slide).css('margin-right', '')
            $(slide).css('margin-top', '')
            $(slide).css('margin-bottom', '')
            $(slide).css('font-size', `${originalFontSize}px`)
            $(slide).css('line-height', `${Math.round(originalFontSize * 1.4)}px`)
          }
        } else {
          $(wrapper).css(transformProperty, 'scale(1.0)')
          const newWidth = Math.round(slideWidth * ratio)
          const newHeight = Math.round(slideHeight * ratio)
          $(slide).width(newWidth)
          $(slide).height(newHeight)
          $(slide).css('margin-left', `-${Math.round(newWidth / 2)}px`)
          $(slide).css('margin-right', `-${Math.round(newWidth / 2)}px`)
          $(slide).css('font-size', `${Math.round(ratio * originalFontSize)}px`)
          $(slide).css('line-height', `${Math.round(ratio * originalFontSize * 1.4)}px`)
        }
      })
    }
    window.addEventListener('resize', () => { scaleAll() })
    scaleAll()
    deck.on('overview-start', () => { scaleAll(true) })
    deck.on('overview-end', () => { scaleAll(false) })
    deck.on('should-scale', () => { scaleAll() })
  }
}
