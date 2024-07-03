import rehypeHighlight, {
  type Options as RehypeHighlightOptions,
} from 'rehype-highlight'
import type { Root, Element } from 'hast'
import type { VFile } from 'vfile'
import { visit } from 'unist-util-visit'
import parseAttrs from 'attributes-parser'

export type Options = RehypeHighlightOptions & {
  tabs: string
  tab: string
}

export const rehypeExtendedHighlight =
  ({ tabs, tab, ...options }: Options) =>
  (tree: Root, file: VFile) => {
    if (!tabs || !tab)
      throw new Error('Cannot detect tabs & tab JSX component name')
    // Metadata for Copy Button & Label
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'pre') return
      visit(node, 'element', (code) => {
        if (code.tagName !== 'code') return
        visit(code, 'text', (child) => {
          const { meta } = Object.assign({ meta: '' }, child.data)
          const attr = parseAttrs(meta)
          node.properties['data-content'] = child.value
          node.properties['data-label'] = attr['label']?.toString()
        })
      })
    })
    // Metadata for Tabs
    const group: Record<string, Element[]> = {}
    visit(tree, 'element', (node, index = 0, parent) => {
      if (parent?.type !== 'root' || node.tagName !== 'pre') return
      visit(node, 'element', (child) => {
        if (child.tagName !== 'code') return
        const { meta } = Object.assign({ meta: '' }, child.data)
        const attr = parseAttrs(meta)
        node.properties['data-group'] = attr['group']?.toString()
      })
      const name = node.properties['data-group']?.toString()
      if (!name) return
      if (!group[name]) group[name] = [] // Keep the first child as an anchor
      else parent.children.splice(index, 1) // Remove the subsequent nodes
      group[name].push(Object.assign({}, node))
    })
    // Group the tabs
    visit(tree, 'element', (node) => {
      const name = node.properties['data-group']?.toString()
      if (node.tagName !== 'pre' || !name) return
      const tabs: Element[] = group[name]
      Object.assign(node, {
        type: 'mdxJsxFlowElement',
        name: tabs,
        attributes: [],
        data: { _mdxExplicitJsx: true },
        children: tabs.map((tab, i) => ({
          type: 'mdxJsxFlowElement',
          name: tab,
          attributes: [
            {
              type: 'mdxJsxAttribute',
              name: 'group',
              value: tab.properties['data-group'],
            },
            {
              type: 'mdxJsxAttribute',
              name: 'label',
              value: tab.properties['data-label'],
            },
            {
              type: 'mdxJsxAttribute',
              name: 'defaultChecked',
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
