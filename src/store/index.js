﻿import {
  createStore,
  applyMiddleware,
  combineReducers
} from 'redux'
import thunk from 'redux-thunk'
import { reducer as homeReducter } from '../containers/Home/store'
import { reducer as translationReducter } from '../containers/Translation/store'
import { reducer as headerReducter } from '../components/Header/store'
import clientAxios from '../client/request'
import serverAxios from '../server/request'

const reducer = combineReducers({
  home: homeReducter,
  header: headerReducter,
  translation: translationReducter
})

export const getStore = (req) => {
  return createStore(reducer, applyMiddleware(thunk.withExtraArgument(serverAxios(req))))
}

export const getClientStore = () => {
  const defaultState = window.context.state // 服务器端 window.context 数据注水; 客户端 window.context 数据脱水
  return createStore(reducer, defaultState, applyMiddleware(thunk.withExtraArgument(clientAxios)))
}
