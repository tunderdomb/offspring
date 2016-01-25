var extend = require("backyard/object/extend")
var defaults = require("backyard/object/defaults")
var inherit = require("backyard/function/inherit")

var Extension = require("./Extension")

module.exports = CacheExtension

function CacheExtension(options, initialize) {
  if (!initialize) {
    initialize = options
    options = {}
  }
  options = defaults(options, {
    loop: true
  })
  extend(options, {
    type: "cache",
    inherit: true,
    initialize: initialize
  })
  Extension.call(this, options)
}

inherit(CacheExtension, Extension)
