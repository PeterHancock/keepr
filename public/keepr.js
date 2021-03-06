// Generated by CoffeeScript 1.7.1
(function() {
  var Account, Keepr, Util, log,
    __slice = [].slice;

  Keepr = (function() {
    function Keepr(jsonDrop, root) {
      var onErr, onLoad;
      this.jsonDrop = jsonDrop;
      this.$root = $(root);
      this.$accountList = $('#account-list');
      this.$modalPlaceholder = $('#modal-holder');
      this.$accountTemplate = $('#account-template').text();
      this.$generatePasswordTemplate = $('#generate-password-template').text();
      this.$deleteAccountTemplate = $('#delete-account-template').text();
      $('#logout').click((function(_this) {
        return function(event) {
          return _this.logout();
        };
      })(this));
      onErr = (function(_this) {
        return function(err) {
          $('#error-notice').removeClass('hidden');
          return console.log(err);
        };
      })(this);
      onLoad = _.after(2, (function(_this) {
        return function() {
          _this.wire();
          _this.render();
          return _this.$root.removeClass('hidden');
        };
      })(this));
      this.jsonDrop.get('passwordGenerator').get((function(_this) {
        return function(err, val) {
          if (err) {
            return onErr(err);
          }
          _this.passwordGenerator = Function("passwordKey, privateKey, sha1, sha1base64, urlEncode", val);
          return onLoad();
        };
      })(this));
      this.jsonDrop.get('accounts').map(function(val, node) {
        var account;
        account = new Account(val);
        account.node = node;
        return account;
      }, (function(_this) {
        return function(err, accounts) {
          if (err) {
            return onErr(err);
          }
          _this.accounts = accounts;
          return onLoad();
        };
      })(this));
    }

    Keepr.prototype.wire = function() {
      $('#new-account-form').submit((function(_this) {
        return function(event) {
          return _this.onCreateAccount(event);
        };
      })(this));
      return $('#cancel-new-account-button').click((function(_this) {
        return function(event) {
          event.preventDefault();
          return _this.clearNewAccountForm();
        };
      })(this));
    };

    Keepr.prototype.render = function() {
      var account, _i, _len, _ref, _results;
      this.$accountList.empty();
      _ref = _.sortBy(this.accounts, function(account) {
        return account.url;
      });
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        account = _ref[_i];
        _results.push(this.renderAccount(account));
      }
      return _results;
    };

    Keepr.prototype.renderAccount = function(account) {
      var $account, hostname, id, path, protocol, _ref;
      $account = $(this.$accountTemplate);
      id = _.uniqueId('account_');
      $('.accordion-toggle', $account).attr('href', '#' + id);
      $('.accordion-body', $account).attr('id', id);
      _ref = Util.splitUrl(account.url), protocol = _ref[0], hostname = _ref[1], path = _ref[2];
      $('.url-protocol', $account).text(protocol + '://');
      $('.url-hostname', $account).text(hostname);
      if (path) {
        $('.url-path', $account).text('/' + path);
      }
      $('.url', $account).attr('href', account.url);
      $('.url', $account).attr('target', '_new');
      $('.password-button', $account).click((function(_this) {
        return function(event) {
          return _this.onGeneratePassword(event, account);
        };
      })(this));
      $('.edit-button', $account).click((function(_this) {
        return function(event) {
          return _this.onEditAccount(event, account);
        };
      })(this));
      return this.$accountList.append($account);
    };

    Keepr.prototype.onEditAccount = function(event, account) {
      var $modal;
      this.$modalPlaceholder.empty().append($('#edit-account-template').text());
      $modal = $('.modal', this.$modalPlaceholder);
      $('.url', $modal).text(account.url);
      $('.username', $modal).text(account.username);
      $('.password-key', $modal).text(account.passwordKey);
      $('.account-delete-button', $modal).click((function(_this) {
        return function(event) {
          $modal.modal('hide');
          return _this.onDeleteAccount(event, account);
        };
      })(this));
      $modal.modal('show');
      return $modal.on('hidden', (function(_this) {
        return function() {
          return log('Done editing');
        };
      })(this));
    };

    Keepr.prototype.onDeleteAccount = function(event, account) {
      var $modal;
      this.$modalPlaceholder.empty().append(this.$deleteAccountTemplate);
      $modal = $('.modal', this.$modalPlaceholder);
      $modal.modal('show');
      $('.confirm', $modal).click((function(_this) {
        return function(event) {
          _this.accounts = _.reject(_this.accounts, function(a) {
            return a.url === account.url;
          });
          $modal.modal('hide');
          return account.node.remove(function(err) {
            return _this.render();
          });
        };
      })(this));
      $('.cancel', $modal).click((function(_this) {
        return function(event) {
          return $modal.modal('hide');
        };
      })(this));
      return $modal.on('hidden', (function(_this) {
        return function() {
          return log('Cancelled the deletion of account');
        };
      })(this));
    };

    Keepr.prototype.onCreateAccount = function(event) {
      var key, url, username;
      event.preventDefault();
      url = $('#new-url').val();
      username = $('#new-username').val();
      key = $('#new-password-key').val();
      return this.promptPrivateKey((function(_this) {
        return function(err, privateKey) {
          var account, error;
          if (err) {
            return alert(err);
          }
          try {
            account = new Account({
              url: url,
              username: username,
              passwordKey: key
            });
          } catch (_error) {
            error = _error;
            return alert("The url '" + url + "' is invalid");
          }
          _this.accounts.push(account);
          return _this.jsonDrop.get('accounts').push(account.val(), function(err, node) {
            if (err) {
              return alert(err);
            }
            account.node = node;
            _this.render();
            return _this.clearNewAccountForm();
          });
        };
      })(this));
    };

    Keepr.prototype.clearNewAccountForm = function() {
      return $('#new-account-form input').each(function() {
        return $(this).val('');
      });
    };

    Keepr.prototype.onGeneratePassword = function(event, account) {
      return this.promptPrivateKey((function(_this) {
        return function(err, privateKey) {
          if (err) {
            return alert(err);
          }
          return _this.showPassword(account, _this.generatePassword(account.passwordKey, privateKey));
        };
      })(this));
    };

    Keepr.prototype.promptPrivateKey = function(callback) {
      var $modal, $modalPlaceholder;
      $modalPlaceholder = $('#modal-holder');
      $modalPlaceholder.empty().append($($('#generate-single-password-template').text()));
      $modal = $('.modal', $modalPlaceholder);
      $modal.modal('show');
      return $('#generate-password-form').submit((function(_this) {
        return function(event) {
          var privateKey;
          event.preventDefault();
          privateKey = $('#private-key').val();
          $modal.modal('hide');
          $modalPlaceholder.empty();
          return callback(null, privateKey);
        };
      })(this));
    };

    Keepr.prototype.showPassword = function(account, password) {
      var $modal, $modalPlaceholder, $tmpl;
      $tmpl = $('#show-password-template').text();
      $modalPlaceholder = $('#modal-holder');
      $modalPlaceholder.empty().append($tmpl);
      $modal = $('.modal', $modalPlaceholder);
      $modal.modal('show');
      $('.show-password', $modal).val(password).select();
      password = null;
      setTimeout((function() {
        return $modal.modal('hide');
      }), 15000);
      return $modal.on('hidden', (function(_this) {
        return function() {
          return $modalPlaceholder.empty();
        };
      })(this));
    };

    Keepr.prototype.generatePassword = function(passwordKey, privateKey) {
      var sha1, sha1base64, urlEncode;
      sha1 = function(str) {
        return CryptoJS.SHA1(str).toString();
      };
      sha1base64 = function(str) {
        return CryptoJS.SHA1(str).toString(CryptoJS.enc.Base64);
      };
      urlEncode = function(str) {
        return str.replace('+', '-').replace('/', '_');
      };
      return this.passwordGenerator(passwordKey, privateKey, sha1, sha1base64, urlEncode);
    };

    Keepr.prototype.logout = function() {
      return this.jsonDrop.fsys.dropbox.signOut((function(_this) {
        return function(error) {
          return window.location.href = "login.html";
        };
      })(this));
    };

    return Keepr;

  })();

  Account = (function() {
    function Account(_arg) {
      var error;
      this.url = _arg.url, this.username = _arg.username, this.passwordKey = _arg.passwordKey, this.passwordHash = _arg.passwordHash;
      try {
        Util.splitUrl(this.url);
      } catch (_error) {
        error = _error;
        throw error;
      }
      this.node = null;
    }

    Account.prototype.val = function() {
      return {
        url: this.url,
        username: this.username,
        passwordKey: this.passwordKey,
        passwordHash: this.passwordHash
      };
    };

    Account.prototype.updatePasswordHash = function(passwordHash, callback) {
      var currentPasswordHash;
      currentPasswordHash = this.passwordHash;
      this.passwordHash = passwordHash;
      return this.node.set(this.val(), (function(_this) {
        return function(err) {
          if (err) {
            _this.passwordHash = currentPasswordHash;
            return callback(err);
          } else {
            return callback();
          }
        };
      })(this));
    };

    return Account;

  })();

  Util = (function() {
    function Util() {}

    Util.splitUrl = function(url) {
      var hostname, path, protocol, remainder, _ref, _ref1;
      _ref = url.split('://'), protocol = _ref[0], remainder = _ref[1];
      if (!remainder) {
        throw new Error('Invalid url');
      }
      _ref1 = remainder.split('/'), hostname = _ref1[0], path = 2 <= _ref1.length ? __slice.call(_ref1, 1) : [];
      return [protocol, hostname, path.join('/')];
    };

    Util.urlParam = function(name) {
      var results;
      results = new RegExp("[\\?&]" + name).exec(window.location.href);
      return (results != null ? results[0] : void 0) || 0;
    };

    return Util;

  })();

  log = Util.urlParam('__keepr-debug__') ? (console.log('Keepr debug mode'), function() {
    var args;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return console.log.apply(console, args);
  }) : function() {
    var args;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
  };

  $(function() {
    return $.getJSON('DROPBOXAPP', function(appDetails) {
      var dropbox;
      console.log("Dropbox APP '" + appDetails.app + "'");
      dropbox = new Dropbox.Client({
        key: appDetails.key,
        sandbox: true
      });
      return dropbox.authenticate(function(err, data) {
        if (err) {
          throw new Error(err);
        }
        console.log("Dropbox APP '" + appDetails.app + "'");
        return new Keepr(JsonDrop.forDropbox(dropbox), '#app-ui');
      });
    });
  });

}).call(this);
