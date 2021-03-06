# vim: set tabstop=2 shiftwidth=2 softtabstop=2 expandtab :
# Main Keepr controller
class Keepr
  # @param {JSONDrop} jsonDrop database client
  constructor: (@jsonDrop, root) ->
    @$root = $ root
    @$accountList = $ '#account-list'
    @$modalPlaceholder = $ '#modal-holder'
    @$accountTemplate = $('#account-template').text()
    @$generatePasswordTemplate = $('#generate-password-template').text()
    @$deleteAccountTemplate = $('#delete-account-template').text()
    $('#logout').click (event) => @logout()
    onErr = (err) =>
      $('#error-notice').removeClass 'hidden'
      return console.log err
    onLoad = _.after 2, () =>
        @wire()
        @render()
        @$root.removeClass 'hidden'
    @jsonDrop.get('passwordGenerator').get (err, val) =>
      return onErr(err) if err
      @passwordGenerator = Function("passwordKey, privateKey, sha1, sha1base64, urlEncode", val)
      onLoad()
    @jsonDrop.get('accounts').map(
      (val, node) ->
        account = new Account(val)
        account.node = node
        account
      (err, accounts) =>
        return onErr(err) if err
        @accounts = accounts
        onLoad())

  wire: ->
    $('#new-account-form').submit (event) => @onCreateAccount event
    $('#cancel-new-account-button').click (event) =>
      event.preventDefault()
      @clearNewAccountForm()

  render: ->
    @$accountList.empty()
    @renderAccount(account) for account in _.sortBy @accounts, (account) -> account.url

  renderAccount: (account) ->
    $account = $ @$accountTemplate
    id = _.uniqueId('account_')
    $('.accordion-toggle', $account).attr('href', '#' + id)
    $('.accordion-body', $account).attr('id', id)
    [protocol, hostname, path] = Util.splitUrl(account.url)
    $('.url-protocol', $account).text protocol + '://'
    $('.url-hostname', $account).text hostname
    $('.url-path', $account).text '/' + path if path
    $('.url', $account).attr('href', account.url)
    $('.url', $account).attr('target', '_new')
    $('.password-button', $account).click (event) => @onGeneratePassword event, account
    $('.edit-button', $account).click (event) => @onEditAccount event, account
    @$accountList.append $account

  onEditAccount: (event, account) ->
    @$modalPlaceholder.empty().append $('#edit-account-template').text()
    $modal = $('.modal', @$modalPlaceholder)
    $('.url', $modal ).text account.url
    $('.username', $modal ).text account.username
    $('.password-key', $modal ).text account.passwordKey
    $('.account-delete-button', $modal).click (event) =>
      $modal.modal 'hide'
      @onDeleteAccount event, account
    $modal.modal 'show'
    $modal.on 'hidden', => log 'Done editing'

  onDeleteAccount: (event, account) ->
    @$modalPlaceholder.empty().append(@$deleteAccountTemplate)
    $modal = $('.modal', @$modalPlaceholder)
    $modal.modal 'show'
    $('.confirm', $modal).click (event) =>
      @accounts = _.reject @accounts, (a) -> a.url == account.url
      $modal.modal 'hide'
      account.node.remove (err) =>
        @render()
    $('.cancel', $modal).click (event) =>
      $modal.modal 'hide'
    $modal.on 'hidden', => log 'Cancelled the deletion of account'

  onCreateAccount: (event) ->
    event.preventDefault()
    url = $('#new-url').val()
    username = $('#new-username').val()
    key = $('#new-password-key').val()
    @promptPrivateKey (err, privateKey) =>
      return alert err if err
      try
        account = new Account(url: url, username: username, passwordKey: key)
      catch error
        return alert "The url '#{url}' is invalid"
      @accounts.push account
      @jsonDrop.get('accounts').push account.val(), (err, node) =>
        return alert err if err
        account.node = node
        @render()
        @clearNewAccountForm()

  clearNewAccountForm: ->
    $('#new-account-form input').each -> $(this).val('')

  onGeneratePassword: (event, account) ->
    @promptPrivateKey (err, privateKey) =>
      return alert err if err
      return @showPassword account, @generatePassword(account.passwordKey, privateKey)

  promptPrivateKey: (callback) ->
    $modalPlaceholder = $ '#modal-holder'
    $modalPlaceholder.empty().append($ $('#generate-single-password-template').text())
    $modal = $('.modal', $modalPlaceholder)
    $modal.modal 'show'
    $('#generate-password-form').submit (event) =>
      event.preventDefault()
      privateKey = $('#private-key').val()
      $modal.modal 'hide'
      $modalPlaceholder.empty()
      callback null, privateKey

  showPassword: (account, password) ->
    $tmpl = $('#show-password-template').text()
    $modalPlaceholder = $ '#modal-holder'
    $modalPlaceholder.empty().append($tmpl)
    $modal = $('.modal', $modalPlaceholder)
    $modal.modal 'show'
    $('.show-password', $modal).val(password).select()
    password = null
    # Remove the password on time out
    setTimeout (-> $modal.modal 'hide'), 15000
    $modal.on 'hidden', => $modalPlaceholder.empty()

  generatePassword: (passwordKey, privateKey) ->
    sha1 = (str) ->
      CryptoJS.SHA1(str).toString()
    sha1base64 = (str) ->
      CryptoJS.SHA1(str).toString(CryptoJS.enc.Base64)
    urlEncode = (str) ->
      str.replace('+', '-').replace('/', '_')
    @passwordGenerator(passwordKey, privateKey, sha1, sha1base64, urlEncode)

  # Called when the user wants to log out of the application.
  logout: () ->
    @jsonDrop.fsys.dropbox.signOut (error) =>
      window.location.href = "login.html"

class Account
    constructor: ({@url, @username, @passwordKey, @passwordHash}) ->
      try
        Util.splitUrl @url
      catch error
        throw error
      @node = null
    val: () ->
      {url: @url, username: @username, passwordKey: @passwordKey, passwordHash: @passwordHash}
    updatePasswordHash: (passwordHash, callback) ->
      currentPasswordHash = @passwordHash
      @passwordHash = passwordHash
      @node.set @val(), (err) =>
        if err
          @passwordHash = currentPasswordHash
          return callback err
        else
          callback()

class Util
  @splitUrl = (url) ->
    [protocol, remainder] = url.split '://'
    throw new Error('Invalid url') unless remainder
    [hostname, path...] = remainder.split('/')
    [protocol, hostname, path.join('/')]

  @urlParam = (name) ->
    results = new RegExp("[\\?&]#{name}").exec(window.location.href)
    return results?[0] || 0

log = if Util.urlParam('__keepr-debug__')
    console.log 'Keepr debug mode'
    (args...) -> console.log args...
else
    (args...) -> return

$ ->
    $.getJSON 'DROPBOXAPP', (appDetails) ->
        console.log "Dropbox APP '#{appDetails.app}'"
        dropbox = new Dropbox.Client(key: appDetails.key, sandbox: true)
        dropbox.authenticate (err, data) ->
            throw new Error(err) if err
            console.log "Dropbox APP '#{appDetails.app}'"
            new Keepr(JsonDrop.forDropbox(dropbox), '#app-ui')
