# mithril-test
test your mithril modules in a real browser

## Example usage

Let's say you have the following component:
```js
// myModule.js
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
```

... you can test its functionality like this:

```js
// myModule.test.js
const load = require('mithril-test')

describe('myModule', () => {
  it('should work', () => {
    return load('./myModule')
      .shouldHave('p')
      .shouldHave(1, 'p')
      .shouldNotHave(2, 'p')
      .shouldNotHave('h3')
      .shouldNotContain('fancy stuff')
      .setValue('input', 'fancy stuff')
      .shouldContain('fancy stuff')
      .waitFor(100)
      .click('button')
      .shouldNotHave('p')
      .waitFor('p')
      .shouldHave('p')
      .run()
  })
})
```

Whole test takes about 600ms.
