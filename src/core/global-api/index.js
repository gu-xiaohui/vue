/* @flow */

import config from '../config'
import { initUse } from './use'
import { initMixin } from './mixin'
import { initExtend } from './extend'
import { initAssetRegisters } from './assets'
import { set, del } from '../observer/index'
import { ASSET_TYPES } from 'shared/constants'
import builtInComponents from '../components/index'
import { observe } from 'core/observer/index'

import {
  warn,
  extend,
  nextTick,
  mergeOptions,
  defineReactive
} from '../util/index'

export function initGlobalAPI (Vue: GlobalAPI) {
  // config
  const configDef = {}
  configDef.get = () => config
  if (process.env.NODE_ENV !== 'production') {
    configDef.set = () => {
      warn(
        'Do not replace the Vue.config object, set individual fields instead.'
      )
    }
  }
  // 初始化vue.config对象
  Object.defineProperty(Vue, 'config', configDef)

  // exposed util methods.
  // NOTE: these are not considered part of the public API - avoid relying on
  // them unless you are aware of the risk.
  // 这些工具方法不是做全局API的一部分，除非你已经意识到了某些风险，否则不要去依赖他们
  Vue.util = {
    warn,
    extend,
    mergeOptions,
    defineReactive
  }

  // 静态方法
  Vue.set = set
  Vue.delete = del
  Vue.nextTick = nextTick

  // 2.6 explicit observable API
  // 让一个对象可响应
  Vue.observable = <T>(obj: T): T => {
    observe(obj)
    return obj
  }

// {/* 初始化VueOptions对象，并对其进行扩展 */}
  Vue.options = Object.create(null)
  // 给vue.option添加components, directives, filters全局方法
  ASSET_TYPES.forEach(type => {
    Vue.options[type + 's'] = Object.create(null)
  })

  // this is used to identify the "base" constructor to extend all plain-object
  // components with in Weex's multi-instance scenarios.
  Vue.options._base = Vue

  // 注册全局组件
  extend(Vue.options.components, builtInComponents)
// 注册Vue.use，用来注册组件
  initUse(Vue)
  // 注册vue.mixin,用来实现混入
  initMixin(Vue)
  // 注册vue.extend，基于传入的options返回一个组件的构造函数
  initExtend(Vue)
  // 注册vue.directive,vue.component, vue.filter
  initAssetRegisters(Vue)
}
