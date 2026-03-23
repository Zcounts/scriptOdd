import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const mainBundlePath = resolve('out/main/index.js')
const preloadBundlePath = resolve('out/preload/index.mjs')
const forbiddenImport = 'import { autoUpdater } from "electron-updater";'
const legacyPreloadPath = '../preload/index.js'
const expectedPreloadPath = '../preload/index.mjs'

function fail(message) {
  console.error(`[verify-electron-bundle] ${message}`)
  process.exit(1)
}

if (!existsSync(mainBundlePath)) {
  fail(`Missing main bundle: ${mainBundlePath}`)
}

if (!existsSync(preloadBundlePath)) {
  fail(`Missing preload bundle: ${preloadBundlePath}`)
}

const mainBundle = readFileSync(mainBundlePath, 'utf8')

if (mainBundle.includes(forbiddenImport)) {
  fail(`Found forbidden named electron-updater import in ${mainBundlePath}`)
}

if (mainBundle.includes(legacyPreloadPath)) {
  fail(`Main bundle still references the stale preload path ${legacyPreloadPath}`)
}

if (!mainBundle.includes(expectedPreloadPath)) {
  fail(`Main bundle does not reference the expected preload path ${expectedPreloadPath}`)
}

console.log(`[verify-electron-bundle] OK: ${mainBundlePath} uses the CJS-safe updater import path and ${expectedPreloadPath}.`)
