/*

  I... had some trouble with jekyll.

  Copy every file (not starting with _ or . or ending in ~) under the
  current directory to _generated.  If it's .md turn it into .html by
  marked() with ./prefix.html prepended.  Maybe some substitutions done?

  ? use .gitignore ?   use https://www.npmjs.com/package/ignore

  in ngingx you'll want
         try_files $uri $uri.html $uri/ =404;	
  because we dont write .html at the end our previously-markdown file
*/

const cheerio = require('cheerio')
const marked = require('marked')
const walk = require('walk')
const fs = require('fs').promises
const path = require('path');
const debug = require('debug')('gensite')

// copy every file, translating if it ends in .md


// find-all-files
// marked
// html conversion via

const out = './_generated'
const options = {}

async function run () {
  const pre = await fs.readFile('prefix.html', 'utf8')
  const walker = walk.walk('.', options)

  walker.on('file', async (root, stats, next) => {
    let filename = path.join(root, stats.name)
    if (root.startsWith(out) ||
        filename.match(/\/node_modules\//) ||
        filename.match(/(^|\/)[._]/) ||
        // stats.name.startsWith('_') ||
        // stats.name.startsWith('.') ||
        stats.name.endsWith('~')) {
      next()
      return
    }
    let bytes = await fs.readFile(filename)
    console.log('read', root, stats.name, filename)
    if (filename.match(/\.md$/)) {
      let text = bytes.toString('utf8')
      // console.log('TEXT IS', text)
      const result = handleMarkdown(text, filename)
      // console.log('MD now', result)
      // [text, filename] = result
      text = result[0]
      filename = result[1]
      // console.log('TEXT2 IS', text)
      // console.log(text)
      bytes = Buffer.from(text, 'utf8')
    }
    const outDir = path.join(out, root)
    try {
      await fs.mkdir(path.join(out, root), {recursive: true})
    } catch (e) {
      // probably that it already exists
      // and anything else we'll report below
    }
    const outfile = path.join(out, filename)
    await fs.writeFile(outfile, bytes)
    // const file = await fs.open(path.join(out, filename), 'w')
    // await file.write(bytes)
    // make the new timestamps match the orig file
    await fs.utimes(outfile, stats.atimeMs/1000, stats.mtimeMs/1000)
    // await file.utimes(stats.atimeMs, stats.mtimeMs)
    // await file.close()
    next() // COULD call this much earlier; doesnt matter much
  })

  walker.on('end', () => {
    fs.symlink('README.html', path.join(out, 'index.html'))
    console.log('all done');
  });

  walker.on('errors', async (root, stats, next) => {
    console.error('ERROR', stats.error)
    next()
  })

  function handleMarkdown (text, filename) {
    filename = filename.replace(/\.md$/, '.html')
    const options = {
      gfm: true
    }
    text = marked(text, options)
    const $ = cheerio.load(pre + text)
    $('a').attr('href', function (i, text) {
      if (text) {
        return text.replace(/\.md$/, '')
      } else {
        return text
      }
    })
    /*
    $('a').each(function (i, elem) {
      const mlink = $(elem).attr('href')
      // could do .html, but we trust webserver config
      const hlink = mlink.replace(/\.md$/, '')
    })
    */
    text = $.html()
    return [text, filename]
  }

}

run()
