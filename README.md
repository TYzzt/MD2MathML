# MD2MathML

### Overview

An online Markdown previewer with LaTeX support, designed to solve the problem of easily migrating math formulas from Markdown to Microsoft Word.

This tool allows you to get a live preview of your Markdown text and, with a simple right-click, copy rendered math formulas as MathML. You can then paste them directly into rich-text editors like Word as **editable equations**.

### Key Features

  * **Live Preview**: Instantly renders Markdown as you type in the editor.
  * **Math Formula Support**: Powered by `@traeblain/markdown-it-temml`, it supports both inline (`$...$`) and block (`$$...$$`) math formulas.
  * **Copy to Word**: Simply **right-click** any formula in the preview pane to copy its MathML code to the clipboard. Paste it directly into Microsoft Word.
  * **File Upload**: Supports uploading local `.md` files for quick previewing.
  * **Syntax Highlighting**: Provides syntax highlighting for various programming languages in code blocks.

### How to Use

1.  Enter your Markdown text in the left-hand editor pane.
2.  Alternatively, click the "Upload .md File" button to select a local file.
3.  The right-hand pane will display the live rendered preview.
4.  To copy a math formula, hover over it in the preview pane and **right-click**. The MathML code will be copied to your clipboard.
5.  Open Microsoft Word and paste.

### Tech Stack

  * **Framework**: [React](https://reactjs.org/)
  * **Build Tool**: [Vite](https://vitejs.dev/)
  * **Markdown Parsing**: [markdown-it](https://github.com/markdown-it/markdown-it)
  * **Math Rendering**: [@traeblain/markdown-it-temml](https://github.com/traeblain/markdown-it-temml)
  * **Syntax Highlighting**: [highlight.js](https://highlightjs.org/)

### Running Locally

```bash
# Clone the repository
git clone <repository-url>

# Navigate to the project directory
cd MD2MathML

# Install dependencies
npm install

# Start the development server
npm run dev
```
