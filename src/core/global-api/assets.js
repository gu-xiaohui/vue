/* @flow */

import { ASSET_TYPES } from 'shared/constants'
import { isPlainObject, validateComponentName } from '../util/index'

export function initAssetRegisters (Vue: GlobalAPI) {
  /**
   * Create asset registration methods.
   * directive, filter, component
   */
  ASSET_TYPES.forEach(type => {
    Vue[type] = function (
      id: string,
      definition: Function | Object
    ): Function | Object | void {
      // 如果没有传入定义，返回之前存储的定义，反之则处理，然后返回
      if (!definition) {
        return this.options[type + 's'][id]
      } else {
        /* istanbul ignore if */
        if (process.env.NODE_ENV !== 'production' && type === 'component') {
          validateComponentName(id)
        }
        // 判断是不是组件，并且判断定义是不是对象
        if (type === 'component' && isPlainObject(definition)) {
          definition.name = definition.name || id
          // Vue.extend,返回Vue子类
          definition = this.options._base.extend(definition)
        }
        // 如果是指令，判断是不是函数，是函数的话，将传入的定义传给bind和update，所以指令
        // 传入函数的时候，在bind和update的时候都会调用这个函数
        if (type === 'directive' && typeof definition === 'function') {
          definition = { bind: definition, update: definition }
        }
        // 最后将definition保存到options[directives]中，如果是filter，直接存储，不做处理
        this.options[type + 's'][id] = definition
        return definition
      }
    }
  })
}
