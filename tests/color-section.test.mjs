import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'

const bundle = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')

/** Minimal `<html>` stub: the palette store writes custom properties there. */
function fakeDocument() {
  const properties = new Map()
  const attributes = new Set()
  return {
    properties,
    attributes,
    documentElement: {
      style: {
        setProperty: (key, value) => properties.set(key, String(value)),
        removeProperty: (key) => properties.delete(key),
        getPropertyValue: (key) => properties.get(key) ?? '',
      },
      setAttribute: (name) => attributes.add(name),
      removeAttribute: (name) => attributes.delete(name),
    },
  }
}

/**
 * Load the built Client and mount it against a fixture context that serves one
 * settings namespace, then return the section it registered plus the writes the
 * fixture form received.
 */
async function mountSection(t, { value = { mode: 'auto', master: '#679EFE' } } = {}) {
  const document = fakeDocument()
  const writes = []
  /**
   * The real form is a snapshot store: every accepted write REPLACES the
   * snapshot object, and `useSyncExternalStore` compares by identity. Mutating
   * one object in place would leave React convinced nothing changed, so the
   * fixture publishes a fresh object per write exactly like the Host does.
   */
  let snapshot = { status: 'ready', value, revision: 1, writable: true, base: undefined, user: undefined }
  const listeners = new Set()
  const publish = (next) => {
    snapshot = next
    for (const listener of listeners) listener()
  }
  /**
   * Mirror the Host contract the section actually depends on: an accepted
   * write lands atomically, moves the namespace revision, and republishes the
   * snapshot. `failNext` makes the NEXT mutation refuse without touching
   * either, which is what a rejected Host write looks like; it is one-shot so
   * a retry can be observed succeeding.
   */
  const commit = (ops) => {
    if (failNext) {
      failNext = false
      return false
    }
    const next = { ...snapshot.value }
    for (const op of ops) {
      writes.push([op.path[0], op.value])
      next[op.path[0]] = op.value
    }
    publish({ ...snapshot, value: next, revision: snapshot.revision + 1 })
    return true
  }
  let failNext = false
  const form = {
    getSnapshot: () => snapshot,
    subscribe: (listener) => { listeners.add(listener); return () => listeners.delete(listener) },
    set: async (field, next) => commit([{ op: 'set', path: [field], value: next }]),
    unset: async () => true,
    mutate: async (ops) => commit(ops),
  }
  let registration
  const sub = {
    configForms: {
      whileServed: (_namespaces, register) => register(new Set(['ui-skin-switcher'])),
      get: () => form,
    },
    slots: {
      inject: (_name, callback) => callback(),
      register: (options, component) => { registration = { options, component }; return () => {} },
    },
    locale: { bind: () => (key) => key },
    effect: (callback) => { const disposer = callback(); return typeof disposer === 'function' ? disposer : () => {} },
  }
  let client
  const browser = new EventTarget()
  browser.devicePixelRatio = 1
  browser.__ModuleLoader__ = {
    load({ factory }) { client = factory(() => React) },
  }
  vm.runInNewContext(bundle, {
    window: browser, document, setTimeout, clearTimeout, console,
  }, { filename: 'lib/client.js' })
  client.apply({
    modelDirectories: {},
    sessions: {},
    effect: () => () => {},
    slots: { inject: () => () => {} },
    inject: (_deps, callback) => { callback(sub) },
  })
  assert.ok(registration, 'a configForms namespace must contribute the bundle section')
  assert.equal(registration.options.name, 'plugins.bundle.config')
  assert.equal(registration.options.key, '@domitor-syh/dsh-ui-skin-switcher')
  let tree
  await act(async () => {
    tree = TestRenderer.create(React.createElement(registration.component, { view: 'page' }))
  })
  t.after(() => act(() => tree.unmount()))
  return {
    tree, document, writes, form, listeners,
    failNextWrite: () => { failNext = true },
    /**
     * Simulate an edit made outside this section (another tab, the Host). A
     * real outside edit changes the stored colours, so the fixture does too —
     * a bare revision bump with identical colours is the seat-follow switch's
     * own signature and must NOT be treated as an outside edit.
     */
    externalEdit: (next = { master: '#FF5B4A' }) => publish({
      ...snapshot,
      value: { ...snapshot.value, ...next },
      revision: snapshot.revision + 1,
    }),
  }
}

function text(node) {
  if (node === null || node === undefined) return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(text).join('')
  return text(node.children)
}

function byClass(tree, name) {
  return tree.root.findAll((node) => typeof node.props?.className === 'string' && node.props.className.split(' ').includes(name))
}

function rows(tree) {
  return tree.root.findAll((node) => typeof node.props?.className === 'string' && node.props.className.includes('sk5c-row') && node.type === 'button')
}

