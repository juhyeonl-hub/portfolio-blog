// Vite plugins shared by the blog build (vite.config.js) and the standalone ASBC build (vite.asbc.config.js).
import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'

const dictionaryFile = fileURLToPath(new URL('./shadowcraft/lib/data/ui-translations.json', import.meta.url))
const LOCALES = ['en', 'ja', 'fi']

/**
 * `virtual:asbc-locale/<en|ja|fi>`: the UI dictionary for one language only ({ko: translated}), so a visitor downloads
 * the language they read instead of all four (Korean, the source language, needs no dictionary at all).
 * The source file stays lib/data/ui-translations.json, which the unit tests read directly.
 */
export function asbcLocaleBundles() {
  const prefix = 'virtual:asbc-locale/'
  return {
    name: 'asbc-locale-bundles',
    resolveId(id) { return id.startsWith(prefix) ? '\0' + id : null },
    load(id) {
      if (!id.startsWith('\0' + prefix)) return null
      const locale = id.slice(('\0' + prefix).length)
      if (!LOCALES.includes(locale)) throw new Error(`Unknown ASBC locale bundle: ${locale}`)
      this.addWatchFile(dictionaryFile)
      const all = JSON.parse(readFileSync(dictionaryFile, 'utf8'))
      const messages = {}
      for (const [key, values] of Object.entries(all)) if (values && values[locale]) messages[key] = values[locale]
      return `export default {messages:${JSON.stringify(messages)}};`
    },
  }
}
