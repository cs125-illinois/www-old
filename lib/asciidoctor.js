const path = require("path");
const minimatch = require("minimatch");
const asciidoctor = require("asciidoctor.js")();

// config defaults
const defaults = {
  pattern: "**/*.adoc",
  options: {}
};

// the plugin
const plugin = options => {

  // build effective configuration
  const config = Object.assign({}, defaults, options);
  
  // plugin function
  return (files, metalsmith, done) => {

    // done callback
    setImmediate(done);

    // process files
    Object.keys(files)
      .filter(filename => minimatch(filename, config.pattern))
      .forEach(inputName => {

        // load file contents
        const data = files[inputName];

        // render to HTML
        const html = asciidoctor.convert(data.contents.toString(), config.options);
        data.contents = new Buffer(html);

        // get output name
        const directory = path.dirname(inputName);
        let outputName = path.basename(inputName, path.extname(inputName)) + ".html";
        if(directory !== ".") {
          outputName = directory + "/" + outputName;
        }
        
        // replace Asciidoc with HTML file
        delete files[inputName];
        files[outputName] = data;

      });

  };

}

module.exports = plugin;
