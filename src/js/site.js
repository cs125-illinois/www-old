import 'bootstrap';
import 'datatables.net';

$(function () {
  // Turn on popovers and toggle on interior clicks.
  $('[data-toggle="popover"]').popover();
  $('body').on('click', function (e) {
    $('[data-toggle="popover"]').each(function () {
      if (!$(this).is(e.target) && $(this).has(e.target).length === 0 && $('.popover').has(e.target).length === 0) {
        $(this).popover('hide');
      }
    });
  });
  $('.datatables').each (function () {
    $(this).DataTable(JSON.parse($(this).attr('data-datatables')));
  });
  $('div.lazyiframe').each(function () {
    var iframe = $("<iframe/>");
    $.each(JSON.parse(decodeURI($(this).data('attribs'))), function (name, value) {
      $(iframe).attr(name, value);
    });
    $(this).replaceWith(iframe);
  });
});

// vim: ts=2:sw=2:et
