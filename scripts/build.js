#!/usr/bin/env node

var fs = require('fs')
var path = require('path')
var marked = require('marked')
var mkdirp = require('mkdirp')
var rimraf = require('rimraf')

var inPath = path.join(__dirname, '..', 'DEPs', 'proposals')
var template = fs.readFileSync(path.join(__dirname, '..', 'template.html'), 'utf-8')
var outPath = path.join(__dirname, '..', 'page')
var depPath = path.join(outPath, 'deps')
var extensionsPath = path.join(outPath, 'extensions')

// Clear page dir
rimraf.sync(outPath)
mkdirp.sync(depPath)

const indexHTML = path.join(__dirname, '..', 'index.html')
const styleCSS = path.join(__dirname, '..', 'style.css')
try {
  fs.unlinkSync(indexHTML)
  fs.unlinkSync(styleCSS)
  //file removed
} catch(err) {
  console.error(err)
}

// Copy site files to page dir
fs.writeFileSync(indexHTML, fs.readFileSync(path.join(__dirname, '..', 'site', 'index.html')))
fs.writeFileSync(styleCSS, fs.readFileSync(path.join(__dirname, '..', 'site', 'style.css')))

// Read DEPs directory
var depFilenames = fs.readdirSync(inPath)
var depList = depFilenames.filter(function (filename) { return filename.match(/.*\.md$/) }).map(parseDep)

// Read extensions
var extensions = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'extensions.json'), 'utf8'))

// Generate dynamic pages
genDEPsIndex(depList)
genExtensionsIndex(extensions)
depList.forEach(genDEPPage)

console.log('Done!')

function parseDep (filename) {
  var inFile = path.join(inPath, filename)
  var mdContent = fs.readFileSync(inFile, 'utf8')

  var link = `/deps/${filename.replace('.md', '')}`
  var title = mdContent.split('\n')[1].split('Title:')[1].replace(/\*\*/g, '').trim()
  var status = mdContent.match(/Status:(.*)\n/)[1].trim().split(' ')[0]
  var htmlContent = marked(mdContent)

  return {filename, title, link, status, htmlContent}
}

function genDEPsIndex (depList) {
  var title = 'Dat Enhancement Proposals (DEPs)'
  var mdContent = `
This page contains a series of "Dat Enhancement Proposal" (DEP) documents, part of the Dat Protocol development and standardization process.

These documents might be interesting reading to anybody wanting to learn more about protocol nitty gritties or the consensus process, but the documentation at docs.datproject.org is specifically written with end-users and application developers in mind.

### DEPs:

${depList.map(function (item) {
  return `* **[${item.status}]** [${item.title}](${item.link})`
}).join('\n')}

View [pre-draft DEPs](https://github.com/dat-ecosystem/DEPs/pulls) on GitHub.
  `.trim()

  var html = template.replace('{source}', marked(mdContent)).replace(/{title}/g, title)
  fs.writeFileSync(path.join(depPath, 'index.html'), html)
}

function genExtensionsIndex (extensions) {
  var title = 'Dat extensions'
  var mdContent = `
Extensions are additional message-types used in the Dat protocol's exchange between computers. They are used to add optional or experimental features to Dat.

Each extension is identified by a token, such as "session-data" or "ping". Developers are free to create and use their own extensions, but should avoid conflicting with any existing tokens. Refer to this list to see which tokens are in use. New extensions can be [proposed as DEPs](https://github.com/dat-ecosystem/DEPs#the-process).

This list includes the extensions which have been formally reviewed and accepted by the Dat Working Group.

### Extensions:

${extensions.map(function (item) {
  return `* **\`${item.id}\`** [${item.dep}](/deps/${item.dep}/)`
}).join('\n')}

  `.trim()

  var html = template.replace('{source}', marked(mdContent)).replace(/{title}/g, title)
  fs.mkdirSync(extensionsPath)
  fs.writeFileSync(path.join(extensionsPath, 'index.html'), html)
}

function genDEPPage (dep) {
  var fileDir = path.join(depPath, dep.filename.replace('.md', ''))
  var outFile = path.join(fileDir, 'index.html')
  var html = template.replace('{source}', dep.htmlContent).replace(/{title}/g, dep.title)
  fs.mkdirSync(fileDir)
  fs.writeFileSync(outFile, html)
}
