import { execSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const DAYS = 30
const OUTPUT_FILE = 'docs/recently-removed.md'

const IGNORED_FILES = [
  'docs/posts.md',
  'docs/unsafe.md',
  'docs/sandbox.md',
  'docs/feedback.md',
  'docs/index.md',
  'docs/startpage.md',
  OUTPUT_FILE
]

const IGNORED_DIRS = ['docs/posts/', 'docs/.vitepress/']

function isIgnored(file) {
  return (
    !file ||
    IGNORED_FILES.includes(file) ||
    IGNORED_DIRS.some((dir) => file.startsWith(dir))
  )
}

function generateRemovedSites() {
  console.log(`Generating recently removed sites from the last ${DAYS} days...`)
  console.log(`Current working directory: ${process.cwd()}`)

  if (!fs.existsSync('docs')) {
    console.error(
      'Error: "docs" directory not found in the current working directory.'
    )
    return
  }

  let gitDir = ''
  const isShallow =
    fs.existsSync('.git/shallow') || fs.existsSync('.git-temp/shallow')

  if (isShallow) {
    try {
      execSync(`git fetch --shallow-since="${DAYS + 1} days ago" --tags`)
    } catch (e) {}
  }

  if (!fs.existsSync('.git')) {
    try {
      const REPO_URL = 'https://github.com/fmhy/edit.git'
      const TEMP_GIT_DIR = '.git-temp'
      if (fs.existsSync(TEMP_GIT_DIR))
        fs.rmSync(TEMP_GIT_DIR, { recursive: true, force: true })
      execSync(
        `git clone --bare --filter=blob:none --shallow-since="${DAYS + 1} days ago" ${REPO_URL} ${TEMP_GIT_DIR}`
      )
      gitDir = `--git-dir=${TEMP_GIT_DIR}`
    } catch (e) {
      return
    }
  }

  try {
    execSync(`git ${gitDir} config --global --add safe.directory /app`)
  } catch (e) {}

  const logOutput = execSync(
    `git ${gitDir} log --since="${DAYS} days ago" --pretty=format:"---COMMIT---%H---MSG---%s" -p --unified=0 docs/`,
    { maxBuffer: 10 * 1024 * 1024 }
  ).toString()

  const commits = logOutput.split('---COMMIT---').filter(Boolean)
  const removedSites = []

  // Pure cross-platform replacement for "find | xargs cat"
  function getCombinedMarkdownContent() {
    const docsDir = path.resolve('docs')
    let combined = ''

    function walk(dir) {
      const files = fs.readdirSync(dir)
      for (const file of files) {
        const fullPath = path.join(dir, file)
        const stat = fs.statSync(fullPath)

        if (stat.isDirectory()) {
          walk(fullPath)
        } else if (file.endsWith('.md')) {
          const relativePath = path
            .relative(process.cwd(), fullPath)
            .replace(/\\/g, '/')
          if (!isIgnored(relativePath)) {
            combined += fs.readFileSync(fullPath, 'utf8') + '\n'
          }
        }
      }
    }

    walk(docsDir)
    return combined
  }

  const allCurrentDocs = getCombinedMarkdownContent()

  for (const commit of commits) {
    const lines = commit.split('\n')
    const header = lines[0]
    const [hash, ...msgParts] = header.split('---MSG---')
    const msg = msgParts.join('---MSG---')

    let currentFile = ''
    let currentLineNum = 0
    const deletions = []
    const additions = []

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      if (line.startsWith('diff --git')) {
        currentFile = line.split(' b/')[1]
        currentLineNum = 0
        continue
      }

      if (isIgnored(currentFile)) {
        continue
      }

      if (line.startsWith('@@ ')) {
        const match = line.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/)
        if (match) {
          currentLineNum = parseInt(match[1], 10)
        }
        continue
      }

      if (line.startsWith('-')) {
        if (line.includes('](')) {
          deletions.push({
            text: line.substring(1),
            file: currentFile,
            lineNum: currentLineNum
          })
        }
        currentLineNum++
      } else if (line.startsWith('+')) {
        if (line.includes('](')) {
          additions.push(line.substring(1))
        }
      } else if (line.startsWith(' ')) {
        currentLineNum++
      }
    }

    for (const del of deletions) {
      const urls = [...del.text.matchAll(/\[.*?\]\((.*?)\)/g)].map((m) => m[1])
      const names = [...del.text.matchAll(/\[(.*?)\]/g)].map((m) => m[1])

      if (urls.length > 0) {
        const isStillPresent =
          urls.some(
            (url) =>
              additions.some((add) => add.includes(url)) ||
              allCurrentDocs.includes(url)
          ) ||
          names.some(
            (name) =>
              name.length > 3 &&
              additions.some((add) => add.includes(`[${name}]`))
          )

        if (!isStillPresent) {
          const prMatch =
            msg.match(/\(#(\d+)\)/) || msg.match(/Merge pull request #(\d+)/)
          const pr = prMatch ? prMatch[1] : null

          let cleanText = del.text
            .trim()
            .replace(/^\*+\s*/, '')
            .replace(/^⭐\s*/, '')
          let cleanMsg = msg
            .trim()
            .replace(/:?\s*updated \d+ pages/i, '')
            .trim()

          removedSites.push({
            text: cleanText,
            urls,
            file: del.file,
            lineNum: del.lineNum,
            hash,
            msg: cleanMsg,
            pr,
            date: new Date().toISOString()
          })
        }
      }
    }
  }

  const uniqueRemoved = new Map()
  for (const site of removedSites) {
    const firstUrl = site.urls[0]
    if (!uniqueRemoved.has(firstUrl)) uniqueRemoved.set(firstUrl, site)
  }

  const sortedRemoved = Array.from(uniqueRemoved.values())

  let markdown = `# ► Recently Removed Sites\n\n\nThis page lists sites that were removed from the wiki in the last ${DAYS} days.\n\n> [!TIP]\n> For more information about why a site was removed, feel free to join our [Discord](https://github.com/fmhy/FMHY/wiki/FMHY-Discord).\n\n\n`

  if (sortedRemoved.length === 0) {
    markdown += `No sites were removed in the last ${DAYS} days.\n`
  } else {
    for (const site of sortedRemoved) {
      const fileHash = crypto
        .createHash('sha256')
        .update(site.file)
        .digest('hex')
      const lineAnchor = site.lineNum ? `L${site.lineNum}` : ''
      const commitLink = `https://github.com/fmhy/edit/commit/${site.hash}#diff-${fileHash}${lineAnchor}`
      const prLink = site.pr
        ? `, [PR #${site.pr}](https://github.com/fmhy/edit/pull/${site.pr})`
        : ''

      const linkMatch = site.text.match(/^(.*\[.*?\]\(.*?\)(?:\*\?)?)(.*)/)
      let searchablePart = site.text
      let hiddenPart = ''

      if (linkMatch) {
        searchablePart = linkMatch[1]
        hiddenPart = linkMatch[2]
      }

      const stripLinks = (t) =>
        t
          .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
          .replace(/https?:\/\/[^\s)]+/g, '')
          .replace(/\s+/g, ' ')
      const cleanSearchable = stripLinks(searchablePart).trim()
      let cleanHidden = stripLinks(hiddenPart)
      if (
        hiddenPart.trim().startsWith('-') &&
        !cleanHidden.trim().startsWith('-')
      ) {
        cleanHidden = ` - ${cleanHidden.trim()}`
      }

      const cleanMsg = site.msg ? `: ${stripLinks(site.msg).trim()}` : ''
      markdown += `- ${cleanSearchable} ${cleanHidden} (Removed in [\`${site.hash.slice(0, 7)}\`](${commitLink})${prLink}${cleanMsg})\n`
    }
  }

  fs.writeFileSync(OUTPUT_FILE, markdown)
  console.log(
    `Successfully generated ${OUTPUT_FILE} with ${sortedRemoved.length} entries.`
  )

  if (gitDir.includes('.git-temp')) {
    try {
      fs.rmSync(gitDir.split('=')[1], { recursive: true, force: true })
    } catch (e) {}
  }
}

try {
  generateRemovedSites()
} catch (error) {
  console.error('Error generating removed sites:', error)
  process.exit(1)
}
