
var fs = require('fs')
var path = require('path')

function splitPath(path) {
  var parts = path.split(/(\/|\\)/)
  if (!parts.length) return parts

  // when path starts with a slash, the first part is empty string
  return !parts[0].length ? parts.slice(1) : parts
}

function findParentDirSync(currentFullPath, clue) {

  function testDir(parts) {
    if (parts.length === 0) return null;

    var p = parts.join('')
    var filePath = ''

    if (Array.isArray(clue)) {
      for (var i = 0; i < clue.length; i++) {
        filePath = path.join(p, clue[i])
        var itdoes = fs.existsSync(filePath)
        if (itdoes) return filePath
      }
      return testDir(parts.slice(0, -1));
    } else {
      filePath = path.join(p, clue)
      var itdoes = fs.existsSync(filePath)
      return itdoes ? filePath : testDir(parts.slice(0, -1))
    }
  }

  return testDir(splitPath(currentFullPath))
}

function requireIn(moduleName, nodeModulesPath) {
  return require(path.join(nodeModulesPath, moduleName))
}

exports.transform = function (fileName, content) {
  var dir = path.dirname(fileName)
  var ruleFile = findParentDirSync(dir, ['.remarkrc', '.remarkrc.js'])
  if (!ruleFile) {
    // do nothing
    return content
  }
  var nodeModulesPath = findParentDirSync(dir, 'node_modules')
  if (!nodeModulesPath) {
    // do nothing
    return content
  }
  var rule
  try {
    if (ruleFile.endsWith('.js')) {
      rule = require(ruleFile)
    } else {
      rule = JSON.parse(fs.readFileSync(ruleFile).toString())
    }
  } catch (err) {
    console.error(err)
    // error, PASS
    return content
  }
  var remark = requireIn('remark', nodeModulesPath)
  var report = requireIn('vfile-reporter', nodeModulesPath)
  var processor = remark()
  if (rule['settings']) {
    processor.data('settings', rule['settings'])
  }
  if (rule['plugins']) {
    var plugins = rule['plugins']
    for (var i = 0; i < plugins.length; i++) {
      if (Array.isArray(plugins[i])) {
        processor.use(requireIn('remark-' + plugins[i][0], nodeModulesPath), plugins[i][1])
      } else {
        processor.use(requireIn('remark-' + plugins[i], nodeModulesPath))
      }
    }
  }
  var file = processor.processSync(content)
  console.log(report(file))
  this.reloadContent(file.toString(), true)
  return file.contents
}
