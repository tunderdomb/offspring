var merge = require("backyard/object/merge")
var forIn = require("backyard/object/in")

var Extension = require("./Extension")

module.exports = Blueprint

function Blueprint(blocks, parent) {
  var blueprint = this

  this.blocks = merge(blocks)
  this.parent = parent

  this.localExtensions = this.get("extensions", {})

  forIn(this.localExtensions, function(name, extension) {
    extension = extension instanceof Extension
        ? extension
        : new Extension(extension)
    blueprint.localExtensions[name] = extension
    extension.name = name
  })

  this.globalExtensions = this.localExtensions

  if (parent) {
    this.globalExtensions = merge(parent.globalExtensions, this.localExtensions)
    forIn(this.globalExtensions, function(name, extension) {
      if (extension.inherit) {
        blueprint.blocks[name] = merge(parent.get(name), blueprint.get(name))
      }
    })
  }
}

Blueprint.prototype.buildPrototype = function(prototype, top) {
  this.build("prototype", this.globalExtensions, top, function(name, extension, block) {
    if (extension.loop) {
      forIn(block, function(name, value) {
        extension.initialize(prototype, name, value)
      })
    }
    else {
      extension.initialize(prototype, name, block)
    }
  })
}

Blueprint.prototype.buildCache = function(prototype, top) {
  this.build("cache", this.globalExtensions, top, function(name, extension, block) {
    if (!prototype.hasOwnProperty(name)) {
      prototype[name] = {}
    }

    var cache = prototype[name]
    var initialize = extension.initialize

    if (extension.loop) {
      forIn(block, function(name, value) {
        cache[name] = initialize
            ? initialize(prototype, name, value)
            : value
      })
    }
    else {
      cache[name] = initialize
          ? initialize(prototype, name, block)
          : block
    }
  })
}

Blueprint.prototype.buildInstance = function(instance, top) {
  this.build("instance", this.localExtensions, top, function(name, extension, block) {
    if (extension.loop) {
      forIn(block, function(name, value) {
        extension.initialize(instance, name, value)
      })
    }
    else {
      extension.initialize(instance, name, block)
    }
  })
}

Blueprint.prototype.build = function(type, extensions, top, build) {
  var blueprint = top || this
  forIn(extensions, function(name, extension) {
    if (extension.type != type) return
    var block = blueprint.get(name)
    if (!block) return

    build(name, extension, block)
  })
}

Blueprint.prototype.digest = function(name, fn, loop) {
  if (this.has(name)) {
    var block = this.get(name)
    if (loop) {
      forIn(block, fn)
    }
    else {
      fn.call(this, block)
    }
  }
}

Blueprint.prototype.has = function(name) {
  return this.blocks.hasOwnProperty(name) && this.blocks[name] != null
}

Blueprint.prototype.get = function(name, defaultValue) {
  if (this.has(name)) {
    return this.blocks[name]
  }
  return defaultValue
}
