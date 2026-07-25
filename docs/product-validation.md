# Product validation log

## Confirmed demand

- The original launch thread continued receiving positive replies into 2026, including users calling the tool a life saver. It also produced explicit Safari and PowerPoint requests: https://www.reddit.com/r/LaTeX/comments/1n0cstv/i_made_a_free_web_tool_to_get_latex_math_into_ms/
- An Obsidian workflow post independently recommended MD2MathML for editable Word export and continued receiving replies in 2026: https://www.reddit.com/r/ObsidianMD/comments/1n73z8o/a_tip_for_exporting_notes_with_latex_to_word/
- Students and researchers continue reporting broken LaTeX-to-Word workflows: https://www.reddit.com/r/PhysicsStudents/comments/1rjdhcl/how_to_make_writing_equations_in_word_less_hair/
- Research collaboration threads identify DOCX, multiline equations, citations, and collaborator compatibility as recurring constraints: https://www.reddit.com/r/PhD/comments/1tpi0jp/engineering_researchers_latex_or_docx/

## July 2026 Reddit discovery

Recent discussions show that single-equation copy is no longer the whole problem:

- A physics student forced to submit a final-year paper in Word reported that pasted LaTeX rendered accents incorrectly and that manually rebuilding accented symbols was too slow. The thread still received a new commercial-tool reply in July 2026, so this remains an active need: https://www.reddit.com/r/PhysicsStudents/comments/1rjdhcl/how_to_make_writing_equations_in_word_less_hair/
- Engineering researchers described Word-only advisors and interdisciplinary collaborators as the reason DOCX remains unavoidable. Their difficult transitions are multiline `align` equations, citations, and preserving a document that collaborators can comment on: https://www.reddit.com/r/PhD/comments/1tpi0jp/engineering_researchers_latex_or_docx/
- New tools and extensions now advertise editable ChatGPT-to-Word equations. A generic "AI to Word" claim is therefore not a useful differentiator. MD2MathML should prove fidelity on complete research notes and make privacy, no-sign-in access, and sanitized failure-sample feedback explicit: https://www.reddit.com/r/OpenAI/comments/1rtm7ru/how_to_copy_chatgpt_math_formulas_to_word_docx/
- The existing Obsidian workflow continues to receive thanks. Paste/upload remains the lowest-risk path until users show that a direct plugin handoff is worth the privacy and store-update cost: https://www.reddit.com/r/ObsidianMD/comments/1n73z8o/a_tip_for_exporting_notes_with_latex_to_word/

Evidence-based next priorities:

1. Validate accented symbols and multiline `align` output with real failing samples.
2. Determine whether citation keys plus a bibliography file are the next complete-document requirement; do not claim citation support from plain citation-like text alone.
3. Validate Safari clipboard behavior on a physical Safari device.
4. Keep PowerPoint export deferred until native editable output can be delivered without a misleading Word round trip.

## Product decision

Position MD2MathML as an immediate, no-sign-in AI/Markdown-to-Word workflow rather than a general Markdown editor. Preserve two outcomes:

- Copy one equation as MathML.
- Export a complete DOCX with editable Office Math.

The `select2obsidian` browser extension already extracts clean Markdown and formulas, but a direct integration is deferred. Opening notes through a URL could leak document content, and changing the published extension would add store-review work before conversion reliability is validated. The current low-risk Obsidian workflow remains paste or upload.

## Release validation

- Frontend unit tests: 16 passing.
- Converter unit tests: 5 passing.
- Production DOCX regression: equations, table, footnote, and image verified.
- Chromium desktop: MathML clipboard and Word export verified.
- Mobile 390 x 844: editor/preview switching and no horizontal overflow verified.
- Safari: synchronous clipboard fallback is covered by unit tests; physical Safari verification remains required before claiming complete compatibility.

## Reddit follow-up checklist

- Reply to the original Safari report with the compatibility fix and ask the reporter to retest.
- Reply to the PowerPoint request honestly: Word is supported; native editable PowerPoint remains research work.
- Post the complete DOCX export update in the original thread.
- Ask thesis and Obsidian users for one failing Markdown sample with private content removed.
- Record resulting requests here before choosing the next feature.

## Prepared Reddit replies

Status: prepared, not posted. Publish from the authenticated project account, then replace each pending marker with the permalink and date.

### Safari report

> Thanks again for reporting this. I have now added a Safari-specific clipboard fallback while keeping the normal Clipboard API path for Chrome. I do not have a physical Safari device available for a definitive check, so I do not want to overclaim the fix. Could you please retry it at https://md2mathml.uuuu.site/ and tell me your macOS/iOS and Safari versions if it still fails? A small non-private formula that reproduces the problem would also be very useful.

Permalink: pending.

### PowerPoint request

> A belated honest update: native editable PowerPoint export is still not supported. The current product reliably exports Word DOCX with editable Office equations, but PowerPoint needs a different Office clipboard/object path, and I do not want to call the Word-to-PowerPoint round trip proper support. If direct PPTX becomes the main request, I will test it as a separate export format rather than promise it prematurely.

Permalink: pending.

### Original thread release update

> Update from the maintainer: MD2MathML can now export the whole Markdown document as a Word file, with native editable equations plus tables, footnotes, and embedded images. It is still free, requires no login, and the browser sends the document only when you explicitly request DOCX conversion. I also added a Safari-specific copy fallback, although that still needs a real Safari retest. If you use this for a thesis, lab report, or Obsidian note, I would especially value a sanitized Markdown sample that fails on accents, multiline equations, citations, or layout. Please remove any private research content first: https://md2mathml.uuuu.site/

Permalink: pending.

### Obsidian workflow follow-up

> I maintain MD2MathML and have just hardened the DOCX export path. Equations are native/editable in Word, and the regression document now also covers tables, footnotes, and embedded images. Before building an Obsidian plugin or URL handoff, I would rather understand the real gaps in the safer paste/upload workflow. If anyone has a note that exports badly, could you share the smallest sanitized Markdown sample, especially one with `align`, accents, citations, or images? Please strip private note content first.

Permalink: pending.
