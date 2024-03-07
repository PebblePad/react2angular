import { IAugmentedJQuery, IComponentOptions } from 'angular'
import fromPairs = require('lodash.frompairs')
import NgComponent from 'ngcomponent'
import * as React from 'react'
import { flushSync } from 'react-dom'
import { createRoot, Root } from 'react-dom/client'

/**
 * Wraps a React component in Angular. Returns a new Angular component.
 *
 * Usage:
 *
 *   ```ts
 *   type Props = { foo: number }
 *   class ReactComponent extends React.Component<Props, S> {}
 *   const AngularComponent = react2angular(ReactComponent, ['foo'])
 *   ```
 */
export function react2angular<Props>(
  Class: React.ComponentType<Props>,
  bindingNames: (keyof Props)[] | null = null,
  injectNames: string[] = []
): IComponentOptions {
  const names = bindingNames
    || (Class.propTypes && Object.keys(Class.propTypes) as (keyof Props)[])
    || []

  return {
    bindings: fromPairs(names.map(_ => [_, '<'])),
    controller: ['$element', ...injectNames, class extends NgComponent<Props> {
      static get $$ngIsClass() {
        return true
      }
      isDestroyed: boolean = false
      injectedProps: { [name: string]: any }
      private _root: Root | null = null
      private _renderToRoot: () => void = () => this._root!.render(<Class {...this.props} {...this.injectedProps as any} />)
      constructor(private $element: IAugmentedJQuery, ...injectedProps: any[]) {
        super()
        this.injectedProps = {}
        for (let i = 0; i < injectNames.length; i++) {
          const name = injectNames[i]
          this.injectedProps[name] = injectedProps[i]
        }
      }
      render() {
        if (this.isDestroyed) {
          return
        }
        if (this._root === null) {
          this._root = createRoot(this.$element[0])
        }
        flushSync(this._renderToRoot)
      }
      componentWillUnmount() {
        this.isDestroyed = true
        if (this._root !== null) {
          this._root.unmount()
          this._root = null
        }
      }
    }]
  }
}
