import Vue from 'vue'
import Vuex from 'vuex'
import { HubConnection } from '@aspnet/signalr'
import sendSlackMessage from './slack'
import router from './router'
import auth from './auth'
import config from '@config'
import persistence from './persistence'
import uploader from './upload'
import axios from 'axios'
import _ from 'lodash'

Vue.use(Vuex)

export const SEND_TYPING_STATE = 'SEND_TYPING_STATE'
export const EXTRA_PAYLOAD = 'EXTRA_PAYLOAD'
export const SEND_MESSAGE = 'SEND_MESSAGE'
export const SEND_BUFFER_MESSAGE = 'SEND_BUFFER_MESSAGE'
export const ALL_MESSAGES = 'allMessages'
export const BUFFER_MESSAGE = 'bufferMessage'
export const GET_USER_ID = 'getUserId'
export const NEW_CHANNEL_REGISTRY = 'NewChannelRegistry'
export const ON_DISCONNECT = 'OnDisconnect'
export const ON_CONNECT = 'OnConnect'
export const ON_RECONNECT = 'OnReconnect'
export const START_CONNECTION = 'START_CONNECTION'
export const SET_CURRENT_STORE = 'SET_CURRENT_STORE'
export const HUB_SEND_MESSAGE = 'Send'
export const SEND_BULK = 'SendBulk'
export const SET_USER_ID = 'setUserId'
export const SET_USER_DATA = 'SET_USER_DATA'
export const USERS_JOINED = 'UsersJoined'
export const PERMISSION = 'PERMISSION'
export const SEND_NEW_PUSH_TOKEN = 'SEND_NEW_PUSH_TOKEN'
export const SIGN_OUT = 'SIGN_OUT'
export const TRYING_TO_CONNECT = 'TRYING_TO_CONNECT'
export const ACTIVE_CHANNELS = 'ActiveChannels'
export const TRYING_FIND_AGENT = 'TryingFindAgent'
export const LAST_TRYING_FIND_AGENT = 'LastTryingFindAgent'
export const JOIN_NEW_CHANNEL = 'JoinNewChannel'
export const CURRENT_CHANNEL_ID = 'currentChannelId'
export const GET_LAST_MESSAGES = 'GetLastMessages'
export const AGENT_HAS_ACCEPTED = 'AGENT_HAS_ACCEPTED'
export const CHANGE_CHANNEL = 'CHANGE_CHANNEL'
export const UPDATE_CHANNEL_LIST = 'UPDATE_CHANNEL_LIST'
export const ERASE_MESSAGE = 'ERASE_MESSAGE'
export const UPLOAD_FILE = 'UPLOAD_FILE'
export const HUB_UPLOAD_FILE = 'SendFile'
export const END_CHAT = 'END_CHAT'
export const CHAT_HAS_ENDED = 'CHAT_HAS_ENDED'
export const INVALID_CHANNEL = 'INVALID_CHANNEL'
export const FORWARD_URL = 'FORWARD_URL'
export const IS_LOADING = 'IS_LOADING'
export const SEND_CUSTOMER_INTEGRATION = 'SEND_CUSTOMER_INTEGRATION'
export const AUTO_RELOGIN = 'AUTO_RELOGIN'
export const LOGIN = 'LOGIN'
export const REGISTER_ERROR = 'REGISTER_ERROR'
export const REGISTER_LOADING = 'REGISTER_LOADING'
export const REGISTER_DISMISS_ERROR = 'REGISTER_DISMISS_ERROR'
export const ALERT_ON_CHANNEL = 'ALERT_ON_CHANNEL'
export const CURRENT_USERNAME = 'CURRENT_USERNAME'
export const CHANGE_STATUS = 'CHANGE_STATUS'
export const CURRENT_STATUS = 'CURRENT_STATUS'
export const SEND_QUESTION = 'SEND_QUESTION'
export const USER_DATA = 'USER_DATA'
export const LOGOUT_REDIRECT_TO_REGISTER = 'LOGOUT_REDIRECT_TO_REGISTER'
export const LOADING_SEND_FORM = 'LOADING_SEND_FORM'
export const FINISH_SEND_FORM = 'FINISH_SEND_FORM'
const TYPING_MESSAGE = 'TYPING_MESSAGE'
export const AGENT_IS_TYPING = 'AGENT_IS_TYPING'

