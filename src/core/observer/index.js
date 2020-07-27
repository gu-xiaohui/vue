/* @flow */

import Dep from './dep'
import VNode from '../vdom/vnode'
import { arrayMethods } from './array'
import {
  def,
  warn,
  hasOwn,
  hasProto,
  isObject,
  isPlainObject,
  isPrimitive,
  isUndef,
  isValidArrayIndex,
  isServerRendering
} from '../util/index'

const arrayKeys = Object.getOwnPropertyNames(arrayMethods)

/**
 * In some cases we may want to disable observation inside a component's
 * update computation.
 */
export let shouldObserve: boolean = true

export function toggleObserving (value: boolean) {
  shouldObserve = value
}

/**
 * Observer class that is attached to each observed
 * object. Once attached, the observer converts the target
 * object's property keys into getter/setters that
 * collect dependencies and dispatch updates.
 */
export class Observer {
  value: any;
  dep: Dep;
  vmCount: number; // number of vms that have this object as root $data

  constructor (value: any) {
    this.value = value
    this.dep = new Dep()
    // 初始化实例，vmCount=0
    this.vmCount = 0
    // 给传入的value定义一个__ob__属性，value指向Observer
    def(value, '__ob__', this)
    // 数组的响应式处理
    if (Array.isArray(value)) {
      // 重新定义数组中会修改数组的方法， push、pop，unshift，shift,splice,sort,reserve，并挂载到数组的原型中
      // 从而使数组方法被调用的时候，能够触发dep.notify，从而更新视图
      if (hasProto) {
        protoAugment(value, arrayMethods)
      } else {
        copyAugment(value, arrayMethods, arrayKeys)
      }
      // 如果是数组，则通过observeArray将数组转换成响应式的
      this.observeArray(value)
    } else {
      // 遍历对象中的每一个属性，设置getter/setter
      this.walk(value)
    }
  }

  /**
   * Walk through all properties and convert them into
   * getter/setters. This method should only be called when
   * value type is Object.
   */
  walk (obj: Object) {
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
      defineReactive(obj, keys[i])
    }
  }

  /**
   * Observe a list of Array items.
   */
  observeArray (items: Array<any>) {
    for (let i = 0, l = items.length; i < l; i++) {
      // 遍历数组元素，如果是数组，则将对应的元素改变成响应式的
      observe(items[i])
    }
  }
}

// helpers

/**
 * Augment a target Object or Array by intercepting
 * the prototype chain using __proto__
 */
function protoAugment (target, src: Object) {
  /* eslint-disable no-proto */
  target.__proto__ = src
  /* eslint-enable no-proto */
}

/**
 * Augment a target Object or Array by defining
 * hidden properties.
 */
/* istanbul ignore next */
function copyAugment (target: Object, src: Object, keys: Array<string>) {
  for (let i = 0, l = keys.length; i < l; i++) {
    const key = keys[i]
    def(target, key, src[key])
  }
}

/**
 * Attempt to create an observer instance for a value,
 * returns the new observer if successfully observed,
 * or the existing observer if the value already has one.
 */
// 如果有这个对象的observer对象，直接返回，没有这创建
export function observe (value: any, asRootData: ?boolean): Observer | void {
  // 是响应式，直接返回
  // 判断是不是数组，不是直接返回
  if (!isObject(value) || value instanceof VNode) {
    return
  }

  let ob: Observer | void
  // 如果有__ob__(observer对象)属性，结束
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__
  } else if (
    // 没有则创建
    shouldObserve &&
    !isServerRendering() &&
    (Array.isArray(value) || isPlainObject(value)) &&
    Object.isExtensible(value) &&
    !value._isVue
  ) {
    // 创建Observer对象
    ob = new Observer(value)
  }
  if (asRootData && ob) {
    ob.vmCount++
  }
  return ob
}

/**
 * Define a reactive property on an Object.
 */
