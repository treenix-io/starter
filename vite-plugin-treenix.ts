import type { Plugin } from 'vite'
import { readFile } from 'node:fs/promises'

export function treenixServer(configPath = 'root.json'): Plugin {
  return {
    name: 'treenix-server',
    async configureServer() {
      const { treenix } = await import('@treenx/core/server/factory')
      const rootNode = JSON.parse(await readFile(configPath, 'utf-8'))
      const t = await treenix({ rootNode })
      await t.listen(3211)
    },
  }
}
