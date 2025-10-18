/**
 * Mock for Framer Motion in tests
 */

module.exports = {
  motion: {
    div: 'div',
    span: 'span',
    p: 'p',
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    button: 'button',
    form: 'form',
    input: 'input',
    label: 'label',
    img: 'img',
    a: 'a',
    ul: 'ul',
    li: 'li',
    nav: 'nav',
    main: 'main',
    aside: 'aside',
    section: 'section',
    article: 'article',
    header: 'header',
    footer: 'footer'
  },
  AnimatePresence: ({ children }) => children,
  useInView: () => [null, true],
  useMotionValue: () => ({ get: () => 0, set: () => {} }),
  useTransform: () => () => 0,
  useAnimation: () => ({ start: () => Promise.resolve() }),
  useScroll: () => ({ scrollY: { get: () => 0 } }),
  useSpring: () => ({ get: () => 0, set: () => {} })
}

