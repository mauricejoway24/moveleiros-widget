import Vue from 'vue'

let instance = null
const currentStore = 'currentStoreWidget'

class Persistence {
  contructor () {
    if (!instance) instance = this
    else return instance
  }

  getCurrentStore () {
    let store = Vue.localStorage.get(currentStore, '1')

    if (Number.isNaN(store) || store === 'true') {
      store = 1
    }

    return parseInt(store)
  }

  setCurrentStore (storeId) {
    if (Number.isNaN(storeId)) {
      storeId = 1
    }

    Vue.localStorage.set(currentStore, storeId)
  }

  set (reg, value) {
    Vue.localStorage.set(reg, value)
  }

  get (reg, def) {
    let result = Vue.localStorage.get(reg)
    return result === 'undefined' ? def : result
  }

  remove (req) {
    Vue.localStorage.remove(req)
  }
}

export default new Persistence()
