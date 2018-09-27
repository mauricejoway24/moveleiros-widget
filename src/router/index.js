import Vue from 'vue'
import Router from 'vue-router'
import Layout from '@/components/livechat/_Layout'
import Register from '@/components/auth/Register'
import AgentNotFound from '@/components/notfound/AgentNotFound'
import MessageSentThanks from '@/components/livechat/MessageSentThanks'
import IFrameContainer from '@/components/shared/IFrameContainer'
import auth from '@/auth'
import { default as store, SET_CURRENT_STORE } from '@/store'

Vue.use(Router)

const routes = new Router({
  routes: [
    {
      path: '/livechat',
      name: 'LiveChat',
      component: Layout
    },
    {
      path: '/register',
      name: 'Register',
      component: Register
    },
    {
      path: '/notfound',
      name: 'NotFound',
      component: AgentNotFound
    },
    {
      path: '/fullforward',
      name: 'FullForward',
      component: IFrameContainer
    },
    {
      path: '/thanks',
      name: 'MessageSentThanks',
      component: MessageSentThanks
    }
  ]
})

routes.beforeEach((to, from, next) => {
  if (to.path === '/notfound') return next()
  if (to.path === '/thanks') return next()
  if (to.path === '/fullforward') return next()

  let query = {
    storeId: to.query.storeId || from.query.storeId,
    relogin: to.query.relogin
  }

  if (query.storeId) {
    store.commit(SET_CURRENT_STORE, query.storeId)
  }

  if (auth.userAuthenticated() && to.path !== '/livechat') {
    return next({ path: '/livechat' })
  }

  if (to.path === '/register' && query.relogin && auth.userAuthenticated()) {
    return next()
  }

  if (to.path === '/livechat') {
    if (query.relogin && auth.userAuthenticated()) {
      return next({ path: '/register', query: { relogin: true } })
    }

    if (!auth.userAuthenticated()) {
      return next({ path: '/register' })
    }

    return next()
  }

  if (!auth.userAuthenticated()) {
    if (to.path === '/register') {
      return next()
    } else {
      return next({ path: '/register' })
    }
  }
})

export default routes
