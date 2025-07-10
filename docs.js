import express from 'express'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const port = 3251

const serveJsonFrom = (routePrefix, folderPath) => {
  const basePath = join(__dirname, folderPath)

  const walkDir = (dir) => {
    const files = readdirSync(dir)
    for (const file of files) {
      const fullPath = join(dir, file)
      const relPath = fullPath.replace(basePath, '').replace(/\\/g, '/')
      if (statSync(fullPath).isDirectory()) {
        walkDir(fullPath)
      } else if (file.endsWith('.json')) {
        app.get(`${routePrefix}${relPath}`, (req, res) => {
          const json = readFileSync(fullPath, 'utf8')
          res.setHeader('Content-Type', 'application/json')
          res.send(json)
        })
      }
    }
  }

  walkDir(basePath)
}

app.get('/docs/openapi.json', (req, res) => {
  const filePath = join(__dirname, './docs/openapi.json')
  const json = readFileSync(filePath, 'utf8')
  res.setHeader('Content-Type', 'application/json')
  res.send(json)
})

app.get('/docs', (req, res) => {
  res.setHeader('Content-Type', 'text/html')
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Omnichannel CRM API - Redoc</title>
      <meta charset="utf-8"/>
      <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
    </head>
    <body>
      <div id="redoc-container"></div>
      <script>
        Redoc.init('/docs/openapi.json', {}, document.getElementById('redoc-container'))
      </script>
    </body>
    </html>
  `)
})

// Serve nested JSON endpoints
serveJsonFrom('/docs/paths', './docs/paths')
serveJsonFrom('/docs/components', './docs/components')

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`)
})
