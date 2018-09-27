// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import store from './store'
import autosize from 'autosize'
import VueChatScroll from 'vue-chat-scroll'
import Icon from 'vue-awesome/components/Icon'
import Popover from 'vue-js-popover'
import VueLocalStorage from 'vue-localstorage'
import lodash from 'lodash'
import { UiTextbox, UiButton, UiAlert } from 'keen-ui'
import Notify from './notify'
import 'keen-ui/dist/keen-ui.css'

Vue.config.productionTip = false

Vue.use(VueChatScroll)
Vue.use(Popover)
Vue.use(VueLocalStorage)
Vue.use(Notify)
Vue.use(lodash)

Vue.component('icon', Icon)

Vue.component('autosizing-textarea', {
  props: [ 'onenter', 'presskeyup', 'content' ],
  template: `<textarea @keypress="dealWithPressKey($event)" @keyup="presskeyup" rows="1" :value="content"></textarea>`,
  mounted () {
    autosize(this.$el)

    // $nextTick doesn't work here when it comes with UI update =\
    setTimeout(() => autosize.update(this.$el), 1000)
  },

  updated () {
    autosize.update(this.$el)
  },

  methods: {
    dealWithPressKey (e) {
      let key = e.keyCode || e.which

      if (key === 13) {
        e.preventDefault()

        this.$nextTick(function () {
          this.onenter()
        })
      }
    }
  }
})

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  template: '<App/>',
  components: {
    App,
    UiTextbox,
    UiButton,
    UiAlert
  },
  store: store
})
