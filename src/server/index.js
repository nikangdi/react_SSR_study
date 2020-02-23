﻿import express from 'express'
import proxy from 'express-http-proxy' // node 变成代理服务器 (易于代码纠错)
import { matchRoutes } from 'react-router-config' // 能匹配子路由, matchPath 只匹配父级路由
import { render } from './utils'
import { getStore } from '../store'
import routes from '../Routes'

const app = express()

// 当访问 /api 路由时，代理到指定服务器地址
//eg
//当客户端请求 /api/news
//req.url就是/news
//指的是撇除/api剩下的部分
app.use('/api', proxy('http://47.95.113.63', {
  proxyReqPathResolver: function(req) {
    //构造ssr/api路径
    return '/ssr/api' + req.url
  }
}))

// 同构: 一套 react 代码，在服务器端和客户端分别运行一次
app.use(express.static('public')) // express.static(): 请求静态文件就到 public 目录去找
app.get('*', function(req, res) {
  const store = getStore(req)
  const matchedRoutes = matchRoutes(routes, req.path)
  const promises = []
  matchedRoutes.forEach(item => { // 让 matchRoutes 里面所有组件对应的 loadData 方法执行一次
    if (item.route.loadData) {
      const promise = new Promise((resolve, reject) => {
        item.route.loadData(store)
          .then(resolve)
          .catch(resolve)
      })
      // promises.push(item.route.loadData(store))
      promises.push(promise)
    }
    // item.route.loadData(store) // 调用匹配到的路由组件, 执行该组件下的 lodaData()
  })
  Promise
    .all(promises)
    .then(() => {
      const context = {
        css: []
      }
      const html = render(store, routes, req, context)
      // console.log(context)
      if (context.action === 'REPLACE') { // 301 重定向, StaticRouter 发现有 Redict 就会注入 context 301 重定向内容
        res.redirect(301, context.url)
      }
      if (context.NOT_FOUND) {
        res.status(404)
        res.send(html)
      } else {
        res.send(html)
      }
    })
    // .catch(() => {
    //   res.send('request error!')
    //         const context = {}
    //   const html = render(store, routes, req, context)
    //   // console.log(context)
    //   if (context.action === 'REPLACE') { // 301 重定向, StaticRouter 发现有 Redict 就会注入 context 301 重定向内容
    //     res.redirect(301, context.url)
    //   }
    //   if (context.NOT_FOUND) {
    //     res.status(404)
    //     res.send(html)
    //   } else {
    //     res.send(html)
    //   }
    // })
})

let server = app.listen(3000)
