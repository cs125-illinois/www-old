const socketCluster = require('socketcluster-client')

module.exports.from = (opts, plugins) => {
  const sliderID = $('meta[name="slider-id"]').attr('content').trim()
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
  let slideID
  let socket = false

  let activate = function(index, customData) {
    if (!slides[index]) {
      return
    }

    fire('deactivate', createEventData(activeSlide, customData))
    activeSlide = slides[index]
    let slideData = createEventData(activeSlide, customData)
    fire('activate', slideData)
    if (socket && slideData.slideID != slideID) {
      slideID = slideData.slideID
      socket.emit('slideChange', {
        deckID: sliderID,
        slideID: slideID
      })
    }
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
    eventData.slideID = $(el).attr('data-slideid')
    return eventData
  }

  let deck = {
    id: sliderID,
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

  let user
  window.onSignIn = (u) => {
    user = u
    login()
  }

  let login = () => {
    if (!user) {
      $("#badEmailModal").modal('show')
      return
    }
    let email = user.getBasicProfile().getEmail()
    if (!email || !(email.endsWith('@illinois.edu'))) {
      $("#badEmailModal").modal('show')
      return
    }

    let token = user.getAuthResponse().id_token
    if (socket) {
      socket.emit('login', {
        sliderID: sliderID,
        token: token
      }, function (err) {
        if (err) {
          $("#badEmailModal").modal('show')
          return
        }
      })
      return
    }
    socket = socketCluster.connect({
      path: '/slider/',
      hostname: 'cs125-reporting.cs.illinois.edu',
      port: 443,
      secure: true
    })
    socket.on('connect', status => {
      if (!(status.isAuthenticated)) {
        socket.emit('login', {
          sliderID: sliderID,
          token: token
        }, function (err) {
          if (err) {
            $("#badEmailModal").modal('show')
            return
          }
        })
      }
    })
    socket.on('authenticate', () => {
      fire('login', {
        socket: socket,
        email: user.getBasicProfile().getEmail()
      })
      $("#badEmailModal").modal('hide')
      $("#cornerSignin").hide()
    })
    socket.on('deauthenticate', () => {
      fire('logout', {
        email: user.getBasicProfile().getEmail()
      })
      $("#cornerSignin").show()
    })
    socket.on('error', (err) => {
      console.error(err)
    })
  }

  return deck
}
