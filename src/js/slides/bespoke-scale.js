const $ = require('jquery')

module.exports = function(options) {
  return function(deck) {
    var parent = deck.parent,
      firstSlide = deck.slides[0],
      slideWidth = $(firstSlide).attr('data-width')
      slideHeight = $(firstSlide).attr('data-height')
      useZoom = options === 'zoom' || ('zoom' in parent.style && options !== 'transform'),

      wrap = function(element) {
        var wrapper = document.createElement('div');
        wrapper.className = 'bespoke-scale-parent';
        element.parentNode.insertBefore(wrapper, element);
        wrapper.appendChild(element);
        return wrapper;
      },

      elements = useZoom ? deck.slides : deck.slides.map(wrap),

      transformProperty = (function(property) {
        var prefixes = 'Moz Webkit O ms'.split(' ');
        return prefixes.reduce(function(currentProperty, prefix) {
          return prefix + property in parent.style ? prefix + property : currentProperty;
        }, property.toLowerCase());
      }('Transform')),

      scale = useZoom ?
      function(ratio, element) {
        if (!($(element).hasClass('nozoom'))) {
          element.style.zoom = ratio;
        }
      } :
      function(ratio, element) {
        element.style[transformProperty] = 'scale(' + ratio + ')';
      },

      scaleAll = function() {
        var xScale = parent.offsetWidth / slideWidth,
          yScale = parent.offsetHeight / slideHeight;

        elements.forEach(scale.bind(null, Math.min(xScale, yScale)));
      };

    window.addEventListener('resize', scaleAll);
    scaleAll();
  };

};
