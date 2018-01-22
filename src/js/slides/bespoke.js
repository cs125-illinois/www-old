require('socketcluster-client')
require('google-authentication-helper')

module.exports.from = (opts, plugins) => {
  let parent = (opts.parent || opts).nodeType === 1 ?
    (opts.parent || opts) :
    document.querySelector(opts.parent || opts)
  let slides = [].filter.call(typeof opts.slides === 'string' ?
    parent.querySelectorAll(opts.slides) :
    (opts.slides || parent.children), function(el) {
      return el.nodeName !== 'SCRIPT'
    })
  let activeSlide = slides[0]
  let listeners = {}

  let activate = function(index, customData) {
    if (!slides[index]) {
      return
    }

    fire('deactivate', createEventData(activeSlide, customData))
    activeSlide = slides[index]
    fire('activate', createEventData(activeSlide, customData))
  }

  let slide = function(index, customData) {
    if (arguments.length) {
      fire('slide', createEventData(slides[index], customData))
        && activate(index, customData)
    } else {
      return slides.indexOf(activeSlide)
    }
  }

  let step = function(offset, customData) {
    let slideIndex = slides.indexOf(activeSlide) + offset

    fire(offset > 0 ? 'next' :
      'prev', createEventData(activeSlide, customData)) &&
      activate(slideIndex, customData)
  }

  let on = function(eventName, callback) {
    (listeners[eventName] || (listeners[eventName] = [])).push(callback)
    return off.bind(null, eventName, callback)
  }

  let off = function(eventName, callback) {
    listeners[eventName] = (listeners[eventName] || []).filter(function(listener) { return listener !== callback; });
  }

  let  fire = function(eventName, eventData) {
    return (listeners[eventName] || [])
      .reduce((notCancelled, callback) => {
        return notCancelled && callback(eventData) !== false;
      }, true)
  }

  let createEventData = function(el, eventData) {
    eventData = eventData || {}
    eventData.index = slides.indexOf(el)
    eventData.slide = el
    return eventData
  }

  let deck = {
    on: on,
    off: off,
    fire: fire,
    slide: slide,
    next: step.bind(null, 1),
    prev: step.bind(null, -1),
    parent: parent,
    slides: slides
  };

  (plugins || []).forEach((plugin) => {
    plugin(deck);
  })

  activate(0)

  return deck
}