// 为一个对象定义一个响应式的属性
export function defineReactive (
  obj: Object,
  key: string,
  val: any,
  customSetter?: ?Function,
  // 是否浅监听，false则递归监听
  shallow?: boolean
) {
  // 创建依赖对象实例
  const dep = new Dep()
// 获取obj的属性描述符对象
  const property = Object.getOwnPropertyDescriptor(obj, key)
  if (property && property.configurable === false) {
    return
  }

  // cater for pre-defined getter/setters
  // 提供预定义的存取器函数
  // 缓存用户传入的getter/setter，后面执行调用
  const getter = property && property.get
  const setter = property && property.set
  if ((!getter || setter) && arguments.length === 2) {
    val = obj[key]
  }
// 判断是否递归观察子对象，并将子对象属性都转换成getter/setter， 返回子观察对象
  let childOb = !shallow && observe(val)
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter () {
      // 如果预定义的getter存在，则value等于getter调用的返回值
      // 否则直接赋予属性值
      const value = getter ? getter.call(obj) : val
      // 如果存在当前依赖目标，即watcher对象，则建立依赖
      if (Dep.target) {
        // 依赖收集
        dep.depend()
        // 如果自观察目标存在，简历子对象的依赖关系
        if (childOb) {
          childOb.dep.depend()
          if (Array.isArray(value)) {
            // 如果属性是数组，则特殊处理数组对象的依赖
            dependArray(value)
          }
        }
      }
      // 返回属性值
      return value
    },
    set: function reactiveSetter (newVal) {
      // 如果用户传入了getter，则value等于getter调用的返回值
      // 否则直接赋予属性值
      const value = getter ? getter.call(obj) : val
      // 如果新值等于旧值，或者新值旧值为NaN，则不执行
      /* eslint-disable no-self-compare */
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return
      }
      /* eslint-enable no-self-compare */
      if (process.env.NODE_ENV !== 'production' && customSetter) {
        customSetter()
      }
      // #7981: for accessor properties without setter
      // 如果没有setter，直接返回
      if (getter && !setter) return
      // 如果预定义setter存在则调用，否则直接更新新值
      if (setter) {
        setter.call(obj, newVal)
      } else {
        val = newVal
      }
      // 如果心智是对象，观察子对象并返回子的observer对象
      childOb = !shallow && observe(newVal)
      // 派发更新（发布更改通知）
      dep.notify()
    }
  })
}

/**
 * Set a property on an object. Adds the new property and
 * triggers change notification if the property doesn't
 * already exist.
 */
// 接受对象或者数组为target，向target中添加新的属性和value
export function set (target: Array<any> | Object, key: any, val: any): any {
  // 判断是否未开发环境，如果是判断target是否为undefined或者是否为原始类型，如果是则抛出警告，不能想undefined和原始类型添加属性
  if (process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(`Cannot set reactive property on undefined, null, or primitive value: ${(target: any)}`)
  }
  // 如果是数组并且key是有效的数组下标
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    // 将数组的length设置为原始length或者key（如果key比较大的话）
    target.length = Math.max(target.length, key)//Mark: 巧妙，学习了
    // 通过splice对值进行替换，此处的splice在observer/array.js中进行了改写，通过这个方法修改数组，会触发响应式效果
    target.splice(key, 1, val)
    // 返回新值
    return val
  }
  // 接下来是target为对象的情况
  // 判断key是否已经存在，存在直接修改，并返回值
  if (key in target && !(key in Object.prototype)) {
    target[key] = val
    return val
  }
  // 如果不存在的情况：
  // 缓存target的ob（observer，初始化的时候，会将observer添加到对象中）对象
  const ob = (target: any).__ob__
  // 如果target是vue或者根$data属性？？？此处$data的vmCount是1，其他是0，警告，然后直接返回
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid adding reactive properties to a Vue instance or its root $data ' +
      'at runtime - declare it upfront in the data option.'
    )
    return val
  }
  // 如果没有ob对象，说明target不是响应式对象，没必要做响应式处理，直接赋值
  // 此处的判断将导致无法向vue实例中动态添加根属性
  if (!ob) {
    target[key] = val
    return val
  }
  // 把key设置为响应式属性
  defineReactive(ob.value, key, val)
  // 发送通知
  ob.dep.notify()
  return val
}

/**
 * Delete a property and trigger change if necessary.
 */
// 接受对象或者数组，删除指定key的值，更新视图
export function del (target: Array<any> | Object, key: any) {
  // 同样判断是否为undefined或者原始类型，是的话警告
  if (process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(`Cannot delete reactive property on undefined, null, or primitive value: ${(target: any)}`)
  }
  // 如果是数组，并且下标有效，调用splice方法删除指定元素，splice里面会调用ob.notify()更新视图
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.splice(key, 1)
    return
  }
  // 缓存ob(observer对象)
  const ob = (target: any).__ob__
  // 判断如果是vue实例或者是$data，告警并返回
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid deleting properties on a Vue instance or its root $data ' +
      '- just set it to null.'
    )
    return
  }
  // 如果target没有这个属性，直接返回
  if (!hasOwn(target, key)) {
    return
  }
  // 删除target.key属性
  delete target[key]
  // 如果没有ob的话，说明target不是响应式的，直接返回
  if (!ob) {
    return
  }
  // 通过ob.dep.notify()发送通知，更新视图
  ob.dep.notify()
}

/**
 * Collect dependencies on array elements when the array is touched, since
 * we cannot intercept array element access like property getters.
 */
function dependArray (value: Array<any>) {
  for (let e, i = 0, l = value.length; i < l; i++) {
    e = value[i]
    e && e.__ob__ && e.__ob__.dep.depend()
    if (Array.isArray(e)) {
      dependArray(e)
    }
  }
}
