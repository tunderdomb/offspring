var object = require("backyard/object")
var chai = require("chai")
var assert = chai.assert
var factory = require("../index")

function test(name, fn) {
  var args = []
  var i = -1
  while (++i < fn.length) {
    args.push(function Class() {
    })
  }
  it(name, function() {
    fn.apply(this, args)
  })
}

describe("factory", function() {

  test("works without arguments", function() {
    factory()
  })

  test("returns a constructor", function() {
    var Class = factory({})
    assert.isFunction(Class)
  })

  test("returns the provided constructor", function(Hello) {
    var Class = factory({
      constructor: Hello
    })
    assert.equal(Hello, Class)
  })

  test("instanceof", function() {
    var Class = factory({})
    var obj = new Class()
    assert.instanceOf(obj, Class)
  })

  describe("blueprint", function() {
    test("inherit", function(Base, Super) {
      factory({
        constructor: Base,
        inherit: Super
      })
      var base = new Base()
      assert.instanceOf(base, Super)
    })
    test("include", function(Base, Include) {
      Include.prototype.test = function() {
      }
      factory({
        constructor: Base,
        include: Include
      })
      assert.equal(Base.prototype.test, Include.prototype.test)
    })
    test("include array", function(Base, Include1, Include2) {
      Include1.prototype.test1 = function() {
      }
      Include2.prototype.test2 = function() {
      }
      factory({
        constructor: Base,
        include: [Include1, Include2]
      })
      assert.equal(Base.prototype.test1, Include1.prototype.test1)
      assert.equal(Base.prototype.test2, Include2.prototype.test2)
    })
    test("augment", function(Base, test) {
      function mixin() {
        assert.equal(this, Base.prototype)
        this.test = test
      }

      factory({
        constructor: Base,
        augment: mixin
      })
      assert.equal(Base.prototype.test, test)
    })
    test("prototype", function(Base, test) {
      factory({
        constructor: Base,
        prototype: {
          test: test
        }
      })
      assert.equal(Base.prototype.test, test)
    })
    test("static", function(Base, test) {
      factory({
        constructor: Base,
        static: {
          test: test
        }
      })
      assert.equal(Base.test, test)
    })
    test("accessor", function(Base) {
      function getter() {
        return 1
      }

      function setter(value) {
        assert.equal(value, 2)
      }

      factory({
        constructor: Base,
        accessor: {
          test: getter,
          test2: {
            get: getter,
            set: setter
          }
        }
      })
      var obj = new Base()
      assert.equal(obj.test, 1)
      assert.equal(obj.test2, 1)
      obj.test2 = 2
    })
  })

  describe("extension api", function() {
    describe("loop option", function() {
      test("loops", function(Base) {
        var passedValue = {
          test: "testValue"
        }
        factory({
          constructor: Base,
          extensions: {
            customBlock: new factory.PrototypeExtension(function(prototype, name, value) {
              assert.equal(name, "test")
              assert.equal(value, "testValue")
            })
          },
          customBlock: passedValue
        })
        var obj = new Base()
      })
      test("doesn't loop", function(Base) {
        var passedValue = {
          test: "testValue"
        }
        factory({
          constructor: Base,
          extensions: {
            customBlock: new factory.PrototypeExtension({loop: false}, function(prototype, name, value) {
              assert.equal(name, "customBlock")
              assert.equal(value, passedValue)
            })
          },
          customBlock: passedValue
        })
        var obj = new Base()
      })
    })
    describe("PrototypeExtension", function() {
      test("don't use on extension root if no block present", function() {
        var called = false
        factory({
          extensions: {
            customBlock: new factory.PrototypeExtension(function() {
              called = true
            })
          }
        })
        assert.isFalse(called)
      })
      test("use on extension root if block present", function(Base) {
        var called = false
        factory({
          constructor: Base,
          extensions: {
            customBlock: new factory.PrototypeExtension(function(prototype, name, value) {
              called = true
              assert.equal(name, "test")
              assert.equal(value, "testValue")
              prototype[name] = value
              assert.equal(Base.prototype, prototype)
              assert.equal(Base.prototype.test, value)
            })
          },
          customBlock: {
            test: "testValue"
          }
        })
        assert.isTrue(called)
        var obj = new Base()
        assert.equal(obj.test, "testValue")
      })
    })
    describe("InstanceExtension", function() {
      test("don't use on extension root if no block present", function() {
        var called = false
        factory({
          extensions: {
            test: new factory.InstanceExtension(function() {
              called = true
            })
          }
        })
        assert.isFalse(called)
      })
      test("don't use on extension root until instantiation", function() {
        var called = false
        var Base = factory({
          extensions: {
            customBlock: new factory.InstanceExtension(function() {
              called = true
            })
          },
          customBlock: {
            test: "testValue"
          }
        })
        assert.isFalse(called)
        var obj = new Base()
      })
      test("auto call for empty constructor", function() {
        var called = false
        var Base = factory({
          extensions: {
            customBlock: new factory.InstanceExtension(function() {
              called = true
            })
          },
          customBlock: {
            test: "testValue"
          }
        })
        assert.isFalse(called)
        var obj = new Base()
        assert.isTrue(called)
      })
      test("manual call for custom constructor", function(Base) {
        var called = false
        factory({
          constructor: Base,
          extensions: {
            customBlock: new factory.InstanceExtension(function() {
              called = true
            })
          },
          customBlock: {
            test: "testValue"
          }
        })
        assert.isFalse(called)
        var obj = new Base()
        Base.initialize(obj)
        assert.isTrue(called)
      })
      test("manual call for custom constructor", function() {
        var Base = factory({
          constructor: function() {
            this.testArgs = {}
            Base.initialize(this)
            assert.isDefined(this.testArgs)
            assert.equal(this.testArgs.test, "testValue")
          },
          extensions: {
            customBlock: new factory.InstanceExtension(function(instance, name, value) {
              assert.instanceOf(instance, Base)
              assert.isDefined(instance.testArgs)
              instance.testArgs[name] = value
            })
          },
          customBlock: {
            test: "testValue"
          }
        })
        var obj = new Base()
        assert.isDefined(obj.testArgs)
        assert.equal(obj.testArgs.test, "testValue")
      })
    })
    describe("CacheExtension", function() {
      test("don't use on extension root if no block present", function() {
        var called = false
        factory({
          extensions: {
            customBlock: new factory.CacheExtension(function() {
              called = true
            })
          }
        })
        assert.isFalse(called)
      })
      test("use on extension root if block present", function(Base) {
        var called = false
        factory({
          constructor: Base,
          extensions: {
            customBlock: new factory.CacheExtension(function(prototype, name, value) {
              called = true
              assert.equal(name, "test")
              assert.equal(value, "testValue")
              assert.isDefined(prototype.customBlock)
              return value
            })
          },
          customBlock: {
            test: "testValue"
          }
        })
        assert.isTrue(called)
        assert.isDefined(Base.prototype.customBlock)
        assert.equal(Base.prototype.customBlock.test, "testValue")
        var obj = new Base()
        assert.equal(obj.customBlock.test, "testValue")
      })
    })
  })

  describe("inheritance", function() {
    test(".Super", function() {
      var Super = factory()
      var Base = Super.extend()
      assert.equal(Base.Super, Super)
    })
    test("no constructor", function() {
      var Super = factory()
      var Base = Super.extend()
      assert.isFunction(Base)
      var obj = new Base()
      assert.instanceOf(obj, Base)
      assert.instanceOf(obj, Super)
    })
    test("with constrcutor", function(Base, Super) {
      factory({
        constructor: Super
      })

      var Class = Super.extend({
        constructor: Base
      })

      assert.equal(Class, Base)

      var obj = new Base()
      assert.instanceOf(obj, Base)
      assert.instanceOf(obj, Super)
    })
    test("auto call super", function() {
      var SuperCalled = false

      function Super() {
        SuperCalled = true
      }

      factory({
        constructor: Super
      })
      var Base = Super.extend()
      var obj = new Base()
      assert.isTrue(SuperCalled)
    })
    test("constructor calls", function() {
      var SuperCalled = false

      function Base() {
        Base.Super.call(this)
      }

      function Super() {
        SuperCalled = true
      }

      factory({
        constructor: Super
      })
      Super.extend({
        constructor: Base
      })
      var obj = new Base()
      assert.isTrue(SuperCalled)
    })

    test("include", function(Base, Include) {
      Include.prototype.test = function() {
      }
      factory({
        constructor: Base,
        include: Include
      })
      var Sub = Base.extend()
      assert.equal(Sub.prototype.test, Include.prototype.test)
    })
    test("augment", function(Base, test) {
      function mixin() {
        assert.equal(this, Base.prototype)
        this.test = test
      }

      factory({
        constructor: Base,
        augment: mixin
      })
      var Sub = Base.extend()
      assert.equal(Sub.prototype.test, test)
    })
    test("prototype", function(Base, test) {
      factory({
        constructor: Base,
        prototype: {
          test: test
        }
      })
      var Sub = Base.extend()
      assert.equal(Sub.prototype.test, test)
    })
    test("static", function(Base, test) {
      factory({
        constructor: Base,
        static: {
          test: test
        }
      })
      var Sub = Base.extend()
      assert.equal(Sub.test, test)
    })
    test("accessor", function(Base) {
      function getter() {
        return 1
      }

      function setter(value) {
        assert.equal(value, 2)
      }

      factory({
        constructor: Base,
        accessor: {
          test: getter,
          test2: {
            get: getter,
            set: setter
          }
        }
      })
      var Sub = Base.extend()
      var obj = new Sub()
      assert.equal(obj.test, 1)
      assert.equal(obj.test2, 1)
      obj.test2 = 2
    })

    test("PrototypeExtension", function(Base, Sub) {
      var called = false
      factory({
        constructor: Base,
        extensions: {
          customBlock: new factory.PrototypeExtension(function(prototype, name, value) {
            prototype[name] = value
          })
        },
        customBlock: {
          test: "testValue",
          test4: ""
        }
      })
      Base.extend({
        constructor: Sub,
        extensions: {
          customBlock2: new factory.PrototypeExtension(function(prototype, name, value) {
            called = true
            assert.equal(name, "test2")
            assert.equal(value, "testValue2")
            prototype[name] = value
            assert.equal(Sub.prototype, prototype)
            assert.equal(Sub.prototype.test2, value)
          })
        },
        customBlock: {
          test3: "testValue3",
          test4: "testValue4"
        },
        customBlock2: {
          test2: "testValue2"
        }
      })
      assert.isTrue(called)
      var obj = new Sub()
      assert.equal(obj.test, "testValue")
      assert.equal(obj.test2, "testValue2")
      assert.equal(obj.test3, "testValue3")
      assert.equal(obj.test4, "testValue4")
    })
    test("InstanceExtension", function() {
      var Base = factory({
        constructor: function() {
          this.testArgs = {}
          Base.initialize(this)
        },
        extensions: {
          customBlock: new factory.InstanceExtension(function(instance, name, value) {
            assert.instanceOf(instance, Base)
            assert.isDefined(instance.testArgs)
            instance.testArgs[name] = value
          })
        },
        customBlock: {
          test: "testValue"
        }
      })
      var Sub = Base.extend({
        constructor: function() {
          Base.call(this)
          assert.isDefined(this.testArgs)
          assert.equal(this.testArgs.test, "testValue")
          assert.equal(this.testArgs.test2, "testValue2")
          this.testArgs2 = {}
          Sub.initialize(this)
          assert.equal(this.testArgs2.test3, "testValue3")
        },
        extensions: {
          customBlock2: new factory.InstanceExtension(function(instance, name, value) {
            assert.instanceOf(instance, Base)
            assert.instanceOf(instance, Sub)
            assert.isDefined(instance.testArgs2)
            instance.testArgs2[name] = value
          })
        },
        customBlock: {
          test2: "testValue2"
        },
        customBlock2: {
          test3: "testValue3"
        }
      })
      var obj = new Sub()
    })
    test("CacheExtension", function(Base, Sub) {
      factory({
        constructor: Base,
        extensions: {
          customBlock: new factory.CacheExtension(function(prototype, name, value) {
            assert.isDefined(prototype.customBlock)
            return value
          })
        },
        customBlock: {
          test: "testValue",
          test4: ""
        }
      })
      Base.extend({
        constructor: Sub,
        extensions: {
          customBlock2: new factory.CacheExtension(function(prototype, name, value) {
            assert.isDefined(prototype.customBlock)
            assert.isDefined(prototype.customBlock2)
            return value
          })
        },
        customBlock: {
          test3: "testValue3",
          test4: "testValue4"
        },
        customBlock2: {
          test2: "testValue2"
        }
      })
      var obj = new Sub()
      assert.equal(obj.customBlock.test, "testValue")
      assert.equal(obj.customBlock2.test2, "testValue2")
      assert.equal(obj.customBlock.test3, "testValue3")
      assert.equal(obj.customBlock.test4, "testValue4")
    })
  })
})
