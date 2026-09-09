import test from 'node:test'
import assert from 'node:assert/strict'

import { getDatabaseMode, isFirebaseConfigured } from '../db.js'

test('database mode defaults to JSON unless Firebase is configured', () => {
  const mode = getDatabaseMode()
  assert.ok(['json', 'firebase'].includes(mode))
  assert.equal(isFirebaseConfigured(), Boolean(process.env.FIREBASE_PROJECT_ID))
})
