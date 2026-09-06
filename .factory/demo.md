# Demo sandbox

Open `https://rubric-feedback-bundles.sociobot.in/demo` or add `?demo=1` to
the home URL. The first view is a filled Grade 9 flash-fiction feedback bundle
with three students, selected rubric fragments, tailored feedback, personal
notes, and a class pattern summary.

The persistent **Demo — sample data, nothing is saved** banner marks this
mode. **Reset demo** discards any demo edits and loads the shipped sample
again. **Start for real** discards demo edits and opens the empty real-data
workspace.

Demo data uses only the IndexedDB database named
`demo:rubric-feedback-bundles`. Real classroom work uses
`rubric-feedback-bundles`; demo mode does not open, read, or write that
database. A returned or pasted license in demo mode is kept only in the demo
tab's `sessionStorage`, never the real app's `localStorage`.

All browser claim tests begin from `/demo` in a fresh context. The offline
claim creates its own context, activates the service worker, then sets that
context offline before reloading.
