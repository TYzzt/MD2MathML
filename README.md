
需求文档：Markdown → Web预览 & 公式复制 (MathML)

1. 项目目标

本项目旨在提供一个在线工具，用户可以输入或导入 Markdown 文档，在 Web 界面中进行预览。预览过程中，支持 数学公式渲染，并允许用户 复制公式为 MathML 格式，以便粘贴到 Word 等支持 MathML 的软件中。

2. 功能需求

2.1 Markdown 输入与导入

输入方式

支持用户在页面内输入 Markdown 文本（编辑器区域）。

支持上传 .md 文件（文件导入）。

基本要求

解析 Markdown 标准语法（标题、列表、表格、代码块、引用等）。

保持原始文档结构与排版。

2.2 Web 端预览

实时渲染 Markdown 为 HTML。

同步预览（编辑时实时更新）。

支持渲染公式（行内公式、块级公式）。

2.3 数学公式支持

支持公式书写格式：

行内公式：$...$

块级公式：$$...$$

使用 Temml 进行公式渲染。

在预览中，公式显示为正常渲染效果，同时保留 MathML 数据。

2.4 公式复制功能

用户右键或点击公式时，可以选择 复制为 MathML。

MathML 内容复制到剪贴板。

复制的内容可直接粘贴到 Microsoft Word（或其他支持 MathML 的编辑器）。

3. 非功能需求

兼容性：支持 Chrome、Edge、Firefox、Safari 最新版本。

易用性：UI 简洁，预览效果清晰，复制操作直观。

性能：Markdown + 公式解析应在 500ms 内完成（单篇文档 < 1MB）。

4. 技术方案

4.1 前端

框架：React 或纯前端（Vanilla JS）。

Markdown 渲染：markdown-it 或 marked.js。

公式渲染：Temml（可输出 MathML）。

剪贴板支持：使用 navigator.clipboard.writeText() API。

4.2 后端

可选：无后端方案（纯前端渲染，适合部署在静态网站，如 Vercel、GitHub Pages）。

如需支持大文件或格式转换（如导出 Word/PDF），可提供 Node.js + Express 后端。

4.3 部署

可部署在：

GitHub Pages（静态站点，0 成本）

Vercel / Netlify

Fly.io / Render（如需后端）

5. 界面原型（初步设想）

+--------------------------------------------------------+

| 导航栏: [上传Markdown] [粘贴文本] [导出Word]           |

+--------------------------------------------------------+

| 左侧: Markdown编辑区    | 右侧: 预览区 (渲染后的HTML) |

|                         |                             |

|                         |   数学公式 √ 复制MathML     |

|                         |   表格、列表、代码          |

+--------------------------------------------------------+

6. 未来扩展

支持 Markdown → Word/PDF 一键导出（调用 Pandoc API）。

支持 Markdown 中的 Mermaid 流程图渲染。

提供浏览器插件版（Edge/Chrome 插件），直接在网页中复制公式为 MathML。

