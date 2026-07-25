# Product validation log

## Confirmed demand

- The original launch thread continued receiving positive replies into 2026, including users calling the tool a life saver. It also produced explicit Safari and PowerPoint requests: https://www.reddit.com/r/LaTeX/comments/1n0cstv/i_made_a_free_web_tool_to_get_latex_math_into_ms/
- An Obsidian workflow post independently recommended MD2MathML for editable Word export and continued receiving replies in 2026: https://www.reddit.com/r/ObsidianMD/comments/1n73z8o/a_tip_for_exporting_notes_with_latex_to_word/
- Students and researchers continue reporting broken LaTeX-to-Word workflows: https://www.reddit.com/r/PhysicsStudents/comments/1rjdhcl/how_to_make_writing_equations_in_word_less_hair/
- Research collaboration threads identify DOCX, multiline equations, citations, and collaborator compatibility as recurring constraints: https://www.reddit.com/r/PhD/comments/1tpi0jp/engineering_researchers_latex_or_docx/

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
