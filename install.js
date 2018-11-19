#!/bin/env node

var fs = require('fs')
var path = require('path')

var replaceCodeRegex = /(registerDynamic\(((?!registerDynamic\().)*?,\[)(\],((?!registerDynamic\().)*?);(((?!registerDynamic\().)*?)(this\.lock\?.*?writeFile)/
var replaceCodeContent = '$1"44"$3;var mod=e;$5;var w=mod("44"),plugin=reqnode("typora-remark");e=plugin.transform.call(w,this.file,e);$7'

var appPath = path.join(__dirname, '../../')
var framePath = path.join(appPath, 'app/window/frame.js')

if (!fs.existsSync(framePath)) {
  console.error('frame.js not found')
  process.exit(1)
}

var frameCode = fs.readFileSync(framePath).toString()
if (frameCode.indexOf('"typora-remark"') >= 0) {
  console.error('typora-remark already installed!')
  process.exit(1)
}
if (!replaceCodeRegex.test(frameCode)) {
  console.error('unable to apply patch code')
  process.exit(1)
}

frameCode = frameCode.replace(replaceCodeRegex, replaceCodeContent)
fs.renameSync(framePath, framePath + '.bak')

fs.writeFileSync(framePath, frameCode)
console.log('typora-remark installed successfully!')
