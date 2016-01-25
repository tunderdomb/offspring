var define = require("backyard/object/define")
var extendObject = require("backyard/object/extend")
var extendPrototype = require("backyard/function/extend")
var augment = require("backyard/function/augment")
var include = require("backyard/function/include")
var inherit = require("backyard/function/inherit")

var Blueprint = require("./Blueprint")

module.exports = Factory

function Factory(blueprint, parent) {
  var factory = this

  if (!(blueprint instanceof Blueprint)) {
    blueprint = new Blueprint(blueprint, parent ? parent.blueprint : null)
  }

  this.blueprint = blueprint
  this.parent = parent || null
  this.ancestors = parent ? parent.ancestors.concat([parent]) : []
  this.root = this.ancestors[0] || null
  this.Super = blueprint.get("inherit", null)
  this.Constructor = blueprint.get("constructor", function() {
    if (factory.Super) {
      factory.Super.apply(this, arguments)
    }
    this.constructor.initialize(this)
  })
  this.Constructor.extend = function(superBlueprint) {
    superBlueprint = superBlueprint || {}
    superBlueprint["inherit"] = factory.Constructor
    var superFactory = new Factory(superBlueprint, factory)
    return superFactory.assemble()
  }

  this.industry.push(this)
}

Factory.prototype.assemble = function() {
  var blueprint = this.blueprint
  var Constructor = this.Constructor

  Constructor.Super = this.Super
  Constructor.blueprint = blueprint

  this.digest()

  blueprint.buildPrototype(Constructor.prototype, blueprint)
  blueprint.buildCache(Constructor.prototype, blueprint)

  Constructor.initialize = function(instance) {
    var top = instance.constructor.blueprint
    blueprint.buildInstance(instance, top)
  }

  return Constructor
}

Factory.prototype.digest = function() {
  var blueprint = this.blueprint
  var Constructor = this.Constructor
  var proto = Constructor.prototype

  blueprint.digest("inherit", function(Super) {
    inherit(Constructor, Super)
  })
  blueprint.digest("include", function(includes) {
    include(Constructor, includes)
  })
  blueprint.digest("augment", function(augments) {
    augment(Constructor, augments)
  })
  blueprint.digest("prototype", function(prototype) {
    extendPrototype(Constructor, prototype)
  })
  if (blueprint.parent) {
    extendObject(Constructor, blueprint.parent.get("static"))
  }
  blueprint.digest("static", function(methods) {
    extendObject(Constructor, methods)
  })
  blueprint.digest("accessor", function(name, access) {
    if (!access) return
    if (typeof access == "function") {
      define.getter(proto, name, access)
    }
    else if (typeof access["get"] == "function" && typeof access["set"] == "function") {
      define.accessor(proto, name, access["get"], access["set"])
    }
    else if (typeof access["get"] == "function") {
      define.getter(proto, name, access["get"])
    }
    else if (typeof access["set"] == "function") {
      define.getter(proto, name, access["set"])
    }
  }, true)
  //blueprint.digest("include", function (includes) {
  //  if (!Array.isArray(includes)) {
  //    includes = [includes]
  //  }
  //  includes.forEach(function (include) {
  //    var foreign = factory.findFactory(include)
  //    if (foreign) {
  //      foreign.blueprint.build("prototype", Constructor.prototype, blueprint)
  //    }
  //  })
  //})
}

Factory.prototype.industry = []

//Factory.prototype.findFactory = function(Constructor) {
//  var ret = null
//  this.industry.some(function(factory) {
//    return factory.Constructor === Constructor && (ret = factory)
//  })
//  return ret
//}