// Hub messages
export const THERE_IS_NO_AGENT = 'ThereIsNoAgent'
export const CUSTOMER_END_CHAT = 'CustomerEndChat'
const DISPATCH_ALERT = 'DISPATCH_ALERT'
export const HUB_TYPING_MESSAGE = 'PushTyping'
const HUB_USER_IS_NOT_TYPING = 'USER_IS_NOT_TYPING'
const HUB_USER_IS_TYPING = 'USER_IS_TYPING'

const state = {
  bufferMessage: '',
  messages: [],
  channels: [],
  userId: 1,
  username: '',
  extra_payload: null,
  isOnline: true,
  flashMessage: '',
  flashType: 'success',
  currentStatus: 'available',
  currentStoreId: () => persistence.getCurrentStore(),
  [CURRENT_CHANNEL_ID]: '',
  currentToken: () => auth.getToken(),
  permissionGranted: true,
  tryingToConnect: false,
  [FORWARD_URL]: '',
  [IS_LOADING]: true,
  [REGISTER_ERROR]: false,
  [REGISTER_LOADING]: false,
  [ALERT_ON_CHANNEL]: [],
  [LOADING_SEND_FORM]: false,
  appInPause: false,
  [AGENT_IS_TYPING]: false
}

let activeConnection
let timeoutReconnect = 0
let tryingFindAgentHandler

// store typing timeout status
let typingTimeout = null

const getters = {
  [ALL_MESSAGES]: state => state.messages,
  [BUFFER_MESSAGE]: state => state.bufferMessage,
  [GET_USER_ID]: state => auth.getLivechatId(),
  [PERMISSION]: state => state.permissionGranted,
  [ACTIVE_CHANNELS]: state => state.channels,
  'flashMessage': state => state.flashMessage,
  'showFlashMessage': state => !state.isOnline,
  'flashType': state => state.flashType,
  [CURRENT_CHANNEL_ID]: state => state[CURRENT_CHANNEL_ID],
  [FORWARD_URL]: state => state[FORWARD_URL],
  [IS_LOADING]: state => state[IS_LOADING],
  [REGISTER_ERROR]: state => state[REGISTER_ERROR],
  [REGISTER_LOADING]: state => state[REGISTER_LOADING],
  [ALERT_ON_CHANNEL]: state => state[ALERT_ON_CHANNEL],
  [CURRENT_USERNAME]: state => auth.getUsername(),
  [CURRENT_STATUS]: state => state.currentStatus,
  [USER_DATA]: _ => getUserData(),
  [LOADING_SEND_FORM]: state => state[LOADING_SEND_FORM],
  [AGENT_IS_TYPING]: state => state[AGENT_IS_TYPING]
}