test('auto mode previews the derivation and locks the per-slot rows', async t => {
  const ui = await mountSection(t)
  const list = rows(ui.tree)
  assert.equal(list.length, 6)
  assert.ok(list.every((row) => row.props.disabled === true), 'auto rows are not editable')
  const labels = text(ui.tree.toJSON())
  assert.match(labels, /#679EFE/)
  assert.match(labels, /#4176E6/)
  assert.equal(byClass(ui.tree, 'sk5c-master').length, 1, 'auto mode shows the main-colour row')
  assert.equal(byClass(ui.tree, 'sk5c-target').length, 0)
  // The preview reached the real stylesheet variables.
  assert.equal(ui.document.properties.get('--sk5-c-grid'), '#4176E6')
})

test('custom mode unlocks the rows and edits the selected slot', async t => {
  const ui = await mountSection(t)
  const [, custom] = ui.tree.root.findAll((node) => node.type === 'input' && node.props.type === 'radio')
  await act(async () => custom.props.onChange())
  const list = rows(ui.tree)
  assert.ok(list.every((row) => row.props.disabled === false))
  assert.equal(byClass(ui.tree, 'sk5c-target').length, 1)
  await act(async () => list[2].props.onClick()) // slider handle
  const input = ui.tree.root.findByProps({ id: 'sk5c-code-input' })
  await act(async () => input.props.onChange({ target: { value: '#FF5B4A' } }))
  assert.equal(ui.document.properties.get('--sk5-c-slider'), '#FF5B4A', 'typing previews immediately')
  assert.match(text(ui.tree.toJSON()), /#FF5B4A/)
})

test('applying writes the mode and all six slots to the settings form', async t => {
  const ui = await mountSection(t)
  const [, custom] = ui.tree.root.findAll((node) => node.type === 'input' && node.props.type === 'radio')
  await act(async () => custom.props.onChange())
  await act(async () => rows(ui.tree)[0].props.onClick())
  const input = ui.tree.root.findByProps({ id: 'sk5c-code-input' })
  await act(async () => input.props.onChange({ target: { value: '#F5D061' } }))
  const apply = ui.tree.root.findByProps({ className: 'sk5c-apply' })
  await act(async () => { await apply.props.onClick() })
  const written = Object.fromEntries(ui.writes)
  assert.equal(written.mode, 'custom')
  assert.equal(written.master, '#679EFE')
  assert.equal(written.dialogFont, '#F5D061')
  assert.equal(written.maxDot, '', 'unset slots clear so they keep following the master')
  assert.equal(ui.writes.length, 8)
})

test('an apply is one atomic mutation, so the revision moves exactly once', async t => {
  const ui = await mountSection(t)
  const [, custom] = ui.tree.root.findAll((node) => node.type === 'input' && node.props.type === 'radio')
  await act(async () => custom.props.onChange())
  const before = ui.form.getSnapshot().revision
  const apply = ui.tree.root.findByProps({ className: 'sk5c-apply' })
  await act(async () => { await apply.props.onClick() })
  assert.equal(ui.writes.length, 8, 'all eight fields still land')
  assert.equal(ui.form.getSnapshot().revision, before + 1, 'one write, one revision')
})

test('the saved note survives the revision bump its own save causes', async t => {
  const ui = await mountSection(t)
  const apply = ui.tree.root.findByProps({ className: 'sk5c-apply' })
  await act(async () => { await apply.props.onClick() })
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 20)) })
  const note = ui.tree.root.findAll(
    (node) => typeof node.props?.className === 'string' && node.props.className.includes('sk5c-note'),
  )
  assert.equal(note.length, 1)
  assert.match(text(note[0].children), /color\.saved/, 'the confirmation must not be cleared by its own write')
})

test('an outside revision change still clears the saved note', async t => {
  const ui = await mountSection(t)
  const apply = ui.tree.root.findByProps({ className: 'sk5c-apply' })
  await act(async () => { await apply.props.onClick() })
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 20)) })
  // Someone else edits the namespace: the note is stale and must go.
  await act(async () => { ui.externalEdit() })
  const note = ui.tree.root.findAll(
    (node) => typeof node.props?.className === 'string' && node.props.className.includes('sk5c-note'),
  )
  assert.match(text(note[0].children), /color\.previewHint/)
})

test('an invalid code blocks the save instead of writing a broken colour', async t => {
  const ui = await mountSection(t)
  const input = ui.tree.root.findByProps({ id: 'sk5c-code-input' })
  await act(async () => input.props.onChange({ target: { value: '#12' } }))
  const apply = ui.tree.root.findByProps({ className: 'sk5c-apply' })
  assert.equal(apply.props.disabled, true)
  assert.match(text(ui.tree.toJSON()), /color\.invalid/)
  assert.equal(ui.writes.length, 0)
})

