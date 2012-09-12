class Keepr
  # @param {JSONDrop} jsonDrop database client
  constructor: (@jsonDrop, root) ->
    @$root = $ root
    @$keyList = $ '#key-list'
    @$rowTemplate = $('#row-template').text()
    @$dialogTemplate = $('#dialog-template').text()
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
    $('#new-key-form').submit (event) => @onNewKey event

  render: () ->
    @$keyList.empty()
    @renderRow(row) for row in @passwords

  renderRow: (row) ->
    $row = $ @$rowTemplate
    $('.url', $row).text row.url    
    $('.url', $row).attr('href', row.url)    
    $('.url', $row).attr('target', '_new')    
    $('.username', $row).text row.username
    $('.password-key', $row).text row.passwordKey
    $('.password-button', $row).click (event) => @onDisplayPassword event, row
    $('.key-remove-button', $row).click (event) => @onRemoveRow event, row
    @$keyList.append $row

  onDisplayPassword: (event, row) ->
    $dialog = $ '#generate-dialog'
    $dialog.empty()
    $dialog.dialog()
        .append($ @$dialogTemplate)
    $('#generate-form').submit (event) =>
      event.preventDefault()
      @onGeneratePassword row
      $dialog.dialog 'close'

  onRemoveRow: (event, row) ->
    i = index for r, index in @passwords when r.url == row.url
    @passwords.splice i,1
    @jsonDrop.save @db, () =>
      @render()

  onNewKey: (event) ->
    event.preventDefault()
    username = $('#new-username').val()
    key = $('#new-password-key').val()
    url = $('#new-url').val()
    # TODO check url does not exist and validate
    $('#new-key-button').attr 'disabled', 'disabled'
    row = {url: url, username: username, passwordKey: key}
    @passwords.push row
    @jsonDrop.save @db, () =>
      $('#new-key-button').removeAttr 'disabled'
      @render() 
 
  onGeneratePassword: (row) ->
    privateKey = $('#private-key').val()
    privateKeyRepeat = $('#private-key-repeat').val()
    return console.log 'passwords do not match' if privateKey != privateKeyRepeat
    console.log @generatePassword(row.passwordKey, privateKey)[0..8] + '***...'

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
  key = 'r2mjxyg3kgewwfd'
  secret = 'txagd2sle3n1s3y'
  jsonDrop = new JsonDrop(
  # TODO these codes are for the jsondrop client app
    key: key, secret: secret)
  new Keepr jsonDrop, '#app-ui'
