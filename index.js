var Factory = require("./src/Factory")

module.exports = factory

factory.CacheExtension = require("./src/CacheExtension")
factory.InstanceExtension = require("./src/InstanceExtension")
factory.PrototypeExtension = require("./src/PrototypeExtension")

function factory( blueprint ){
  return new Factory(blueprint).assemble()
}