const store = new Vuex.Store({
  mutations: {
    [CHANGE_STATUS] (state, status) {
      if (state !== state.currentStatus) {
        state.currentStatus = status
      }
      console.log(status)
    },

    [EXTRA_PAYLOAD] (state, content) {
      state.extra_payload = content
    },

    [SEND_TYPING_STATE] (state) {
      let messagePack = {
        fromConnectionId: auth.getLivechatId(),
        channelId: state.currentChannelId,
        livechatUserId: state.userId,
        fromName: state.username || auth.getUsername(),
        message: state.bufferMessage,
        elements: []
      }

      activeConnection
        .invoke('SendTypingState', messagePack)
        .catch(err => console.error(err))
    },

    [SEND_MESSAGE] (state, content) {
      if (content && content.length > 0) return

      if (state.bufferMessage.length === 0) return

      let messagePack = {
        fromConnectionId: auth.getLivechatId(),
        channelId: state.currentChannelId,
        livechatUserId: state.userId,
        fromName: state.username || auth.getUsername(),
        message: state.bufferMessage,
        elements: []
      }

      activeConnection
        .invoke('SendGroupMessage', messagePack)
        .catch(err => console.error(err))

      state.bufferMessage = ''

      this.commit(TYPING_MESSAGE)
    },

    [TYPING_MESSAGE] (state) {
      let pushTyping = {
        channelId: state.currentChannelId,
        message: state.bufferMessage
      }

      if (typingTimeout) clearTimeout(typingTimeout)

      typingTimeout = setTimeout(_ => {
        typingTimeout = null

        activeConnection
          .invoke(HUB_TYPING_MESSAGE, pushTyping)
          .catch(err => sendSlackMessage(err))
      }, 1000)
    },

    [SET_USER_DATA] (state, data) {
      state.userId = data.livechatUserId
      state.username = data.username

      auth.setAuthData(data)
    },

    [ERASE_MESSAGE] (state) {
      state.messages = []
    },

    [SEND_BUFFER_MESSAGE] (state, data) {
      let content = data.content ? data.content : data
      if (data.which && data.which !== 13) {
        typingMessage(content)
      }
      if (typeof content === 'string') {
        state.bufferMessage = content

        this.commit(TYPING_MESSAGE)

        return
      }

      state.bufferMessage = content.message
      this.commit(SEND_MESSAGE)
    },

    [HUB_SEND_MESSAGE] (state, data) {
      if (data.channelId !== state.currentChannelId) {
        state[ALERT_ON_CHANNEL].push(data.channelId)
        return
      }

      state.messages.push({
        userId: data.fromConnectionId,
        userName: data.fromName,
        livechatUserId: data.livechatUserId,
        content: data.message,
        sentAt: data.createdAt,
        elements: data.elements
      })
    },

    [TRYING_FIND_AGENT] (state, { channelId, timeToWait, currentNum }) {
      tryingFindAgentHandler = setTimeout(() => {
        activeConnection
          .invoke(TRYING_FIND_AGENT, channelId, currentNum + 1)
          .catch(err => sendSlackMessage(err))
      }, timeToWait)
    },

    [LAST_TRYING_FIND_AGENT] (state, { channelId, timeToWait }) {
      tryingFindAgentHandler = setTimeout(() => {
        cleanActiveConnection()
        router.push('notfound')
      }, timeToWait)
    },

    [NEW_CHANNEL_REGISTRY] (state, channelId) {
      state.currentChannelId = channelId

      state[ALERT_ON_CHANNEL] = state[ALERT_ON_CHANNEL]
        .filter(id => id !== channelId)

      activeConnection
        .invoke(GET_LAST_MESSAGES, channelId)
        .catch(err => {
          sendSlackMessage(err)
        })
    },

    [ON_DISCONNECT] (state, callback) {
      let connectionTimeoutCounter = timeoutReconnect

      if (state.tryingToConnect) {
        console.info('ON_DISCONNECT quitting...')
        return
      }

      state.isOnline = false
      state.flashMessage = `A conexão falhou. Tentando reconectar-se em ${connectionTimeoutCounter}`
      state.flashType = 'warn'

      const timeoutFunc = () => {
        connectionTimeoutCounter--

        if (connectionTimeoutCounter <= 0) {
          connectHub(callback)
          return
        }

        state.flashMessage = `A conexão falhou. Tentando reconectar-se em ${connectionTimeoutCounter}`

        setTimeout(timeoutFunc, 1000)
      }

      setTimeout(timeoutFunc, 1000)
    },

    [ON_CONNECT] (state, hub) {
      state.isOnline = true
      state.flashMessage = ''

      let watchCount = 5
      const timeoutFunc = () => {
        watchCount--
        if (watchCount <= 0 || state.extra_payload) {
          if (state.extra_payload) {
            activeConnection
              .invoke('UpdatePayload', state.extra_payload)
              .catch(err => {
                sendSlackMessage(err)
              })
          }
          return
        }
        setTimeout(timeoutFunc, 500)
      }
      timeoutFunc()
    },

    [ON_RECONNECT] (state) {
      state.flashMessage = 'Conectando ao servidor. Aguarde um momento ;)'
      state.isOnline = false
      state.flashType = 'success'
    },

    [START_CONNECTION] (state, forceConnection) {
      if (forceConnection) {
        state.tryingToConnect = false
      }
      connectHub()
    },

    [SET_CURRENT_STORE] (state, storeId) {
      persistence.setCurrentStore(storeId)
    },

    [SEND_BULK] (state, messages) {
      state.messages = []

      messages.map(message => {
        state.messages.push({
          id: message.id,
          userId: message.fromConnectionId,
          userName: message.fromName,
          livechatUserId: message.livechatUserId,
          content: message.message,
          sentAt: message.createdAt,
          elements: message.elements
        })
      })
    },

    [ACTIVE_CHANNELS] (state, channels) {
      this.commit(UPDATE_CHANNEL_LIST, channels)

      if (channels.length > 0) {
        store.commit(NEW_CHANNEL_REGISTRY, channels[0].id)
      }
    },

    // Dispatch when users go online/offline
    // Different from ACTIVE_CHANNELS, it does not update current channel state
    [UPDATE_CHANNEL_LIST] (state, channels) {
      state.channels = channels
    },

    [USERS_JOINED] (state, userStateList) {
      //
    },

    [SEND_NEW_PUSH_TOKEN] (state, newToken) {
      let thisDevice = 'desktop'
      if (window.device) {
        thisDevice = window.device.platform || 'desktop'
      }
      activeConnection
        .invoke('PushNewToken', {
          token: newToken,
          device: thisDevice
        })
        .catch(err => {
          sendSlackMessage(err)
        })
    },

    [SIGN_OUT] (state) {
      removeAuthData('/login')
    },

    [JOIN_NEW_CHANNEL] (state, channelId) {
      if (!channelId) {
        Vue.notify.swal({
          title: 'Hum...',
          text: 'Canal inválido. Tente recarregar a página.',
          icon: 'error',
          buttons: ['Ok'],
          timer: 10000
        })

        return
      }

      if (!activeConnection) {
        let callback = () => {
          activeConnection
            .invoke(JOIN_NEW_CHANNEL, channelId)
            .catch(err => sendSlackMessage(err))
        }

        return connectHub(callback)
      }

      activeConnection
        .invoke(JOIN_NEW_CHANNEL, channelId)
        .catch(_ => {
          // sendSlackMessage(err)
          let callback = () => {
            activeConnection
              .invoke(JOIN_NEW_CHANNEL, channelId)
              .catch(_ => {
                setTimeout(() => {
                  callback()
                }, 2000)
              })
          }

          return callback()
        })
    },

    [AGENT_HAS_ACCEPTED] (state) {
      if (tryingFindAgentHandler) {
        clearTimeout(tryingFindAgentHandler)
        tryingFindAgentHandler = null
      }
    },

    [CHANGE_CHANNEL] (state, channel) {
      this.commit(NEW_CHANNEL_REGISTRY, channel.id)
    },

    [END_CHAT] (state, hubCallMethod) {
      Vue.notify.swal({
        title: 'Encerrar o atendimento?',
        text: 'Não será possível enviar mensagens para esta conversa, continuar?',
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Sim',
        cancelButtonText: 'Não'
      }).then(function (result) {
        if (result.value) {
          if (tryingFindAgentHandler) clearTimeout(tryingFindAgentHandler)

          Vue.notify.swal({
            showConfirmButton: false,
            title: 'Encerrando',
            allowEscapeKey: false,
            allowOutsideClick: false,
            text: 'Aguarde, por favor.',
            onOpen: function () {
              Vue.notify.$swal().showLoading()
              let messagePack = {
                fromConnectionId: auth.getLivechatId(),
                channelId: state.currentChannelId,
                livechatUserId: state.userId,
                fromName: state.username || auth.getUsername(),
                message: 'Saiu do chat.',
                elements: []
              }

              activeConnection
                .invoke(hubCallMethod || 'EndChat', state.currentChannelId, messagePack)
                .catch(err => sendSlackMessage(err))

              // if (window.parent && window.parent !== window.self) {
              //   window.parent.postMessage({ event: 'onMoveleirosPluginClose' }, '*')
              // }
            }
          })
        }
      })
    },

    [CHAT_HAS_ENDED] (state, channelId) {
      Vue.notify.swal({
        title: 'Encerrado!',
        text: 'O chat foi encerrado com sucesso.',
        type: 'success'
      })

      state.channels = state.channels
        .filter(channel => channel.channelId !== channelId)

      if (state.channels.length > 0) {
        this.commit(CHANGE_CHANNEL, state.channels[0])
      } else {
        state.currentChannelId = ''
      }
    },

    [INVALID_CHANNEL] (state) {
      if (state.channels.length > 0) {
        this.commit(CHANGE_CHANNEL, state.channels[0])
      } else {
        state.currentChannelId = ''
      }
    },

    [UPLOAD_FILE] (state, file) {
      Vue.notify.swal({
        showConfirmButton: false,
        title: 'Enviando :)',
        allowEscapeKey: false,
        allowOutsideClick: false,
        text: 'Aguarde, por favor.',
        onOpen: function () {
          Vue.notify.$swal().showLoading()
        }
      })

      uploader
        .uploadFile(file)
        .then(response => {
          let messagePack = {
            fromConnectionId: auth.getLivechatId(),
            channelId: state.currentChannelId,
            livechatUserId: state.userId,
            fromName: state.username || auth.getUsername(),
            message: state.bufferMessage,
            elements: [
              {
                value: response.data.filePath,
                text: response.data.fileName,
                elementType: 'file'
              }
            ]
          }

          activeConnection
            .invoke('SendGroupMessage', messagePack)
            .catch(err => sendSlackMessage(err))

          Vue.notify.swal({
            title: 'Enviado!',
            text: 'O arquivo foi enviado com sucesso.',
            type: 'success'
          })
        })
        .catch(err => {
          sendSlackMessage(err)
          Vue.notify.swal({
            title: 'Oops...',
            text: 'Erro ao tentar enviar o arquivo. Tente novamente, por favor.',
            type: 'error'
          })
        })
    },

    [CUSTOMER_END_CHAT] (state) {
      this.commit(END_CHAT, CUSTOMER_END_CHAT)
    },

    [FORWARD_URL] (state, url) {
      // var event = new CustomEvent('closeChatEvent')
      if (self === top) {
        Vue.notify.swal({
          title: 'O chat foi finalizado!',
          type: 'success'
        }).then(() => {
          location.href = 'https://www.moveleiros.com.br'
        })
      } else {
        Vue.notify.swal({
          title: 'O chat foi finalizado!',
          type: 'success'
        }).then(() => {
          window.parent.postMessage('EndChatEvent', '*')
        })
      }
      // state[FORWARD_URL] = url
      // router.push('/fullforward')
      // Vue.notify.swal({
      //   title: 'Finalizado!',
      //   type: 'success'
      // })
    },

    [THERE_IS_NO_AGENT] (state) {
      router.push('/notfound')
    },

    [IS_LOADING] (state, isLoading) {
      console.log('changing loading', isLoading)
      state[IS_LOADING] = isLoading
    },

    [AUTO_RELOGIN] (state, extra) {
      let token = auth.getToken()
      let base64Url = token.split('.')[1]
      let base64 = base64Url.replace('-', '+').replace('_', '/')
      let payloadJwt = JSON.parse(window.atob(base64))
      let payload = payloadJwt.UserPayload
      let information = {
        name: payload ? payload.name : '',
        phone: payload ? payload.phone : '',
        payload,
        fromRegister: extra ? extra.fromRegister : false
      }

      this.commit(LOGIN, information)
    },

    [LOGIN] (state, information) {
      state[REGISTER_LOADING] = true
      state[REGISTER_ERROR] = false

      axios
        .post(`${config.getConfig('BASE_HUB_URL')}livechat/register`, information)
        .then(result => {
          this.commit(SET_USER_DATA, result.data)
          this.commit(IS_LOADING, false)
          router.push('livechat')
        })
        .catch(err => {
          if (!information.fromRegister) {
            sendSlackMessage(err)
            state[REGISTER_ERROR] = true
          }
          state[REGISTER_LOADING] = false
        })
    },

    [REGISTER_DISMISS_ERROR] (state) {
      state[REGISTER_LOADING] = false
      state[REGISTER_ERROR] = false
    },

    [DISPATCH_ALERT] (state, alertType) {
    },

    [SEND_QUESTION] (state, message) {
      let userData = getUserData()
      let storeId = persistence.getCurrentStore()
      let form = {
        message,
        name: userData.name,
        phone: userData.phone,
        storeId
      }

      state[LOADING_SEND_FORM] = true

      axios
        .post(`${config.getConfig('BASE_HUB_URL')}forms/sendquestionform`, form)
        .then(result => {
          this.commit(FINISH_SEND_FORM)
        })
        .catch(err => {
          sendSlackMessage(err)
        })
    },

    [FINISH_SEND_FORM] (state) {
      state[LOADING_SEND_FORM] = false
      router.push('thanks')
    },

    [LOGOUT_REDIRECT_TO_REGISTER] (state) {
      removeAuthData('/register')
      this.commit(REGISTER_DISMISS_ERROR)
    },

    [HUB_USER_IS_TYPING] (state, typingObj) {
      state[AGENT_IS_TYPING] = true
      setTimeout(() => {
        state[AGENT_IS_TYPING] = false
      }, 2000)
    },

    [HUB_USER_IS_NOT_TYPING] (state, typingObj) {
      state[AGENT_IS_TYPING] = false
    }
  },
  getters,
  state
})

