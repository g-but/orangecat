/**
 * lucide-react under Jest.
 *
 * The library ships ESM that Jest resolves to a CJS build where a subset of the
 * icon names come back `undefined` — rendering one then fails with "Element type
 * is invalid", which reads like a broken component but is purely a module-interop
 * artefact. It cost a real assertion once (deleted as if it were a bad test) and
 * broke a second suite later, so it is fixed here rather than worked around
 * again in each test file.
 *
 * Every icon renders as a real `<svg>` carrying its own name, so tests can still
 * assert that the right icon appeared — a blanket `() => null` would quietly
 * make icon-presence assertions pass on nothing.
 */

const React = require('react');

const iconComponent = name => {
  const Icon = React.forwardRef((props, ref) =>
    React.createElement('svg', {
      ref,
      'data-testid': props['data-testid'] ?? `icon-${name}`,
      'data-icon': name,
      'aria-hidden': props['aria-hidden'],
      className: props.className,
    })
  );
  Icon.displayName = name;
  return Icon;
};

const cache = new Map();

module.exports = new Proxy(
  {},
  {
    get(_target, prop) {
      if (prop === '__esModule') {
        return true;
      }
      if (typeof prop !== 'string') {
        return undefined;
      }
      // `createLucideIcon` and friends are factories, not icons; anything else
      // accessed off this module in a component is an icon.
      if (!cache.has(prop)) {
        cache.set(prop, iconComponent(prop));
      }
      return cache.get(prop);
    },
  }
);
