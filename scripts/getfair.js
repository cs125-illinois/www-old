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
  let projectGradesCollection = client.db(argv._[0]).collection('projectGrades')
  let projectGrades = await projectGradesCollection.find({
    fair: true
  }).project({
    impressive: 1, youTubeID: 1, title: 1, room: 1, index: 1, beginner: 1
  }).toArray()
  let output = {
    impressive: _(projectGrades).filter(g => { return g.impressive }).sortBy('youTubeID').value(),
    other: _(projectGrades).filter(g => { return !g.impressive }).sortBy('youTubeID').value()
  }
  await fs.writeFile(path.join(argv._[1], 'fair.json'), JSON.stringify(output, null, 2))
  client.close()
}).catch(err => {
  debug(err)
})
