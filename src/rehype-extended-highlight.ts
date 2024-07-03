import rehypeHighlight, { type Options } from 'rehype-highlight'
import type { Root, Element } from 'hast'
import type { VFile } from 'vfile'
import { visit } from 'unist-util-visit'
import parseAttrs from 'attributes-parser'

export const rehypeExtendedHighlight =
  (options: Options) => (tree: Root, file: VFile) => {
    // Copy Button & Label
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'pre') return
      visit(node, 'element', (code) => {
        if (code.tagName !== 'code') return
        visit(code, 'text', (child) => {
          node.properties['data-content'] = child.value
        })
      })
    })
    // Label
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'pre') return
      visit(node, 'element', (child) => {
        if (child.tagName !== 'code') return
        const attr = parseAttrs(Object.assign({ meta: '' }, child.data).meta)
        node.properties['data-label'] = attr['label']?.toString()
      })
    })
    // Tabs
    const group: Record<string, Element[]> = {}
    visit(tree, 'element', (node, index = 0, parent) => {
      if (parent?.type !== 'root' || node.tagName !== 'pre') return
      visit(node, 'element', (child) => {
        if (child.tagName !== 'code') return
        const attr = parseAttrs(Object.assign({ meta: '' }, child.data).meta)
        node.properties['data-group'] = attr['group']?.toString()
      })
      const name = node.properties['data-group']?.toString()
      if (!name) return
      if (!group[name]) group[name] = [] // Keep the first child as an anchor
      else parent.children.splice(index, 1) // Remove the subsequent nodes
      group[name].push(Object.assign({}, node))
    })
    visit(tree, 'element', (node, _, parent) => {
      const name = node.properties['data-group']?.toString()
      if (parent?.type !== 'root' || node.tagName !== 'pre' || !name) return
      const tabs: Element[] = group[name]
      Object.assign(node, {
        type: 'element',
        tagName: 'div',
        properties: {
          role: 'tablist',
          class: 'tabs tabs-bordered',
        },
        children: tabs.map((tab, i) => ({
          type: 'mdxJsxFlowElement',
          name: 'Tab',
          attributes: [
            {
              type: 'mdxJsxAttribute',
              name: 'name',
              value: tab.properties['data-group'],
            },
            {
              type: 'mdxJsxAttribute',
              name: 'label',
              value: tab.properties['data-label'],
            },
            {
              type: 'mdxJsxAttribute',
              name: 'checked',
              value: !i,
            },
          ],
          data: { _mdxExplicitJsx: true },
          children: [tab],
        })),
      })
    })
    rehypeHighlight(options)(tree, file)
  }
