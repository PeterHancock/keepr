class Keepr
  # @param {JSONDrop} jsonDrop database client
  constructor: (@jsonDrop, root) ->
    @$root = $ root
    @$table = $ '#table'
    @$rowTemplate = $('#row-template').text()
    @jsonDrop.load (db) => 
      @db = db ? @initiateDb()
      @render()
      @$root.removeClass 'hidden'

  initiateDb: () ->
    db = []
    @jsonDrop.save db, () =>
    db
 
  render: () ->
    @$table.empty()
    @renderRow(row) for row in @db

  renderRow: (row) ->
    $row = $ @$rowTemplate
    $('.url', $row).text row.url    
    $('.url', $row).attr('href', row.url)    
    $('.url', $row).attr('target', '_new')    
    $('.username', $row).text row.username
    $('.password-key', $row).text row.passwordKey
    @$table.append $row

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
