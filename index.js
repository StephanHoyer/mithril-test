const puppeteer = require('puppeteer')
const fs = require('fs')
const browserifyFn = require('browserify-string')

function pause(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function isString(x) {
  return typeof x === 'string'
}

function bundle(fn) {
  return new Promise((resolve, reject) => {
    browserifyFn(fn).bundle(function(err, src) {
      if (err) reject(err)
      else resolve('' + src)
    })
  })
}

function load(componentPath) {
  let page, browser
  let p = Promise.resolve().then(async () => {
    browser = await puppeteer.launch()
    page = await browser.newPage()
    const code = await bundle(`
      const m = require('mithril')
      const component = require('${componentPath}')
      m.mount(document.body, component)
    `)
    await page.evaluate(code)
  })

  async function getCountMatchingElements(selector) {
    return (await page.$$(selector)).length
  }

  async function shouldHave(expectedCount, selector) {
    ;[expectedCount, selector] = isString(expectedCount)
      ? [null, expectedCount]
      : [expectedCount, selector]
    const matchingCount = await getCountMatchingElements(selector)
    if (expectedCount && expectedCount !== matchingCount) {
      throw new Error(
        `Expected ${expectedCount} element(s) matching selector "${selector}", got ${matchingCount}.`
      )
    }
    if (matchingCount === 0) {
      throw new Error(`Unable to find elements matching selector "${selector}"`)
    }
  }

  async function shouldNotHave(unexpectedCount, selector) {
    ;[unexpectedCount, selector] = isString(unexpectedCount)
      ? [null, unexpectedCount]
      : [unexpectedCount, selector]
    const matchingCount = await getCountMatchingElements(selector)
    if (!unexpectedCount && matchingCount > 0) {
      throw new Error(
        `Expected not to have any elements matching selector "${selector}", got ${matchingCount}.`
      )
    }
    if (unexpectedCount === matchingCount) {
      throw new Error(
        `Expected not to have ${unexpectedCount} element(s) matching selector, but got ${matchingCount}.`
      )
    }
  }

  async function shouldContain(string) {
    const content = await page.content()
    if (content.indexOf(string) < 0) {
      throw new Error(`Can't find "${string}".`)
    }
  }

  async function shouldNotContain(string) {
    const content = await page.content()
    if (content.indexOf(string) >= 0) {
      throw new Error(`Expected to not find "${string}".`)
    }
  }

  async function setValue(selector, value) {
    await page.type(selector, value)
    await pause(20)
  }

  async function waitFor(selector) {
    if (isString(selector)) {
      await page.waitFor(selector)
    } else {
      await pause(selector)
    }
  }

  const api = {
    async run() {
      await p
      await browser.close()
    },
  }

  function chain(fn) {
    return (...args) => {
      p = p.then(() => fn(...args))
      return api
    }
  }

  api.shouldHave = chain(shouldHave)
  api.shouldNotHave = chain(shouldNotHave)
  api.waitFor = chain(waitFor)
  api.click = chain(selector => page.click(selector))
  api.shouldContain = chain(shouldContain)
  api.shouldNotContain = chain(shouldNotContain)
  api.setValue = chain(setValue)
  return api
}

module.exports = load
