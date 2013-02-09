// Generated by CoffeeScript 1.3.3
(function() {
  var DropBoxFileSystem, InMemoryFileSystem, Iterable, JsonDrop, Mixin, Node, NodeManager, exports, forEachAsync, mapAsync, reduceAsync,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  if ((typeof global !== "undefined" && global !== null) && (typeof require !== "undefined" && require !== null) && (typeof module !== "undefined" && module !== null)) {
    exports = global;
    exports.async = require('async');
  }

  reduceAsync = async.reduce;

  forEachAsync = async.forEach;

  mapAsync = async.map;

  Mixin = (function() {

    function Mixin() {}

    Mixin.mixin = function(source) {
      return _.extend(this.prototype, source);
    };

    return Mixin;

  })();

  Iterable = {
    each: function(iterator, callback) {
      throw 'no each';
    },
    forEach: function(iterator, callback) {
      return this.each(iterator, callback);
    },
    map: function(mapTo, callback) {
      var collectElements, result;
      if (!callback) {
        callback = mapTo;
        mapTo = function(element) {
          return element;
        };
      }
      result = [];
      collectElements = function(element, node, index) {
        return result.push(mapTo(element, node));
      };
      return this.each(collectElements, function(err) {
        if (err) {
          return callback(err);
        }
        return callback(null, result);
      });
    }
  };

  if ((typeof global !== "undefined" && global !== null) && (typeof require !== "undefined" && require !== null) && (typeof module !== "undefined" && module !== null)) {
    exports = global;
    exports._ = require('underscore');
  }

  JsonDrop = (function() {

    function JsonDrop(_arg) {
      var fsys, key;
      fsys = _arg.fsys, key = _arg.key;
      if (!(fsys || key)) {
        throw new Error('Require a fsys or a dropbox key');
      }
      if (key) {
        this.fsys = new DropBoxFileSystem({
          key: key
        });
      } else {
        this.fsys = fsys;
      }
      this.nodeManager = new NodeManager({
        fsys: this.fsys
      });
    }

    JsonDrop.prototype.get = function(path) {
      return Node.create(path, this.nodeManager);
    };

    return JsonDrop;

  })();

  Node = (function(_super) {

    __extends(Node, _super);

    Node.mixin(Iterable);

    Node.normalizePath = function(path) {
      if (path === '') {
        return path;
      }
      return path.replace(/^\/+/, '').replace(/\/+$/, '');
    };

    Node.create = function(path, nodeManager) {
      path = path ? Node.normalizePath(path) : '';
      return new Node({
        path: path,
        nodeManager: nodeManager
      });
    };

    function Node(_arg) {
      this.path = _arg.path, this.nodeManager = _arg.nodeManager;
    }

    Node.prototype.child = function(path) {
      if (!path) {
        throw new Exception('No child path');
      }
      path = Node.normalizePath(path);
      path = this.path ? this.path + '/' + path : path;
      return Node.create(path, this.nodeManager);
    };

    Node.prototype.getVal = function(callback) {
      this.nodeManager.getVal(this, callback);
      return this;
    };

    Node.prototype.setVal = function(obj, callback) {
      this.nodeManager.setVal(this, obj, callback);
      return this;
    };

    Node.prototype.remove = function(callback) {
      this.nodeManager.remove(this, callback);
      return this;
    };

    Node.prototype.pushVal = function(obj, callback) {
      this.nodeManager.pushVal(this, obj, callback);
      return this;
    };

    Node.prototype.each = function(iterator, callback) {
      this.nodeManager.each(this, iterator, callback);
      return this;
    };

    return Node;

  })(Mixin);

  DropBoxFileSystem = (function() {
    var authorizeDropbox;

    authorizeDropbox = function(dropbox) {
      dropbox.authDriver(new Dropbox.Drivers.Redirect({
        rememberUser: true
      }));
      return dropbox.authenticate(function(error, data) {
        if (error) {
          throw new Error(error);
        }
      });
    };

    function DropBoxFileSystem(_arg) {
      var dropbox, key;
      dropbox = _arg.dropbox, key = _arg.key;
      if (!(dropbox || key)) {
        throw new Error('Require a dropbox client instance or a dropbox key');
      }
      if (key) {
        this.dropbox = new Dropbox.Client({
          key: key,
          sandbox: true
        });
      } else {
        this.dropbox = dropbox;
      }
      authorizeDropbox(this.dropbox);
    }

    DropBoxFileSystem.prototype.remove = function(path, callback) {
      return this.dropbox.remove(path, callback);
    };

    DropBoxFileSystem.prototype.readdir = function(path, callback) {
      return this.dropbox.readdir(path, callback);
    };

    DropBoxFileSystem.prototype.readFile = function(path, callback) {
      return this.dropbox.readFile(path, callback);
    };

    DropBoxFileSystem.prototype.writeFile = function(path, text, callback) {
      return this.dropbox.writeFile(path, text, callback);
    };

    return DropBoxFileSystem;

  })();

  InMemoryFileSystem = (function() {

    function InMemoryFileSystem() {
      this.dirs = {};
    }

    InMemoryFileSystem.prototype.remove = function(path, callback) {
      return callback();
    };

    InMemoryFileSystem.prototype.readdir = function(path, callback) {
      var dir, paths, root, _ref;
      _ref = path.split('/'), root = _ref[0], paths = 2 <= _ref.length ? __slice.call(_ref, 1) : [];
      dir = this._getDir(paths);
      dir = dir ? _.keys(dir) : [];
      return callback(null, dir);
    };

    InMemoryFileSystem.prototype.readFile = function(path, callback) {
      var dir, file, paths, root, text, _i, _ref;
      _ref = path.split('/'), root = _ref[0], paths = 3 <= _ref.length ? __slice.call(_ref, 1, _i = _ref.length - 1) : (_i = 1, []), file = _ref[_i++];
      dir = this._getDir(paths);
      text = dir ? dir[file] : null;
      return callback(null, text);
    };

    InMemoryFileSystem.prototype.writeFile = function(path, text, callback) {
      var file, paths, root, _i, _ref;
      _ref = path.split('/'), root = _ref[0], paths = 3 <= _ref.length ? __slice.call(_ref, 1, _i = _ref.length - 1) : (_i = 1, []), file = _ref[_i++];
      this._mkdir(paths)[file] = text;
      return callback();
    };

    InMemoryFileSystem.prototype._getDir = function(paths) {
      return _.reduce(paths, function(memo, path) {
        var next;
        next = memo ? memo[path] : null;
        if (next) {
          return next;
        } else {
          return null;
        }
      }, this.dirs);
    };

    InMemoryFileSystem.prototype._mkdir = function(paths) {
      return _.reduce(paths, function(memo, part) {
        var next;
        next = memo[part];
        if (!next) {
          next = {};
          memo[part] = next;
        }
        return next;
      }, this.dirs);
    };

    return InMemoryFileSystem;

  })();

  JsonDrop.InMemory = InMemoryFileSystem;

  JsonDrop.inMemory = function() {
    return new JsonDrop({
      fsys: new InMemoryFileSystem()
    });
  };

  if ((typeof global !== "undefined" && global !== null) && (typeof require !== "undefined" && require !== null) && (typeof module !== "undefined" && module !== null)) {
    exports = global;
    exports._ = require('underscore');
  }

  NodeManager = (function() {

    NodeManager.NODE_VAL_FILE = 'val.json';

    NodeManager.JSONDROP_DIR = '/jsondrop';

    NodeManager.eachAsync = function(arr, iterator, callback) {
      var complete;
      complete = _.after(arr.length, callback);
      return _.each(arr, function(item, index) {
        return iterator(item, index, function(err) {
          if (err) {
            callback(err);
            return callback = function() {};
          } else {
            return complete();
          }
        });
      });
    };

    function NodeManager(_arg) {
      this.fsys = _arg.fsys;
    }

    NodeManager.pathForNode = function(node, file) {
      var filePart, pathPart;
      filePart = file ? '/' + file : '';
      pathPart = node.path ? '/' + node.path : '';
      return this.JSONDROP_DIR + pathPart + filePart;
    };

    NodeManager.pathForNodeValFile = function(node) {
      return NodeManager.pathForNode(node, NodeManager.NODE_VAL_FILE);
    };

    NodeManager.prototype.getVal = function(node, callback) {
      var _this = this;
      return this._readVal(node, function(err, val) {
        if (err) {
          return callback(err, null);
        }
        return callback(err, val);
      });
    };

    NodeManager.prototype.each = function(node, iterator, callback) {
      var _this = this;
      return this.fsys.readdir(NodeManager.pathForNode(node), function(error, entries) {
        return NodeManager.eachAsync(entries, function(dir, index, callback) {
          var child;
          if (/^-.*/.test(dir)) {
            child = node.child(dir);
            return _this.getVal(child, function(err, val) {
              if (err) {
                return callback(err);
              } else {
                iterator(val, child, index);
                return callback();
              }
            });
          } else {
            return callback();
          }
        }, callback);
      });
    };

    NodeManager.prototype.setVal = function(node, val, callback) {
      var _this = this;
      return this._writeVal(node, val, function(err) {
        return callback(err);
      });
    };

    NodeManager.prototype.remove = function(node, callback) {
      var _this = this;
      return this._clearNodeVal(node, function() {
        return _this._clearNodeArray(node, callback);
      });
    };

    NodeManager.prototype.pushVal = function(node, obj, callback) {
      var child;
      child = node.child(NodeManager.createIndex());
      return child.setVal(obj, function(err) {
        return callback(err, child);
      });
    };

    NodeManager.prototype._readVal = function(node, callback) {
      var _this = this;
      return this.fsys.readdir(NodeManager.pathForNode(node), function(error, entries) {
        if (error) {
          return callback(error, null);
        }
        if (_(entries).contains(NodeManager.NODE_VAL_FILE)) {
          return _this._readScalar(node, callback);
        }
        return callback(null, null);
      });
    };

    NodeManager.prototype._clearNodeVal = function(node, callback) {
      return this.fsys.remove(NodeManager.pathForNodeValFile(node), function(error, stat) {
        return callback();
      });
    };

    NodeManager.prototype._clearNodeArray = function(node, callback) {
      var hasChildren,
        _this = this;
      hasChildren = false;
      return this.fsys.readdir(NodeManager.pathForNode(node), function(error, entries) {
        return NodeManager.eachAsync(entries, function(dir, index, callback) {
          if (/^-.*/.test(dir)) {
            return _this.fsys.remove(NodeManager.pathForNode(node, dir), function(err, stat) {
              return callback();
            });
          } else {
            hasChildren = true;
            return callback();
          }
        }, function() {
          if (hasChildren) {
            return callback();
          } else {
            return _this.fsys.remove(NodeManager.pathForNode(node), function() {
              return callback();
            });
          }
        });
      });
    };

    NodeManager.prototype._readScalar = function(node, callback) {
      var _this = this;
      return this.fsys.readFile(NodeManager.pathForNodeValFile(node), function(err, val) {
        val = err ? null : _this._readFile(val).val;
        return callback(err, val);
      });
    };

    NodeManager.prototype._readFile = function(text) {
      if (_.isObject(text)) {
        return text;
      } else {
        return JSON.parse(text);
      }
    };

    NodeManager.prototype._writeVal = function(node, val, callback) {
      var serializedVal;
      if (_.isNaN(val) || _.isNull(val) || _.isUndefined(val) || _.isFunction(val)) {
        return callback(null);
      }
      serializedVal = JSON.stringify({
        val: val
      });
      return this.fsys.writeFile(NodeManager.pathForNodeValFile(node), serializedVal, callback);
    };

    NodeManager.createIndex = (function() {
      var counter;
      counter = -1;
      return function() {
        counter = counter + 1;
        return "-" + (new Date().getTime().toString(36)) + "-" + counter;
      };
    })();

    return NodeManager;

  })();

  if ((typeof module !== "undefined" && module !== null ? module.exports : void 0) != null) {
    module.exports = JsonDrop;
  } else if (typeof window !== "undefined" && window !== null) {
    window.JsonDrop = JsonDrop;
  } else {
    throw new Error('This library only supports node.js and modern browsers.');
  }

}).call(this);
