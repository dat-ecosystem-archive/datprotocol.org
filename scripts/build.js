#!/usr/bin/env node

var fs = require('fs')
var path = require('path')
var marked = require('marked')
var mkdirp = require('mkdirp')
var rimraf = require('rimraf')

var inPath = path.join(__dirname, '..', 'DEPs', 'proposals')
var template = fs.readFileSync(path.join(__dirname, '..', 'template.html'), 'utf-8')
var outPath = path.join(__dirname, '..', 'build')
var depPath = path.join(outPath, 'deps')
var depList = []

// Clear build dir
rimraf.sync(outPath)
mkdirp.sync(depPath)

// Copy site files to build dir
fs.writeFileSync(path.join(outPath, 'index.html'), fs.readFileSync(path.join(__dirname, '..', 'site', 'index.html')))
fs.writeFileSync(path.join(outPath, 'style.css'), fs.readFileSync(path.join(__dirname, '..', 'site', 'style.css')))

fs.readdir(inPath, function (err, list) {
  if (err) throw err
  list.filter(function (file) { return file.match(/.*\.md$/) }).map(createPage)

  var title = 'Dat Enhancement Proposals (DEPs)'
  var mdContent = `
DEPs:

${depList.map(function (item) {
  return `* **[${item.status}]** [${item.title}](${item.link})`
})}
  `.trim()

  var html = template.replace('{source}', marked(mdContent)).replace(/{title}/g, title)
  fs.writeFileSync(path.join(depPath, 'index.html'), html)
})

function createPage (dep) {
  var inFile = path.join(inPath, dep)
  var fileDir = path.join(depPath, dep.replace('.md', ''))
  var outFile = path.join(fileDir, 'index.html')
  var mdContent = fs.readFileSync(inFile, 'utf8')

  var link = `/deps/${dep.replace('.md', '')}`
  var title = mdContent.split('\n')[1].split('Title:')[1].replace(/\*\*/g, '').trim()
  var status = mdContent.match(/Status:(.*)\n/)[1].trim().split(' ')[0]
  var htmlContent = marked(mdContent)

  depList.push({title, link, status})
  var html = template.replace('{source}', htmlContent).replace(/{title}/g, title)
  fs.mkdirSync(fileDir)
  fs.writeFileSync(outFile, html)
}
