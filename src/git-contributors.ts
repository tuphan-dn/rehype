import { visit } from 'unist-util-visit'
import type { Root } from 'hast'
import type { VFile } from 'vfile'
import { log } from 'isomorphic-git'
import fs from 'fs'
import { relative } from 'path'

export type RehypeGitContributorsOptions = {
  compName: string
}

export const rehypeGitContributors =
  ({ compName }: RehypeGitContributorsOptions) =>
  async (tree: Root, file: VFile) => {
    if (!compName) throw new Error('Cannot detect JSX component name')
    const {
      history: [filepath],
    } = file
    const commits = await log({
      fs,
      dir: './',
      filepath: relative('./', filepath),
      force: true,
      follow: true,
    })
    const authors: Record<
      string,
      { name: string; email: string; timestamp: number }
    > = {}
    commits.forEach(
      ({
        commit: {
          author: { name, email, timestamp },
        },
      }) => {
        if (!authors[name] || authors[name].timestamp < timestamp)
          authors[name] = { name, email, timestamp }
      },
    )
    visit(tree, 'root', (root) => {
      root.children.unshift({
        /** @ts-ignore */
        type: 'mdxJsxFlowElement',
        name: compName,
        attributes: [
          {
            type: 'mdxJsxAttribute',
            name: 'value',
            value: JSON.stringify(Object.entries(authors).map(([, e]) => e)),
          },
        ],
        data: { _mdxExplicitJsx: true },
      })
    })
  }
