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
    onLoad = _.after 2, (err) =>
        if err
          $('#error-notice').removeClass 'hidden'
          return console.log err
        @wire()
        @render()
        @$root.removeClass 'hidden'
    @jsonDrop.get('passwordGenerator').getVal (err, val) =>
      return onLoad(err) if err
      @passwordGenerator = Function("passwordKey, privateKey, sha1, sha1base64, urlEncode", val)
      onLoad()
    @jsonDrop.get('accounts').map(
      (val, node) ->
        account = new Account(val)
        account.node = node
        account
      (err, accounts) =>
        return onLoad(err) if err
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
    $('.username', $account).text account.username
    $('.password-key', $account).text account.passwordKey
    $('.password-button', $account).click (event) => @onGeneratePassword event, account
    $('.account-delete-button', $account).click (event) => @onDeleteAccount event, account
    @$accountList.append $account

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
    $('#new-key-button').attr 'disabled', 'disabled'
    try
      account = new Account(url: url, username: username, passwordKey: key)
    catch error
      alert "The url '#{url}' is invalid"
      return
    @accounts.push account
    @jsonDrop.get('accounts').pushVal account, (err, node) =>
      return alert err if err
      account.node = node
      @render()
      $('#new-key-button').removeAttr 'disabled'
      @clearNewAccountForm()

  clearNewAccountForm: ->
    $('#new-account-form input').each -> $(this).val('')

  onGeneratePassword: (event, account) ->
    $modalPlaceholder = $ '#modal-holder'
    $modalPlaceholder.empty().append($ @$generatePasswordTemplate)
    $modal = $('.modal', $modalPlaceholder)
    $modal.modal 'show'
    $('#generate-password-form').submit (event) =>
      event.preventDefault()
      privateKey = $('#private-key').val()
      privateKeyRepeat = $('#private-key-repeat').val()
      $modal.modal 'hide'
      $modalPlaceholder.empty()
      return alert 'passwords do not match' if privateKey != privateKeyRepeat
      @showPassword account, privateKey

  showPassword: (account, privateKey) ->
    password = @generatePassword(account.passwordKey, privateKey)
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
    constructor: ({@url, @username, @passwordKey}) ->
      try
        Util.splitUrl @url
      catch error
        throw error
      @node = null

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
  # The Dropbox App key
  key = 'ItqJc7dXdkA=|zw4NUV7gAyoyYYzAl/35HXOKgUN/4nv3Tr8MbeVi6Q=='
  # The Dropbox App secret
  jsonDrop = new JsonDrop(key: key)
  new Keepr jsonDrop, '#app-ui'
