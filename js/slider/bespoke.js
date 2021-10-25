/* global gapi */

const $ = require('jquery')

module.exports.from = (opts, plugins) => {
  const parent = (opts.parent || opts).nodeType === 1
    ? (opts.parent || opts)
    : document.querySelector(opts.parent || opts)
  const slides = [].filter.call(typeof opts.slides === 'string'
    ? parent.querySelectorAll(opts.slides)
    : (opts.slides || parent.children), function (el) {
    return el.nodeName !== 'SCRIPT'
  })
  let activeSlide = slides[0]
  const listeners = {}

  const activate = function (index, customData) {
    if (!slides[index]) {
      return
    }

    fire('deactivate', createEventData(activeSlide, customData))
    activeSlide = slides[index]
    const slideData = createEventData(activeSlide, customData)
    fire('activate', slideData)
  }

  const slide = function (index, customData) {
    if (arguments.length) {
      fire('slide', createEventData(slides[index], customData)) &&
        activate(index, customData)
    } else {
      return slides.indexOf(activeSlide)
    }
  }

  const step = function (offset, customData) {
    const slideIndex = slides.indexOf(activeSlide) + offset

    fire(offset > 0 ? 'next'
      : 'prev', createEventData(activeSlide, customData)) &&
      activate(slideIndex, customData)
  }

  const on = function (eventName, callback) {
    (listeners[eventName] || (listeners[eventName] = [])).push(callback)
    return off.bind(null, eventName, callback)
  }

  const off = function (eventName, callback) {
    listeners[eventName] = (listeners[eventName] || []).filter(function (listener) { return listener !== callback })
  }

  const fire = function (eventName, eventData) {
    return (listeners[eventName] || [])
      .reduce((notCancelled, callback) => {
        return notCancelled && callback(eventData) !== false
      }, true)
  }

  const createEventData = function (el, eventData) {
    eventData = eventData || {}
    eventData.index = slides.indexOf(el)
    eventData.slide = el
    eventData.slideID = $(el).attr('data-slideid')
    return eventData
  }

  const deck = {
    id: $('meta[name="slider-id"]').attr('content').trim(),
    semester: $('meta[name="slider-semester"]').attr('content').trim(),
    on: on,
    off: off,
    fire: fire,
    slide: slide,
    next: step.bind(null, 1),
    prev: step.bind(null, -1),
    parent: parent,
    slides: slides,
    authenticated: false
  };

  (plugins || []).forEach((plugin) => {
    plugin(deck)
  })
  activate(0)

  return deck
}
