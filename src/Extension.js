module.exports = Extension

function Extension(extension) {
  extension = extension || {}
  this.name = ""
  this.type = extension.type || "instance"
  this.inherit = extension.inherit || false
  this.initialize = extension.initialize || null
  this.loop = extension.loop == null ? true : extension.loop
}
