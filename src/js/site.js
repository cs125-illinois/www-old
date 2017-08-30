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
});
