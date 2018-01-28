const debug = require('debug')('assign-uuid')
const _ = require('lodash')
const uuidv4 = require('uuid/v4')
const path = require('path')
const fs = require('fs-extra')

exports = module.exports = config => {
  return async (files, metalsmith, done) => {
    let src = metalsmith.source()
    await Promise.all(_(files)
      .pickBy((file, filename) => {
        return !filename.endsWith('.uuid') && file.addUUID === true
      })
      .map(async (file, filename) => {
        let directory = path.dirname(filename)
        if (directory === '.') {
          directory = ""
        } else {
          directory += "/"
        }
        let uuidFile = `${ directory }.${ path.basename(filename) }.uuid`
        if (files[uuidFile]) {
          file.uuid = files[uuidFile].contents.toString().trim()
          delete(files[uuidFile])
        } else {
          debug(`creating UUID file for ${ filename } in ${ uuidFile }`)
          file.uuid = uuidv4()
          await fs.writeFile(path.join(src, uuidFile), file.uuid)
        }
      })
    )
    return done()
  }
}

// vim: ts=2:sw=2:et:ft=javascript
