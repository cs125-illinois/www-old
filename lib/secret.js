const path = require('path')

exports = module.exports = (config) => {
  return function(files, metalsmith, done) {
    for (let filename in files) {
      let file = files[filename]
      if (file.secret) {
        let newFilename = path.join(path.dirname(path.dirname(filename)), file.secret, path.basename(filename))
        files[newFilename] = file
        delete(files[filename])
      }
    }
    return done()
  }
}

// vim: ts=2:sw=2:et
