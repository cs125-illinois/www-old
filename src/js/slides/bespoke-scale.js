const $ = require('jquery')

module.exports = function(options) {
  return function(deck) {
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
        transformProperty = `-${ prefix }-transform`.toLowerCase()
      }
    })

    let slideWidth = $(deck.parent).attr('data-width')
    let slideHeight = $(deck.parent).attr('data-height')

    let scaleAll = () => {
      let ratio = Math.min(deck.parent.offsetWidth / slideWidth,
        deck.parent.offsetHeight / slideHeight)
      $.each(deck.slides, (i, slide) => {
        let wrapper = $(slide).parent('.bespoke-scale-parent')
        if (!($(slide).hasClass('nozoom'))) {
          $(wrapper).css(transformProperty, `scale(${ ratio })`)
        } else {
          let newWidth = Math.round(slideWidth * ratio)
          let newHeight = Math.round(slideHeight * ratio)
          if (!($(slide).attr('data-font-size'))) {
            $(slide).attr('data-font-size', $(slide).css('fontSize'))
          }
          let originalFontSize = parseInt($(slide).attr('data-font-size'))
          $(slide).width(newWidth)
          $(slide).height(newHeight)
          $(slide).css('margin-left', `-${ Math.round(newWidth / 2) }px`)
          $(slide).css('margin-top', `-${ Math.round(newHeight / 2) }px`)
          $(slide).css('font-size', `${ Math.round(ratio * originalFontSize)}px`)
          $(slide).css('line-height', `${ Math.round(ratio * originalFontSize * 1.4)}px`)
        }
      })
    }
    window.addEventListener('resize', scaleAll);
    scaleAll();
  }
}
