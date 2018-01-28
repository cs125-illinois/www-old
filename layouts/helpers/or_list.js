const handlebars = require('handlebars')

module.exports = (items, options) => {
  let list = items.map(function (e) {
    return "<span style='white-space: nowrap;'>" + options.fn(e) + "</span>";
  })
  if (list.length == 1) {
    list = list[0]
  } else if (list.length == 2) {
    list = list.join(" or ")
  } else {
    comma_list = list.slice(0, -1)
    list = comma_list.join(", ") + ", or " + list.slice(-1)[0]
  }
  return new handlebars.SafeString(list)
}
