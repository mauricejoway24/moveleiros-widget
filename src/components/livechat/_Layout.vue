<template>
  <div class="main-livechat vbox">
    <loading-model v-if="loading"></loading-model>
    <flash-message></flash-message>
    <header-toolbar>
      <slot v-if="agentIsTyping">
        <span class="typing">Atendimento Chat (está digitando
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        )
        </span>
      </slot>
    </header-toolbar>
    <message-box></message-box>
    <message-input @updatemessagebox="updateChatList"></message-input>
  </div>  
</template>

<script>
import MessageBox from './MessageBox'
import MessageInput from './MessageInput'
import HeaderToolbar from './HeaderToolbar'
import FlashMessage from '@/components/shared/FlashMessage'
import { START_CONNECTION, IS_LOADING, AGENT_IS_TYPING, EXTRA_PAYLOAD } from '@/store'
import LoadingModel from '@/components/shared/LoadingModal'
import { mapGetters } from 'vuex'

export default {
  components: { MessageBox, MessageInput, HeaderToolbar, FlashMessage, LoadingModel },

  created () {
  },

  mounted () {
    console.log('Livechat Mounted')
    window.addEventListener('message', e => {
      if (e.data.event === '_onScriptLoad') {
        let extraPayload = e.data.payload.extra || {}
        this.$store.commit(EXTRA_PAYLOAD, extraPayload)
        console.log(extraPayload)
      }
    })
    this.$nextTick(() => {
      this.$store.commit(START_CONNECTION, true)
      console.log('Cleaning')
      this.$nextTick(() => {
        this.$store.commit(IS_LOADING, false)
        console.log(IS_LOADING)
      })
    })
  },

  methods: {
    updateChatList () {
      this.$emit('updateChatListChild')
    }
  },

  computed: {
    ...mapGetters({
      loading: IS_LOADING,
      agentIsTyping: AGENT_IS_TYPING
    })
  }
}
</script>

<style lang="stylus">
.main-livechat
  flex 1
  display flex
  min-height 300px
  box-shadow 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)

@media (min-width: 768px)
  .main-livechat
    min-height 480px
    width 100%
    max-width 580px
    max-height 700px
    align-self center
    justify-self center

.typing
  position relative
  height 100px
  padding-bottom 15px
  .dot
    display inline-block
    width 5px
    height 5px
    border-radius 50%
    margin-left 2px
    background #fff
    animation wave 1.3s linear infinite
    &:nth-child(2)
      animation-delay -1.1s
    &:nth-child(3)
      animation-delay -0.9s

@keyframes wave
	0%, 60%, 100%
		transform initial

	30%
    transform translateY(-7px)
</style>