test('a refused save stays retryable instead of disabling Apply', async t => {
  const ui = await mountSection(t)
  ui.failNextWrite()
  const apply = () => ui.tree.root.findByProps({ className: 'sk5c-apply' })
  await act(async () => { await apply().props.onClick() })
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 20)) })
  assert.match(text(ui.tree.toJSON()), /color\.saveFailed/, 'the failure is reported')
  assert.equal(apply().props.disabled, false, 'a Host refusal must not lock the button')
  const input = ui.tree.root.findByProps({ id: 'sk5c-code-input' })
  assert.equal(input.props.className.includes('is-error'), false, 'the code field is not at fault')
  assert.equal(input.props['aria-invalid'], false)
  // Retrying the very same value now succeeds.
  await act(async () => { await apply().props.onClick() })
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 20)) })
  assert.match(text(ui.tree.toJSON()), /color\.saved/)
})

test('a format error and a save failure are reported as different problems', async t => {
  const ui = await mountSection(t)
  const input = () => ui.tree.root.findByProps({ id: 'sk5c-code-input' })
  await act(async () => input().props.onChange({ target: { value: '#12' } }))
  assert.equal(input().props['aria-invalid'], true, 'a bad code marks the field')
  assert.match(text(ui.tree.toJSON()), /color\.invalid/)
  // Typing a valid colour clears the format complaint but not a save failure.
  await act(async () => input().props.onChange({ target: { value: '#F5D061' } }))
  assert.equal(input().props['aria-invalid'], false)
  assert.doesNotMatch(text(ui.tree.toJSON()), /color\.invalid/)
})

test('stepping the hue to the far right keeps the thumb there instead of wrapping', async t => {
  const ui = await mountSection(t)
  const hueNode = () => ui.tree.root.findAll(
    (node) => node.props?.role === 'slider' && String(node.props.className).includes('sk5c-hue'),
  )[0]
  // 5° per press, from the shipped master's hue back to the top of the range.
  for (let i = 0; i < 40; i += 1) {
    await act(async () => hueNode().props.onKeyDown({ key: 'ArrowRight', preventDefault() {} }))
  }
  const thumb = ui.tree.root.findAll((node) => node.props?.className === 'sk5c-hue-thumb')[0]
  const left = Number.parseFloat(thumb.props.style.left)
  assert.ok(left > 99.5, `thumb should stay at the right edge, got ${left}%`)
  // The quantised colour is red-dominant; reading the hue back from it would
  // report 0 and pull the thumb to the far left.
  const preview = ui.document.properties.get('--sk5-c-dialog')
  assert.ok(Number.parseInt(preview.slice(1, 3), 16) > 250, `expected a red-dominant preview, got ${preview}`)
  assert.ok(Number(hueNode().props['aria-valuenow']) > 355, 'the slider still reports the picked hue')
})
test('the follow switch persists and drives the seat attribute', async t => {
  const ui = await mountSection(t)
  const sw = ui.tree.root.findByProps({ role: 'switch' })
  assert.equal(sw.props['aria-checked'], true)
  assert.ok(ui.document.attributes.has('data-sk5-follow-seat'))
  await act(async () => {
    sw.props.onClick()
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
  assert.deepEqual(ui.writes[0], ['followSeat', false])
  assert.equal(ui.document.attributes.has('data-sk5-follow-seat'), false)
})

test('toggling the follow switch keeps unsaved colour edits', async t => {
  const ui = await mountSection(t)
  const [, custom] = ui.tree.root.findAll((node) => node.type === 'input' && node.props.type === 'radio')
  await act(async () => custom.props.onChange())
  await act(async () => rows(ui.tree)[0].props.onClick())
  const input = () => ui.tree.root.findByProps({ id: 'sk5c-code-input' })
  await act(async () => input().props.onChange({ target: { value: '#F5D061' } }))
  assert.equal(ui.document.properties.get('--sk5-c-dialog'), '#F5D061')
  // The switch writes its own field, which moves the revision. That must not
  // be mistaken for the Host replacing the palette.
  const sw = ui.tree.root.findByProps({ role: 'switch' })
  await act(async () => {
    sw.props.onClick()
    await new Promise((resolve) => setTimeout(resolve, 20))
  })
  assert.equal(ui.document.properties.get('--sk5-c-dialog'), '#F5D061', 'the draft survives')
  assert.equal(input().props.value, '#F5D061', 'the field still shows the edit')
  assert.equal(ui.tree.root.findByProps({ role: 'switch' }).props['aria-checked'], false)
})

test('reset restores the shipped blue and clears every custom slot', async t => {
  const ui = await mountSection(t, { value: { mode: 'custom', master: '#FF5B4A', dialogFont: '#F5D061' } })
  const reset = ui.tree.root.findByProps({ className: 'sk5c-reset' })
  await act(async () => {
    reset.props.onClick()
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
  const written = Object.fromEntries(ui.writes)
  assert.equal(written.mode, 'auto')
  assert.equal(written.master, '#679EFE')
  assert.equal(written.dialogFont, '')
  assert.equal(written.gridBlink, '')
  assert.equal(ui.document.properties.get('--sk5-c-dialog'), '#679EFE')
})
