var read = require('read');
var JsonDrop = require('jsondrop');
var Dropbox = require('dropbox');
var underscore = require('underscore');
var CryptoJS = require("crypto-js");

var sha1 = function(str) {
  return CryptoJS.SHA1(str).toString();
};
var sha1base64 = function(str) {
  return CryptoJS.SHA1(str).toString(CryptoJS.enc.Base64);
};
var urlEncode = function(str) {
  return str.replace('+', '-').replace('/', '_');
};

function withJsonDrop(callback) {
    var dropbox = new Dropbox.Client({
        key: 'r2mjxyg3kgewwfd',
        secret: 'txagd2sle3n1s3y',
        sandbox: true
    });
    var jsonDrop = JsonDrop.forDropbox(dropbox);
    dropbox.authDriver(new Dropbox.AuthDriver.NodeServer(8080));
    dropbox.authenticate(function(err, data) {
        if (err) {
            throw new Error(err);
        }
        return callback(jsonDrop);

    });
}

function failOr(callback) {
    return function(err){
        if(err) {
            throw err;
        }
        return callback.apply(this, Array.prototype.splice.call(arguments, 1));
    }
}

withJsonDrop(function(jsonDrop){
    jsonDrop.get('passwordGenerator').get(failOr(function(code) {
      var passwordGenerator = Function("passwordKey, privateKey, sha1, sha1base64, urlEncode", code);   
            jsonDrop.get('accounts').map(failOr(function(accounts) {
                if (process.argv.length == 2) {
                    underscore.each(accounts, function(account) {
                        console.log(account.url);
                    });
                } else {
                    var url = process.argv[2];
                    read({ prompt: 'Enter Secret Key: ', silent: true }, failOr(function(secret) {
                        var key = underscore.find(accounts, function(account){ return account.url === url; }).passwordKey;
                        console.log(passwordGenerator(key, secret, sha1, sha1base64, urlEncode));
                    }));
                };    
            }));
        })); 
});