var typingMessage = _.debounce((message) => {
  store.commit(SEND_TYPING_STATE)
}, 500)

function connectHub (callback) {
  if (state.tryingToConnect) {
    return
  }

  state.tryingToConnect = true

  if (activeConnection) {
    cleanActiveConnection()
  }

  const storeIdParam = `storeId=${state.currentStoreId()}`
  const token = state.currentToken()

  let hubConnection = new HubConnection(`${config.getConfig('BASE_HUB_URL')}mktchat?${storeIdParam}`, {
    accessTokenFactory: () => token
  })

  activeConnection = hubConnection

  if (!auth.userAuthenticated()) {
    // force beforeEach method call
    router.push('livechat')
    return
  }

  store.commit(ON_RECONNECT)

  // Hub
  hubConnection.on(HUB_SEND_MESSAGE, data => {
    store.commit(HUB_SEND_MESSAGE, data)
  })

  hubConnection.on(NEW_CHANNEL_REGISTRY, storeId => {
    store.commit(NEW_CHANNEL_REGISTRY, storeId)
  })

  hubConnection.on(SEND_BULK, messages => {
    store.commit(SEND_BULK, messages)
  })

  hubConnection.on(USERS_JOINED, userJoined => {
    store.commit(USERS_JOINED, userJoined)
  })

  hubConnection.on(ACTIVE_CHANNELS, channels => {
    store.commit(ACTIVE_CHANNELS, channels)
  })

  hubConnection.on(TRYING_FIND_AGENT, (data) => {
    store.commit(TRYING_FIND_AGENT, data)
  })

  hubConnection.on(LAST_TRYING_FIND_AGENT, timeToWait => {
    store.commit(LAST_TRYING_FIND_AGENT, timeToWait)
  })

  hubConnection.on(AGENT_HAS_ACCEPTED, _ => {
    store.commit(AGENT_HAS_ACCEPTED)
  })

  hubConnection.on(UPDATE_CHANNEL_LIST, channels => {
    store.commit(UPDATE_CHANNEL_LIST, channels)
  })

  hubConnection.on(CHAT_HAS_ENDED, channelId => {
    store.commit(CHAT_HAS_ENDED, channelId)
  })

  hubConnection.on(INVALID_CHANNEL, _ => {
    store.commit(INVALID_CHANNEL)
  })

  hubConnection.on(FORWARD_URL, url => {
    store.commit(FORWARD_URL, url)
  })

  hubConnection.on(THERE_IS_NO_AGENT, _ => {
    store.commit(THERE_IS_NO_AGENT)
  })

  hubConnection.on(DISPATCH_ALERT, alertType => {
    store.commit(DISPATCH_ALERT, alertType)
  })

  hubConnection.on(HUB_USER_IS_TYPING, typingObj => {
    store.commit(HUB_USER_IS_TYPING, typingObj)
  })

  hubConnection.on(HUB_USER_IS_NOT_TYPING, typingObj => {
    store.commit(HUB_USER_IS_NOT_TYPING, typingObj)
  })

  hubConnection.onclose(_ => {
    // It checks if our disconnect event is from an active connection or not
    if (activeConnection !== hubConnection) return

    store.commit(ON_DISCONNECT)
  })

  return hubConnection.start()
    .then(() => {
      timeoutReconnect = 5
      store.commit(ON_CONNECT, hubConnection)
      state.tryingToConnect = false

      if (callback) callback()
    })
    .catch(err => {
      if (err && err.statusCode && err.statusCode === 401) {
        removeAuthData('/register')
      } else {
        sendSlackMessage(err)
        state.tryingToConnect = false
        timeoutReconnect += 5
        store.commit(ON_DISCONNECT, callback)
      }
    })
}

