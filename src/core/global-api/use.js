/* @flow */

import { toArray } from '../util/index'

export function initUse (Vue: GlobalAPI) {
  Vue.use = function (plugin: Function | Object) {
    // 判断是否安装过了，没安装的话，获取插件数组，或者初始化一个空数组
    const installedPlugins = (this._installedPlugins || (this._installedPlugins = []))
    // 卧槽，原来indexOf还可以查找对象函数类型。。。
    if (installedPlugins.indexOf(plugin) > -1) {
      return this
    }

    // additional parameters
    // 把参数转成数组，也就是调用use传入的第二个参数
    const args = toArray(arguments, 1)
    // 将this(Vue)插入到install第一个入参位置
    args.unshift(this)
    // 如果plugin带有install方法，调用install方法
    if (typeof plugin.install === 'function') {
      plugin.install.apply(plugin, args)
      // 如果插件本身是一个函数，调用本身
    } else if (typeof plugin === 'function') {
      plugin.apply(null, args)
    }
    // 调用的时候将argumens传入，vue, options
    // 然后将插件保存到插件数组中
    installedPlugins.push(plugin)
    // 返回Vue，实现链式调用
    return this
  }
}
