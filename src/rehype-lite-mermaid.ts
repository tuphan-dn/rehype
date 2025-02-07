import type { Element, Root } from 'hast'
import { visit } from 'unist-util-visit'
import { toString } from 'mdast-util-to-string'

export type CodeInstance = {
  diagram: string
  ancestors: Element[]
}

export type RehypeLiteMermaidOptions = {
  className?: string
}

const mermaidable = (code: Element) => {
  const signal = 'language-mermaid'
  if (code.properties.className === signal) return true
  if (
    Array.isArray(code.properties.className) &&
    code.properties.className.includes(signal)
  )
    return true
  return false
}

export const rehypeLiteMermaid = ({
  className = 'mermaid',
}: RehypeLiteMermaidOptions = {}) => {
  return (tree: Root) => {
    visit(tree, 'element', (node, index = 0, parent) => {
      if (
        parent?.type !== 'element' ||
        parent?.tagName !== 'pre' ||
        node.tagName !== 'code' ||
        !mermaidable(node)
      )
        return
      parent.children[index] = {
        type: 'element',
        tagName: 'span',
        properties: {
          className: [className],
        },
        children: [{ type: 'text', value: toString(node) }],
      }
    })
  }
}
