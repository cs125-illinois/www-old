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
let topClient
mongo.connect(process.env.MONGO, { useNewUrlParser: true, useUnifiedTopology: true }).then(async client => {
  topClient = client
  let peopleCollection = client.db('cs125').collection('people')
  let sectionCollection = client.db('cs125').collection('state')

  let sectionInfo = (await sectionCollection.findOne({ _id: argv._[0] })).sections

  let convertTime = (time) => {
    let match = new RegExp(/(\d{2}):(\d{2})(\w{2})/).exec(time)
    if (match[3] === 'AM') {
      return `${ match[1] }:${ match[2] }`
    } else {
      let number = parseInt(match[1])
      if (number !== 12) {
        number += 12
      }
      return `${ number }:${ match[2] }`
    }
  }
  _.each(sectionInfo, (section, name) => {
    section.TAs = []
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
    semester: argv._[0],
    $or: [
      { role: 'head' },
      { role: 'captain' },
      { role: 'TA' },
      { role: 'associate' },
      { role: 'assistant', active: true },
      { role: 'developer' },
      { role: 'dataanalyst' },
    ]
  }).toArray()

  let peopleByEmail = {}
  for (let person of people) {
    delete (person._id)
    _.each(person.labs, lab => {
      expect(sectionInfo[lab], lab).to.be.ok
      if (person.role === 'TA') {
        sectionInfo[lab].TAs.push(person.email)
      } else {
        sectionInfo[lab].assistants.push(person.email)
      }
    })
    expect(peopleByEmail).to.not.have.property(person.email)
    peopleByEmail[person.email] = {
      name: person.name.full,
      email: person.email,
      labs: person.labs,
      officeHours: person.officeHours,
      role: person.role
    }
  }

  _.each(sectionInfo, labInfo => {
    labInfo.TAs.sort()
    labInfo.assistants.sort()
  })

  await fs.writeFile(path.join(argv._[1], 'course.json'), JSON.stringify({
    times: sectionInfo,
    staff: _.values(peopleByEmail)
  }, null, 2))

  client.close()
}).catch(err => {
  topClient.close()
  console.log(err)
})

process.on('unhandledRejection', (reason, promise) => {
  console.log(reason.stack || reason)
})