function cleanActiveConnection () {
  removeHub(activeConnection)
  activeConnection = null
}

function getUserData () {
  let token = auth.getToken()

  if (!token || token.length === 0) {
    return {
      name: '',
      phone: ''
    }
  }

  let base64Url = token.split('.')[1]
  let base64 = base64Url.replace('-', '+').replace('_', '/')
  let payloadJwt = JSON.parse(window.atob(base64))
  let payload = payloadJwt.UserPayload

  return {
    name: payload ? payload.name : '',
    phone: payload ? payload.phone : ''
  }
}

function removeAuthData (routeTo) {
  auth
    .logout()
    .then(_ => {
      cleanActiveConnection()
      store.commit(SET_USER_DATA, {})
      if (routeTo) {
        router.push(routeTo)
      }
    })
    .catch(err => {
      sendSlackMessage(err)
    })
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (e) => {
    console.log('receiving message', e)
    /* eslint-disable no-new */
    new Audio('/static/audio/new_call.mp3').play()
  })
}

function removeHub (connection) {
  try {
    connection.off(HUB_SEND_MESSAGE)
    connection.off(NEW_CHANNEL_REGISTRY)
    connection.off(SEND_BULK)
    connection.off(USERS_JOINED)
    connection.off(ACTIVE_CHANNELS)
    connection.off(TRYING_FIND_AGENT)
    connection.off(LAST_TRYING_FIND_AGENT)
    connection.off(AGENT_HAS_ACCEPTED)
    connection.off(UPDATE_CHANNEL_LIST)
    connection.off(CHAT_HAS_ENDED)
    connection.off(INVALID_CHANNEL)
    connection.off(FORWARD_URL)
    connection.off(THERE_IS_NO_AGENT)
    connection.off(HUB_USER_IS_TYPING)
    connection.off(HUB_USER_IS_NOT_TYPING)
    connection.removeConnection = true
    connection.stop()
  } catch (e) {
  }
}

export default store
