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
  _.each(sectionInfo, section => {
    section.assistants = []
  })

  debug(sectionInfo)
  let people = await peopleCollection.find({
    staff: true, scheduled: true
  }).toArray()
  debug(people.length)

  let peopleByEmail = {}
  for (let person of people) {
    let buffer = new Buffer(person.photo.contents, 'base64')
    await fs.writeFile(path.join(argv._[1], `${ person.email }.jpg`), buffer)
    delete (person.photo)
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
    sectionInfo: sectionInfo,
    people: people
  }, null, 2))

  client.close()
}).catch(err => {
  debug(err)
})
