#!/usr/bin/env node

'use strict'

require('dotenv').config()
const _ = require('lodash')
const debug = require('debug')('getpeople')
const fs = require('fs-extra')
const path = require('path')
const expect = require('chai').expect

const mongo = require('mongodb').MongoClient

const argv = require('minimist')(process.argv.slice(2))
mongo.connect(process.env.MONGO).then(async client => {
  let peopleCollection = client.db(argv._[0]).collection('people')
  let sectionCollection = client.db(argv._[0]).collection('state')

  let sectionInfo = (await sectionCollection.findOne({ _id: 'sectionInfo' })).sections

  let convertTime = (time) => {
    let match = new RegExp(/(\d{2}):(\d{2})(\w{2})/).exec(time)
    if (match[3] === 'AM') {
      return `${ match[1] }:${ match[2] }`
    } else {
      return `${ parseInt(match[1]) + 12 }:${ match[2] }`
    }
  }
  _.each(sectionInfo, (section, name) => {
    if (!section.active) {
      delete sectionInfo[name]
      return
    }
    delete(section.active)
    section.assistants = []
    section.start = convertTime(section.times.start)
    section.end = convertTime(section.times.end)
    delete(section.times)
    section.section = section.name
    delete(section.name)
    section.ID = section.CRN
    delete(section.CRN)
    if (section.type === 'Lecture') {
      section.type = 'lecture'
    } else if (section.type === 'Laboratory-Discussion') {
      section.type = 'lab'
    }
    if (section.section === 'EMP') {
      section.type = 'special'
    }
  })

  let people = await peopleCollection.find({
    staff: true, scheduled: true
  }).toArray()

  let peopleByEmail = {}
  for (let person of people) {
    person.name = person.name.full
    let buffer = new Buffer(person.photo.contents, 'base64')
    let photoPath = path.join(argv._[1], `people/${ person.email }.jpg`)
    await fs.writeFile(photoPath, buffer)
    person.photo = photoPath.split('/').slice(1).join('/')
    delete (person._id)
    _.each(person.sections, section => {
      if (person.role === 'TA') {
        expect(sectionInfo[section]).to.not.have.property('TA')
        sectionInfo[section].TA = person.email
      } else {
        sectionInfo[section].assistants.push(person.email)
      }
    })
    peopleByEmail[person.email] = person
  }

  await fs.writeFile(path.join(argv._[1], 'course.json'), JSON.stringify({
    times: sectionInfo,
    staff: people
  }, null, 2))

  client.close()
}).catch(err => {
  debug(err)
})
