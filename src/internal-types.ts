/**
 * Internal AST node types for the markdown parser
 */

export type BlockNode =
  | HeadingNode
  | ParagraphNode
  | CodeBlockNode
  | BlockquoteNode
  | ListNode
  | ListItemNode
  | ThematicBreakNode
  | HTMLBlockNode
  | TableNode

export type InlineNode =
  | TextNode
  | EmphasisNode
  | StrongNode
  | CodeNode
  | LinkNode
  | ImageNode
  | HardBreakNode
  | HTMLInlineNode

export interface HeadingNode {
  type: 'heading'
  level: 1 | 2 | 3 | 4 | 5 | 6
  children: InlineNode[]
}

export interface ParagraphNode {
  type: 'paragraph'
  children: InlineNode[]
}

export interface CodeBlockNode {
  type: 'code_block'
  language?: string
  content: string
}

export interface BlockquoteNode {
  type: 'blockquote'
  children: BlockNode[]
}

export interface ListNode {
  type: 'list'
  ordered: boolean
  start?: number
  tight: boolean
  children: ListItemNode[]
}

export interface ListItemNode {
  type: 'list_item'
  checked?: boolean // for task lists
  children: BlockNode[]
}

export interface ThematicBreakNode {
  type: 'thematic_break'
}

export interface HTMLBlockNode {
  type: 'html_block'
  content: string
}

export interface TableNode {
  type: 'table'
  alignments: ('left' | 'center' | 'right' | null)[]
  header: InlineNode[][]
  rows: InlineNode[][][]
}

export interface TextNode {
  type: 'text'
  value: string
}

export interface EmphasisNode {
  type: 'emphasis'
  children: InlineNode[]
}

export interface StrongNode {
  type: 'strong'
  children: InlineNode[]
}

export interface CodeNode {
  type: 'code'
  value: string
}

export interface LinkNode {
  type: 'link'
  href: string
  title?: string
  children: InlineNode[]
}

export interface ImageNode {
  type: 'image'
  src: string
  alt: string
  title?: string
}

export interface HardBreakNode {
  type: 'hard_break'
}

export interface HTMLInlineNode {
  type: 'html_inline'
  content: string
}

export interface LinkReference {
  href: string
  title?: string
}

export interface ParserContext {
  gfm: boolean
  breaks: boolean
  linkReferences: Map<string, LinkReference>
}
