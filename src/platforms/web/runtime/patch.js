/* @flow */

import * as nodeOps from 'web/runtime/node-ops'
import { createPatchFunction } from 'core/vdom/patch'
import baseModules from 'core/vdom/modules/index'
import platformModules from 'web/runtime/modules/index'

// the directive module should be applied last, after all
// built-in modules have been applied.
// 模块，snabbdom类似的模块和directive, refs
const modules = platformModules.concat(baseModules)

// nodeOps:domapi
// modules
export const patch: Function = createPatchFunction({ nodeOps, modules })
