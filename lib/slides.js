const _ = require('lodash')
const cheerio = require('cheerio')
const expect = require('chai').expect
const slugify = require('slugify')
const moment = require('moment')
const path = require('path')
const replaceExt = require('replace-ext')

exports = module.exports = (config) => {
  return (files, metalsmith, done) => {

    const metadata = metalsmith.metadata()

    let slides = _(files).filter((file, filename) => {
      file.filename = filename
      return file.slides
    }).sortBy('date').reverse().value()

    let rawSlugs = {}
    let dateSlugs = {}
    let semesters = {}
    let slideIDs = {}
    _.each(slides, (file, filename) => {

      expect(file.uuid).to.be.ok
      expect(slideIDs).to.not.have.property(file.uuid)
      slideIDs[file.uuid] = true

      let IDs = {}
      file.emp = file.title.startsWith('EMP')

      let rawSlug = slugify(file.title.toLowerCase(), '_')
      let dateSlug = `${ moment.utc(file.date).format('YYYY_MM_DD') }_${ rawSlug }`
      expect(dateSlugs).to.not.have.property(dateSlug)
      dateSlugs[dateSlug] = true
      file.slug = dateSlug
      rawSlugs[rawSlug] = dateSlug

      file.semester = _.findKey(metadata.config.semesters, semester => {
        return moment.utc(file.date)
          .isBetween(moment.utc(semester.start, 'MM-DD-YYYY'),
          moment.utc(semester.end, 'MM-DD-YYYY'), null, '[]')
      })
      expect(file.semester).to.be.ok
      semesters[file.semester] = true

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
        if (!$(element).hasClass('nologo')) {
          $(element).addClass('logo')
        }
      })

      $('div.sect1.ss').each((i, element) => {
        let section = $(element).children('.sectionbody').first()
        $(section).css('display', 'flex')
        $(section).css('flex-direction', 'row')
        $(section).css('justify-content', 'space-between')
        let first = $(`<div style="width:48%;"></div>`)
        let second = $(`<div style="width:48%;"></div>`)
        let isFirst = true
        $(section).children((i, element) => {
          if ($(element).css('page-break-after') === 'always') {
            isFirst = false
          } else if (isFirst) {
            $(first).append($.html(element))
          } else {
            $(second).append($.html(element))
          }
          $(element).remove()
        })
        $(section).append(first)
        $(section).append(second)
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

      $('table.s').each((i, element) => {
        $(element).find('tr').each((i, row) => {
          if (i > 0 || !$(element).hasClass('showfirst')) {
            $(row).addClass('bullet')
          }
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

    let slideRedirects = {}
    _.each(slides, slide => {
      const newFilename = path.join('learn', `${ slide.slug }${ path.extname(slide.filename) }`)
      expect(files).to.not.have.property(newFilename)
      files[newFilename] = files[slide.filename]
      if (!slide.emp) {
        expect(path.extname(slide.filename)).to.equal('.html')
        let oldFilename = `/learn/${ path.basename((replaceExt(slide.filename, ''))) }/`
        if (!(oldFilename in slideRedirects)) {
          slideRedirects[oldFilename] = `/${ path.join('learn', slide.slug)}/`
        }
      }
      delete(files[slide.filename])
      delete(slide.filename)
    })

    metadata.slides = {}
    _.each(semesters, (unused, semester) => {
      metadata.slides[semester] = _(slides).filter(file => {
        return file.semester === semester
      }).sortBy('date', 'emp').reverse().value()
    })
    metadata.slideRedirects = _.map(slideRedirects, (to, from) => {
      return { to, from }
    })

    return done()
  }
}
