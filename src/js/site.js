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
})

// vim: ts=2:sw=2:et
