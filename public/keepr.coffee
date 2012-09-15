class Keepr
  # @param {JSONDrop} jsonDrop database client
  constructor: (@jsonDrop, root) ->
    @$root = $ root
    @$accountList = $ '#account-list'
    @$accountTemplate = $('#account-template').text()
    @$generatePasswordTemplate = $('#generate-password-template').text()
    @jsonDrop.load (db) => 
      @db = db ? @initiateDb()
      @passwordGenerator = Function("passwordKey, privateKey, sha1, sha1base64, urlEncode", @db.passwordGenerator)
      @passwords = @db.passwords
      @wire()
      @render()
      @$root.removeClass 'hidden'

  initiateDb: () ->
    db = {paswordGenerator: "alert('No password generator is set!'); null;", passwords: []}
    @jsonDrop.save db, () =>
    db

  wire: () ->
    $('#new-account-form').submit (event) => @onNewAccount event

  render: () ->
    @$accountList.empty()
    @renderAccount(account) for account in @passwords

  renderAccount: (account) ->
    $account = $ @$accountTemplate
    $('.url', $account).text account.url
    $('.url', $account).attr('href', account.url)
    $('.url', $account).attr('target', '_new')
    $('.username', $account).text account.username
    $('.password-key', $account).text account.passwordAccount
    $('.password-button', $account).click (event) => @onGeneratePassword event, account
    $('.account-remove-button', $account).click (event) => @onRemoveAccount event, account
    @$accountList.append $account

  onRemoveAccount: (event, account) ->
    i = index for r, index in @passwords when r.url == account.url
    @passwords.splice i,1
    @jsonDrop.save @db, () =>
      @render()

  onNewAccount: (event) ->
    event.preventDefault()
    url = $('#new-url').val()
    username = $('#new-username').val()
    key = $('#new-password-key').val()
    # TODO check url does not exist and validate
    $('#new-key-button').attr 'disabled', 'disabled'
    account = {url: url, username: username, passwordKey: key}
    @passwords.push account
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
    @passwordGenerator(passwordKey, privateKey, sha1, sha1base64,      urlEncode)

# Utility
urlParam = (name) ->
    results = new RegExp("[\\?&]#{name}").exec(window.location.href)
    return results?[0] || 0

logger = if urlParam('__keepr-debug__')
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
