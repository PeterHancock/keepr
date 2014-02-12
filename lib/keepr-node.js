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

var Keepr = exports.Keepr = function(options) {
    options = options || {};
    var url = options.url;
    withJsonDrop(function(jsonDrop){
            jsonDrop.get('passwordGenerator').get(failOr(function(code) {
                    var passwordGenerator = Function("passwordKey, privateKey, sha1, sha1base64, urlEncode", code);   
                    jsonDrop.get('accounts').map(failOr(function(accounts) {
                            if (url) {
                                var account = underscore.find(accounts, function(account){ return account.url === url; });
                                if(!account) {
                                    console.log("No password for site " + url + ".  Run keepr with no args for a list of urls");
                                    throw "Invalid site";
                                }
                                read({ prompt: 'Enter Secret Key: ', silent: true }, failOr(function(secret) {
                                    console.log(passwordGenerator(account.passwordKey, secret, sha1, sha1base64, urlEncode));
                                }));
                            } else {
                                console.log("Sites:");
                                underscore.each(accounts, function(account) {
                                    console.log(account.url);
                               });
                            }    
                            }));
                    })); 
            });
};
