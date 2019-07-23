import 'jquery'
import 'bootstrap'
import 'datatables.net'

$(() => {

  // Turn on popovers and toggle on interior clicks.
  $('[data-toggle="popover"]').popover()
  $('body').on('click', e => {
    $('[data-toggle="popover"]').each(function() {
      if (!$(this).is(e.target) && $(this).has(e.target).length === 0 && $('.popover').has(e.target).length === 0) {
        $(this).popover('hide');
      }
    })
  })
  $('.datatables').each(function() {
    $(this).DataTable(JSON.parse($(this).attr('data-datatables')))
  })
  $('div.lazyiframe').each(function() {
    var iframe = $("<iframe/>")
    $.each(JSON.parse(decodeURI($(this).data('attribs'))), (name, value) => {
      $(iframe).attr(name, value);
    })
    $(this).replaceWith(iframe)
  })
  if (window.location.hash.length > 1) {
    try {
      var target = $(window.location.hash)
      $('html, body').animate({
        scrollTop: target.offset().top
      }, 'fast', function() {
        target.focus()
        if (target.is(":focus")) {
          return false
        } else {
          target.attr('tabindex','-1')
          target.focus()
        }
      })
    } catch (err) { }
  }
  $(window).on('activate.bs.scrollspy', function (e) {
    var hash = $('#toc .active').attr('href')
    if (hash === '#top') {
      history.replaceState({}, "", document.location.href.match(/(^[^#]*)/)[0])
    } else {
      history.replaceState({}, "", hash)
    }
  })
  $('#sidebar.collapse a').on('click', function () { $('#sidebar.collapse').collapse('hide') })

  // Lazy YouTube video loading. The iFrame API has better ways but this is
  // fine for now.
  $("div.youtube-container").click(function() {
    let iframeURL = `<iframe src="//www.youtube.com/embed/${ $(this).data('id') }?border=0&autoplay=1" class="embed-responsive-item" width="560" height="315" allowfullscreen></iframe>`
    let iframe = $(iframeURL)
    $(iframe).on('load', function () { $(iframe).click() })
    $(this).append(iframe)
    $(this).children(".play-button").remove()
    $(this).unbind('click mouseenter mouseleave')
  });
  $("div.youtube-container").hover(function() {
    var element = $(this).children(".play-button").first();
    $(element).addClass("hover");
    $(element).animate({ opacity: 1.0 }, 50);
  }, function () {
    var element = $(this).children(".play-button").first();
    $(element).removeClass("hover");
    $(element).css("opacity", 0.6);
  });
  $('[data-toggle="tooltip"]').tooltip();

  $("a[href^='http://'], a[href^='https://'], a[href^='//']").each(function (i, elem) {
    $(elem).click(function (event) {
      event.preventDefault()
      const url = $(elem).attr('href')
      const openURL = () => {
        if ($(elem).hasClass('external')) {
          window.open(url, '_blank')
        } else {
          document.location = url
        }
      }
      if (window.ga && ga.create) {
        ga('send', 'event', 'outbound', 'click', url, {
          'transport': 'beacon',
          'hitCallback': openURL
        })
      } else {
        openURL()
      }
    })
  })

  window.cookieconsent.initialise({
    "palette": {
      "popup": {
        "background": "#13294b"
      },
      "button": {
        "background": "#e84a27"
      }
    },
    "theme": "edgeless",
    "content": {
      "message": "The CS 125 website uses cookies to ensure that you learn the most you can this semester.",
      "dismiss": "Got it!"
    }
  })
})

// vim: ts=2:sw=2:et
