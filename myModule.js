const m = require('mithril')

module.exports = {
  showParagraph: true,
  inputValue: '',
  view: ({ state }) => [
    m('button', {
      onclick: () => {
        state.showParagraph = false
        setTimeout(() => {
          state.showParagraph = true
          m.redraw()
        }, 10)
      },
    }),
    m('input', { oninput: e => (state.inputValue = e.target.value) }),
    m('div', state.inputValue),
    state.showParagraph && m('p', 'my paragraph'),
  ],
}
