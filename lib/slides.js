const _ = require('lodash')
const cheerio = require('cheerio')
const expect = require('chai').expect
const slugify = require('slugify')

exports = module.exports = (config) => {
  return (files, metalsmith, done) => {
    let slides = _.filter(files, (file, filename) => {
      file.filename = filename
      return file.slides
    })
    let slugs = {}
    let IDs = {}
    _.each(slides, (file, filename) => {
      file.emp = file.title.startsWith('EMP')

      let slug = slugify(file.title.toLowerCase(), '_')
      expect(slugs).to.not.have.property(slug)
      slugs[slug] = true
      file.slug = slug

      let $ = cheerio.load(file.contents)

      // Surround h2s with header and remove empties
      $('h2').replaceWith((i, element) => {
        let slideID = $(element).attr('id')
        expect(slideID).to.be.ok
        expect(slideID).to.have.lengthOf(32)
        expect(slideID.startsWith('_')).to.be.false
        expect(IDs).to.not.have.property(slideID)
        IDs[slideID] = true
        $(element).closest('div.sect1').attr('data-slideid', slideID)

        let title = $(element).text().trim()
        if (title.startsWith("!")) {
          if (title.slice(1).length > 0) {
            return `<div data-title="${ title.slice(1) }"></div>`
          } else {
            return
          }
        } else {
          return `<div class="header" data-title="${ title }"><h2>${ $(element).html() }</h2></div>`
        }
      })

      // Add some helper classes to most sections
      $('div.sect1').each((i, element) => {
        $(element).addClass('logo')
      })

      // Handle Janini examples
      $('div.janini pre').each((i, element) => {
        let addClasses = _.pull($(element).closest('div.janini').attr('class').split(' '),
          ...['literalblock', 'openblock']).join(' ')
        $(element).closest('div.sect1').addClass(`${ addClasses } nozoom`)
        $(element).closest('div.sect1').removeClass('logo')
        let section = $(element).closest('div.sectionbody')
        let message = "&gt; Click or hit Control-Enter to run the code above"
        if ($(element).closest('div.janini').hasClass('compiler')) {
          message = "&gt; Click or hit Control-Enter to run Example.main above"
        }
        if ($(section).find('.message').html() !== null) {
          message = `${ $(section).find('.message').html() }<br/>${ message }`
        }
        section.replaceWith(() => {
          return `<textarea class="janini spelling_exception">${ $(element).text() }</textarea>` +
            `<div class="output" data-blank="${ message }">${ message }</div>`
        })
      })

      // Fix images
      $('div.imageblock.mx-auto').each((i, element) => {
        $(element).find('img').each((i, element) => {
          $(element).addClass('mx-auto')
          $(element).css('display', 'block')
        })
        $(element).removeClass('mx-auto')
      })
      $('div.imageblock.meme').each((i, element) => {
        $(element).closest('div.sect1').addClass('meme')
        $(element).closest('div.sect1').removeClass('logo')
      })

      // Fix lists
      $('div.ulist.s, div.olist.s').each((i, element) => {
        $(element).find('li').each((i, element) => {
          $(element).addClass('bullet')
        })
        $(element).removeClass('s')
      })

      // Fix bullets
      $('.s').each((i, element) => {
        $(element).addClass('bullet')
        $(element).removeClass('s')
      })

      $('div.sect1').each((i, slide) => {
        if (i === 0) {
          $(slide).addClass('bespoke-active')
        } else {
          $(slide).addClass('bespoke-inactive')
        }
        $(slide).addClass('bespoke-slide')
        // Add empty bullets
        $(slide).find('.bullet').first().each((i, element) => {
          $('<div class="bullet"></div>').insertAfter($(slide).children().first())
        })
        $(slide).find('iframe.full').first().each(() => {
          $(slide).removeClass('logo')
        })
      })
      file.contents = new Buffer($.html())
    })

    let metadata = metalsmith.metadata()
    metadata.slides = _(slides).sortBy('date', 'emp').reverse().value()

    return done()
  }
}
