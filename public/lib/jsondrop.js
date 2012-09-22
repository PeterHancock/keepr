// Generated by CoffeeScript 1.3.3
(function() {
  var JsonDrop, logger, urlParam,
    __slice = [].slice;

  JsonDrop = (function() {

    function JsonDrop(_arg) {
      var key;
      key = _arg.key;
      logger("new JSONDrop " + (new Date().getSeconds()) + " " + key);
      this.client = new Dropbox.Client({
        key: key,
        sandbox: true
      });
      this.client.authDriver(new Dropbox.Drivers.Redirect({
        rememberUser: true
      }));
    }

    JsonDrop.prototype.load = function(callback, onError) {
      var _this = this;
      return this.client.authenticate(function(error, data) {
        var handleError;
        handleError = onError != null ? onError : _this.showError;
        if (error) {
          return handleError(error);
        }
        return _this.client.mkdir('/jsondrop', function(error, stat) {
          return _this.construct(callback);
        });
      });
    };

    JsonDrop.prototype.construct = function(callback) {
      var _this = this;
      return this.client.readFile('/jsondrop/db.json', function(error, data) {
        if (error) {
          return _this.client.writeFile('/jsondrop/db.json', 'null', function(er) {
            return callback(null);
          });
        } else {
          return callback(JSON.parse(data));
        }
      });
    };

    JsonDrop.prototype.save = function(obj, callback) {
      var ser,
        _this = this;
      ser = JSON.stringify(obj);
      return this.client.writeFile('/jsondrop/db.json', ser, function(error, stat) {
        if (error) {
          return _this.showError(error);
        }
        return callback();
      });
    };

    JsonDrop.prototype.showError = function(error) {
      $('#error-notice').removeClass('hidden');
      if (window.console) {
        return logger(error);
      }
    };

    return JsonDrop;

  })();

  urlParam = function(name) {
    var results;
    results = new RegExp("[\\?&]" + name).exec(window.location.href);
    return (results != null ? results[0] : void 0) || 0;
  };

  logger = urlParam('__jsondrop-debug__') ? (console.log('JSONDrop logging...'), function() {
    var args;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return console.log.apply(console, args);
  }) : function() {
    var args;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
  };

  window.JsonDrop = JsonDrop;

}).call(this);
