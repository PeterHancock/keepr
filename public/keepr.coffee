# Main Keepr controller
class Keepr
  # @param {JSONDrop} jsonDrop database client
  constructor: (@jsonDrop, root) ->
    @$root = $ root
    @$accountList = $ '#account-list'
    @$accountTemplate = $('#account-template').text()
    @$generatePasswordTemplate = $('#generate-password-template').text()
    @$deleteAccountTemplate = $('#delete-account-template').text()
    @jsonDrop.load (db) => 
      @db = db ? initiateDb(jsonDrop)
      @passwordGenerator = Function("passwordKey, privateKey, sha1, sha1base64, urlEncode", @db.passwordGenerator)
      @accounts = @db.accounts
      @wire()
      @render()
      @$root.removeClass 'hidden'

  initiateDb = (jsonDrop) ->
    db = {paswordGenerator: "alert('No password generator is set!'); null;", accounts: []}
    jsonDrop.save db, () =>
    db

  wire: () ->
    $('#new-account-form').submit (event) => @onNewAccount event

  render: () ->
    @$accountList.empty()
    @renderAccount(account) for account in _.sortBy @accounts, (account) -> account.url

  renderAccount: (account) ->
    $account = $ @$accountTemplate
    $('.url', $account).text account.url
    $('.url', $account).attr('href', account.url)
    $('.url', $account).attr('target', '_new')
    $('.username', $account).text account.username
    $('.password-key', $account).text account.passwordAccount
    $('.password-button', $account).click (event) => @onGeneratePassword event, account
    $('.account-delete-button', $account).click (event) => @onDeleteAccount event, account
    @$accountList.append $account

  onDeleteAccount: (event, account) ->
    $dialog = $ '#delete-account'
    $dialog.empty()
    $dialog.dialog()
      .append(@$deleteAccountTemplate)
    $('.confirm', $dialog).click (event) =>
      @accounts = _.reject @accounts, (a) -> a.url == account.url
      @db.accounts = @accounts
      $dialog.dialog 'close'
      @jsonDrop.save @db, () =>
        @render()
    $('.cancel', $dialog).click (event) =>
      $dialog.dialog 'close'
      log 'Cancelled the deletion of account'

  onNewAccount: (event) ->
    event.preventDefault()
    url = $('#new-url').val()
    username = $('#new-username').val()
    key = $('#new-password-key').val()
    # TODO check url does not exist and validate
    $('#new-key-button').attr 'disabled', 'disabled'
    account = new Account(url: url, username: username, passwordKey: key)
    @accounts.push account
    @jsonDrop.save @db, () =>
      $('#new-key-button').removeAttr 'disabled'
      @render() 
 
  onGeneratePassword: (event, account) ->
    $dialog = $ '#generate-password'
    $dialog.empty()
    $dialog.dialog()
        .append($ @$generatePasswordTemplate)
    $('#generate-password-form').submit (event) =>
      event.preventDefault()
      @showPassword account
      $dialog.dialog 'close'

  showPassword: (account) ->
    privateKey = $('#private-key').val()
    privateKeyRepeat = $('#private-key-repeat').val()
    return console.log 'passwords do not match' if privateKey != privateKeyRepeat
    alert @generatePassword(account.passwordKey, privateKey)[0..8] + '***...'

  generatePassword: (passwordKey, privateKey) ->
    sha1 = (str) ->
      CryptoJS.SHA1(str).toString()
    sha1base64 = (str) ->
      CryptoJS.SHA1(str).toString(CryptoJS.enc.Base64)
    urlEncode = (str) ->
      str.replace('+', '-').replace('/', '_')
    @passwordGenerator(passwordKey, privateKey, sha1, sha1base64, urlEncode)


class Account
    constructor: ({@url, @username, @passwordKey}) ->

# Utility
urlParam = (name) ->
    results = new RegExp("[\\?&]#{name}").exec(window.location.href)
    return results?[0] || 0

log = if urlParam('__keepr-debug__')
    console.log 'Keepr debug mode'
    (args...) -> console.log args...
else
    (args...) -> return

$ ->
  # The Dropbox App key
  key = 'r2mjxyg3kgewwfd'
  # The Dropbox App secret
  secret = 'txagd2sle3n1s3y'
  jsonDrop = new JsonDrop(key: key, secret: secret)
  new Keepr jsonDrop, '#app-ui'
