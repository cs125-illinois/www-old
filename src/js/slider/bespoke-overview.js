var cssInserted = 0
module.exports = function (opts) {
  if (cssInserted++ === 0) {
    (function (head, style) {
      (style = document.createElement('style')).textContent = '.bespoke-parent.bespoke-overview{pointer-events:auto}\n' +
        '.bespoke-overview *{pointer-events:none}\n' +
        '.bespoke-overview img{-moz-user-select:none}\n' +
        '.bespoke-overview .bespoke-slide{opacity:1;visibility:visible;cursor:pointer;overflow:hidden;pointer-events:auto}\n' +
        '.bespoke-overview .bespoke-active{outline:6px solid #cfd8dc;outline-offset:-3px;-moz-outline-radius:3px}\n' +
        '.bespoke-overview .bespoke-bullet{opacity:1;visibility:visible}\n' +
        '.bespoke-overview-counter{counter-reset:overview}\n' +
        '.bespoke-overview-counter .bespoke-slide::after{counter-increment:overview;content:counter(overview);position:absolute;right:.75em;bottom:.5em;font-size:1.25rem;line-height:1.25}\n' +
        '.bespoke-title{visibility:hidden;position:absolute;top:0;left:0;width:100%;pointer-events:auto}\n' +
        '.bespoke-title h1{margin:0;font-size:1.6em;line-height:1.2;text-align:center}\n' +
        '.bespoke-overview:not(.bespoke-overview-to) .bespoke-title{visibility:visible}\n' +
        '.bespoke-overview-to .bespoke-active,.bespoke-overview-from .bespoke-active{z-index:1}'
      head.insertBefore(style, head.firstChild)
    })(document.head)
  }
  return function (deck) {
    opts = typeof opts === 'object' ? opts : {}
    var KEY_O = 79; var KEY_ENT = 13; var KEY_UP = 38; var KEY_DN = 40
    var RE_CSV = /, */; var RE_NONE = /^none(?:, ?none)*$/; var RE_TRANS = /^translate\((.+?)px, ?(.+?)px\) scale\((.+?)\)$/; var RE_MODE = /(^\?|&)overview(?=$|&)/
    var TRANSITIONEND = !('transition' in document.body.style) && ('webkitTransition' in document.body.style) ? 'webkitTransitionEnd' : 'transitionend'
    var VENDOR = ['webkit', 'Moz']
    var columns = typeof opts.columns === 'number' ? parseInt(opts.columns) : 3
    var margin = typeof opts.margin === 'number' ? parseFloat(opts.margin) : 15
    var overviewActive = null
    var afterTransition
    var getStyleProperty = function (element, name) {
      if (!(name in element.style)) {
        var properName = name.charAt(0).toUpperCase() + name.substr(1)
        for (var i = 0, len = VENDOR.length; i < len; i++) {
          if (VENDOR[i] + properName in element.style) return VENDOR[i] + properName
        }
      }
      return name
    }
    var getTransformScaleFactor = function (element, transformProp) {
      return parseFloat(element.style[transformProp].slice(6, -1))
    }
    var getZoomFactor = function (element) {
      if ('zoom' in element.style) return parseFloat(element.style.zoom) || undefined
    }
    var getTransitionProperties = function (element) {
      var result = []
      var style = getComputedStyle(element)
      var transitionProperty = style[getStyleProperty(element, 'transitionProperty')]
      if (!transitionProperty || RE_NONE.test(transitionProperty)) return result
      // NOTE assume computed style returns compliant values beyond this point
      transitionProperty = transitionProperty.split(RE_CSV)
      var transitionDuration = style[getStyleProperty(element, 'transitionDuration')].split(RE_CSV)
      var transitionDelay = style[getStyleProperty(element, 'transitionDelay')].split(RE_CSV)
      transitionProperty.forEach(function (property, i) {
        if (transitionDuration[i] !== '0s' || transitionDelay[i] !== '0s') result.push(property)
      })
      return result
    }
    var flushStyle = function (element, property, from, to) {
      if (property) element.style[property] = from
      var _ = element.offsetHeight // eslint-disable-line
      if (property) element.style[property] = to
    }
    var onReady = function () {
      deck.on('activate', onReady)() // unregisters listener
      deck.parent.scrollLeft = deck.parent.scrollTop = 0
      if (!!opts.autostart || RE_MODE.test(location.search)) setTimeout(openOverview, 100) // timeout allows transitions to prepare
    }
    var onSlideClick = function () {
      closeOverview(deck.slides.indexOf(this))
    }
    var onNavigate = function (offset, e) {
      var targetIndex = e.index + offset
      // IMPORTANT must use deck.slide to navigate and return false in order to circumvent bespoke-bullets behavior
      if (targetIndex >= 0 && targetIndex < deck.slides.length) deck.slide(targetIndex, { preview: true })
      return false
    }
    var onActivate = function (e) {
      if (e.scrollIntoView !== false) scrollSlideIntoView(e.slide, e.index, getZoomFactor(e.slide))
    }
    var updateLocation = function (state) {
      var s = location.search.replace(RE_MODE, '').replace(/^[^?]/, '?$&')
      if (state) {
        history.replaceState(null, null, location.pathname + (s.length > 0 ? s + '&' : '?') + 'overview' + location.hash)
      } else {
        history.replaceState(null, null, location.pathname + s + location.hash)
      }
    }
    var scrollSlideIntoView = function (slide, index, zoomFactor) {
      deck.parent.scrollTop = index < columns ? 0 : deck.parent.scrollTop + slide.getBoundingClientRect().top * (zoomFactor || 1)
    }
    var removeAfterTransition = function (direction, parentClasses, slide, slideAlt) {
      slide.removeEventListener(TRANSITIONEND, afterTransition, false)
      if (slideAlt && slideAlt !== slide) slideAlt.removeEventListener(TRANSITIONEND, afterTransition, false)
      afterTransition = undefined
      parentClasses.remove('bespoke-overview-' + direction)
    }
    var getOrCreateTitle = function (parent) {
      var first = parent.firstElementChild
      if (first.classList.contains('bespoke-title')) {
        first.style.width = ''
        return first
      }
      var header = document.createElement('header')
      header.className = 'bespoke-title'
      header.style[getStyleProperty(header, 'transformOrigin')] = '0 0'
      var h1 = document.createElement('h1')
      h1.appendChild(document.createTextNode(parent.getAttribute('data-title') || document.title))
      header.appendChild(h1)
      flushStyle(parent.insertBefore(header, first))
      return header
    }
    var openOverview = function () {
      deck.fire('overview-start')
      var slides = deck.slides
      var parent = deck.parent
      var parentClasses = parent.classList
      var lastSlideIndex = slides.length - 1
      var activeSlideIndex = deck.slide()
      var sampleSlide = activeSlideIndex > 0 ? slides[0] : slides[lastSlideIndex]
      var transformProp = getStyleProperty(sampleSlide, 'transform')
      var scaleParent = parent.querySelector('.bespoke-scale-parent')
      var baseScale = 1
      var zoomFactor
      var title
      var numTransitions = 0
      var resize = overviewActive
      var isWebKit = 'webkitAppearance' in parent.style
      if (scaleParent) {
        baseScale = getTransformScaleFactor(scaleParent, transformProp)
      } else if ((zoomFactor = getZoomFactor(sampleSlide))) {
        baseScale = zoomFactor
      }
      if (afterTransition) removeAfterTransition('from', parentClasses, slides[0], slides[lastSlideIndex])
      if (opts.title) title = getOrCreateTitle(parent)
      if (!resize) {
        deck.slide(activeSlideIndex, { preview: true })
        parentClasses.add('bespoke-overview')
        addEventListener('resize', openOverview, false)
        overviewActive = [deck.on('activate', onActivate), deck.on('prev', onNavigate.bind(null, -1)), deck.on('next', onNavigate.bind(null, 1))]
        if (opts.counter) parentClasses.add('bespoke-overview-counter')
        if (opts.location) updateLocation(true)
        parentClasses.add('bespoke-overview-to')
        numTransitions = lastSlideIndex > 0 ? getTransitionProperties(sampleSlide).length
          : (getTransitionProperties(sampleSlide).join(' ').indexOf('transform') < 0 ? 0 : 1)
        parent.style.overflowY = 'scroll' // gives us fine-grained control
        parent.style.scrollBehavior = 'smooth' // not supported by all browsers
        if (isWebKit) slides.forEach(function (slide) { flushStyle(slide, 'marginBottom', '0%', '') })
      }
      var deckWidth = parent.clientWidth / baseScale
      var scrollbarWidth = (scaleParent || parent).offsetWidth - parent.clientWidth
      var scrollbarOffset = scaleParent ? scrollbarWidth / 2 / baseScale : 0
      var slideWidth = sampleSlide.offsetWidth
      var slideHeight = sampleSlide.offsetHeight
      var scale = deckWidth / (columns * slideWidth + (columns + 1) * margin)
      var totalScale = baseScale * scale
      var scaledSlideWidth = slideWidth * scale
      var scaledSlideHeight = slideHeight * scale
      // NOTE x & y offset calculation based on transform origin at center of slide
      var slideX = (deckWidth - scaledSlideWidth) / 2
      var slideY = 0 // (deckHeight - scaledSlideHeight) / 2,
      var scaledMargin = margin * scale
      var scaledTitleHeight = 0
      var row = 0; var col = 0
      if (title) {
        if (opts.scaleTitle !== false) {
          title.style[zoomFactor ? 'zoom' : transformProp] = zoomFactor ? totalScale : 'scale(' + totalScale + ')'
          title.style.width = (parent.clientWidth / totalScale) + 'px'
          scaledTitleHeight = title.offsetHeight * scale
        } else {
          if (scrollbarWidth > 0) title.style.width = parent.clientWidth + 'px'
          scaledTitleHeight = title.offsetHeight / baseScale
        }
      }
      slides.forEach(function (slide) {
        var x = col * scaledSlideWidth + (col + 1) * scaledMargin - scrollbarOffset - slideX
        var y = row * scaledSlideHeight + (row + 1) * scaledMargin + scaledTitleHeight - slideY
        // NOTE drop scientific notation for numbers near 0 as it confuses WebKit
        slide.style[transformProp] = 'translate(' + (x.toString().indexOf('e-') < 0 ? x : 0) + 'px, ' +
              (y.toString().indexOf('e-') < 0 ? y : 0) + 'px) scale(' + scale + ')'
        // NOTE add margin to last slide to leave gap below last row; only honored by WebKit
        if (row * columns + col === lastSlideIndex) slide.style.marginBottom = margin + 'px'
        slide.addEventListener('click', onSlideClick, false)
        if (col === (columns - 1)) {
          row += 1
          col = 0
        } else {
          col += 1
        }
      })
      if (resize) {
        scrollSlideIntoView(slides[activeSlideIndex], activeSlideIndex, zoomFactor)
      } else if (numTransitions > 0) {
        sampleSlide.addEventListener(TRANSITIONEND, (afterTransition = function (e) {
          if (e.target === this && (numTransitions -= 1) === 0) {
            removeAfterTransition('to', parentClasses, this)
            if (isWebKit && parent.scrollHeight > parent.clientHeight) {
              flushStyle(parent, 'overflowY', 'auto', 'scroll') // awakens scrollbar from zombie state
            }
            scrollSlideIntoView(slides[activeSlideIndex], activeSlideIndex, zoomFactor)
          }
        }), false)
      } else {
        slides.forEach(function (slide) { flushStyle(slide) }) // bypass transition, if any
        parentClasses.remove('bespoke-overview-to')
        scrollSlideIntoView(slides[activeSlideIndex], activeSlideIndex, zoomFactor)
      }
    }
    // NOTE the order of operation in this method is critical; heavily impacts behavior & transition smoothness
    var closeOverview = function (selection) {
      // IMPORTANT intentionally reselect active slide to reactivate behavior
      deck.slide(typeof selection === 'number' ? selection : deck.slide(), { scrollIntoView: false })
      var slides = deck.slides
      var parent = deck.parent
      var parentClasses = parent.classList
      var lastSlideIndex = slides.length - 1
      var sampleSlide = deck.slide() > 0 ? slides[0] : slides[lastSlideIndex]
      var transformProp = getStyleProperty(sampleSlide, 'transform')
      var transitionProp = getStyleProperty(sampleSlide, 'transition')
      var scaleParent = parent.querySelector('.bespoke-scale-parent')
      var baseScale
      var isWebKit = 'webkitAppearance' in parent.style
      if (scaleParent) {
        baseScale = getTransformScaleFactor(scaleParent, transformProp)
      } else if (!(baseScale = getZoomFactor(sampleSlide))) {
        baseScale = 1
      }
      if (afterTransition) removeAfterTransition('to', parentClasses, slides[0], slides[lastSlideIndex])
      var yShift = parent.scrollTop / baseScale
      // xShift accounts for horizontal shift when scrollbar is removed
      var xShift = (parent.offsetWidth - (scaleParent || parent).clientWidth) / 2 / baseScale
      parent.style.scrollBehavior = parent.style.overflowY = ''
      slides.forEach(function (slide) {
        if (isWebKit) flushStyle(slide, 'marginBottom', '0%', '')
        slide.removeEventListener('click', onSlideClick, false)
      })
      if (yShift || xShift) {
        slides.forEach(function (slide) {
          var m = slide.style[transformProp].match(RE_TRANS)
          slide.style[transformProp] = 'translate(' + (parseFloat(m[1]) - xShift) + 'px, ' + (parseFloat(m[2]) - yShift) + 'px) scale(' + m[3] + ')'
          flushStyle(slide, transitionProp, 'none', '') // bypass transition, if any
        })
      }
      parent.scrollTop = 0
      parentClasses.remove('bespoke-overview')
      removeEventListener('resize', openOverview, false);
      (overviewActive || []).forEach(function (unbindEvent) { unbindEvent() })
      overviewActive = null
      if (opts.counter) parentClasses.remove('bespoke-overview-counter')
      if (opts.location) updateLocation(false)
      parentClasses.add('bespoke-overview-from')
      var numTransitions = lastSlideIndex > 0 ? getTransitionProperties(sampleSlide).length
        : (getTransitionProperties(sampleSlide).join(' ').indexOf('transform') < 0 ? 0 : 1)
      slides.forEach(function (slide) { slide.style[transformProp] = '' })
      if (numTransitions > 0) {
        sampleSlide.addEventListener(TRANSITIONEND, (afterTransition = function (e) {
          if (e.target === this && (numTransitions -= 1) === 0) removeAfterTransition('from', parentClasses, this)
        }), false)
      } else {
        slides.forEach(function (slide) { flushStyle(slide) }) // bypass transition, if any
        parentClasses.remove('bespoke-overview-from')
      }
      deck.fire('overview-end')
    }
    var toggleOverview = function () {
      (overviewActive ? closeOverview : openOverview)()
    }
    var onKeydown = function (e) {
      if (e.which === KEY_O) {
        if (!e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) toggleOverview()
      } else if (overviewActive) {
        switch (e.which) {
          case KEY_ENT:
            if (!e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) closeOverview()
            break
          case KEY_UP:
            return onNavigate(-columns, { index: deck.slide() })
          case KEY_DN:
            return onNavigate(columns, { index: deck.slide() })
        }
      }
    }
    deck.on('activate', onReady)
    deck.on('destroy', function () {
      removeEventListener('resize', openOverview, false)
      document.removeEventListener('keydown', onKeydown, false)
    })
    deck.on('overview', toggleOverview)
    document.addEventListener('keydown', onKeydown, false)
  }
}
