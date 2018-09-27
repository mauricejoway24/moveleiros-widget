<template>
  <div :class="['main', 'vbox', { 'with-toolbar': useHeaderToolbar }]">
    <loading-model v-if="loading" :message="'Acessando, só mais um minuto :)'"></loading-model>
    
    <header-toolbar 
      v-if="useHeaderToolbar" 
      :before-close="closeHeader" 
      :whitebackground="true"
      :inverseCloseButton="true">
    </header-toolbar>

    <ui-alert @dismiss="dismissAlert" type="error" v-show="showFatalError">
        Um problema aconteceu e não foi possível registrar. Tente novamente mais tarde, por favor.
    </ui-alert>

    <div class="header vbox">
      <div class="header-box">

        <div class="icon-box">
          <svg id="Camada_1" class="fill_chat_user" data-name="Camada 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 435.87 501"><title>PLUGIN_CHAT</title><path d="M426.21,0H223.78a42.26,42.26,0,0,0-42.2,42.22V152.94a42.26,42.26,0,0,0,42.2,42.22H244.7v32.63A17.16,17.16,0,0,0,274,239.91l44.72-44.75H426.21a42.26,42.26,0,0,0,42.21-42.22V42.22A42.26,42.26,0,0,0,426.21,0Zm0,0" transform="translate(-32.54)"/><path d="M160.7,368.82a82.7,82.7,0,1,0-25.3,0c-29.22,2.54-54.83,13.88-73.1,32.57-20.22,20.71-30.5,49.36-29.72,82.85A17.16,17.16,0,0,0,49.74,501H246.35a17.16,17.16,0,0,0,17.16-16.76c.77-33.5-9.5-62.15-29.73-82.85-18.26-18.7-43.87-30-73.07-32.57Zm0,0" transform="translate(-32.54)"/></svg>
        </div>

        <div class="header-text">
          <div class="call">
            <span>Chat</span>
            <span class="call-bold call-bold-divider">.</span>
            <span class="call-bold">24H</span>
          </div>
          <div class="title">
            <span>
            Olá, estamos online para atendê-lo.
            </span>
          </div>
        </div>

      </div>
    </div>

    <div class="center-box vbox">
      
      <div class="fields">

        <div class="form-field">
          <label for="Nome">Nome:</label>
          <input type="text" 
            ref="nameText"
            label="Nome*"
            placeholder="Digite seu nome aqui" 
            v-model="name"
            :invalid="!valid && !nameValid && this.name.length === 0"
            required/>
          <span v-show="!valid && !nameValid && this.name.length === 0">O Nome é obrigatório</span>
        </div>

        <div class="form-field">
          <label for="Tel">Telefone:</label>
          <input type="tel" 
            name="Tel"
            label="Número de telefone*"
            placeholder="(11) 99999-9999"
            v-model="phone"
            :invalid="!valid && !phoneValid && this.phone.length < 10"
            required/>
          <span v-show="!valid && !phoneValid && this.phone.length < 10">O Número de Telefone não é válido</span>
        </div>

        <div class="form-field">
          <button
            class="send-button"
            :loading="loading" 
            :size="'normal'" 
            @click="sendInformation"
            >
              Enviar
          </button>
        </div>

      </div>

      <div class="logo">
        <img src="/static/img/logo_stretch.svg" alt="Moveleiros Logo">
      </div>
    </div>
  </div>
</template>

<script>
import { UiAlert } from 'keen-ui'
import { ERASE_MESSAGE, AUTO_RELOGIN, LOGIN, REGISTER_ERROR, REGISTER_LOADING, REGISTER_DISMISS_ERROR } from '@/store'
import HeaderToolbar from '@/components/livechat/HeaderToolbar'
import persistence from '@/persistence'
import { mapGetters } from 'vuex'
import LoadingModel from '@/components/shared/LoadingModal'

export default {
  components: { UiAlert, HeaderToolbar, LoadingModel },

  data () {
    return {
      name: '',
      email: '',
      phone: '',
      valid: true,
      phoneValid: true,
      emailValid: true,
      nameValid: true,
      showHeader: false,
      useHeaderToolbar: false,
      extraPayload: {},
      relogin: false,
      autoFocus: false
    }
  },

  computed: {
    ...mapGetters({
      showFatalError: REGISTER_ERROR,
      loading: REGISTER_LOADING
    })
  },

  created () {
    window.addEventListener('message', e => {
      if (e.data.event === '_onScriptLoad') {
        this.name = e.data.payload.name || this.name
        this.email = e.data.payload.email || this.email
        this.phone = e.data.payload.phone || this.phone
        this.useHeaderToolbar = e.data.payload.useHeaderToolbar || false
        this.autoFocus = e.data.payload.autoFocus || false
        this.extraPayload = e.data.payload.extra || {}
        // this.extraPayload = {email: 'sea930320@hotmail.com', origem: 'Mktplace', codProd: 1096, product: 'testProduct', storeName: 'xxx'}
      }
    })

    if (this.$route.query.relogin) {
      this.$store.commit(AUTO_RELOGIN, { fromRegister: true })
    }
  },

  mounted () {
    this.$nextTick(() => {
      if (!this.relogin && this.autoFocus) {
        this.$refs.nameText.focus()
      }

      this.$store.commit(ERASE_MESSAGE)
    })
  },

  methods: {
    sendInformation () {
      if (!this.validate()) return

      const name = this.name
      const phone = this.phone
      const currentStore = persistence.getCurrentStore()
      const extra = this.extraPayload

      let information = {
        name,
        phone,
        payload: {
          name,
          phone,
          currentStore,
          extra
        }
      }

      this.$store
        .commit(LOGIN, information)
    },

    validate () {
      let valid = true

      if (this.name.length === 0) {
        this.nameValid = false
        valid = false
      }

      if (this.phone.length < 10) {
        this.phoneValid = false
        valid = false
      }

      this.valid = valid
      return valid
    },

    closeHeader () {
      if (window.parent && window.parent !== window.self) {
        window.parent.postMessage({ event: 'onMoveleirosPluginClose' }, '*')
      }
    },

    dismissAlert () {
      this.$store.commit(REGISTER_DISMISS_ERROR)
    }
  }
}
</script>

<style lang="stylus" scoped>
@import '../styles/_vars'

$container-size = 330px
$header-background = #d9d9d9
$default-grey-scale = #777

.ui-alert
  margin-bottom 0px

.ui-alert__icon
  align-self center !important

.main
  display flex
  flex 1
  align-items center
  font-family TitilliumRegular, Helvetica, Arial, sans-serif
  font-weight 400

  .center-box
    max-width 100%
    width 100%
    min-height 285px
    display flex
    flex 1
    padding $default-padding*2 $default-padding*2 $default-padding
    justify-content space-between

    .fields
      padding-left 5px
      padding-right 5px
      .form-field
        margin-top 20px
        display flex
        flex-direction column
        span
          color red
          font-size .8em
          margin-top 2px
        input
          margin-top 5px
          padding 5px
          &[invalid="true"]
            border 1px solid red

      .send-button
        font-family TitilliumRegular, Helvetica, Arial, sans-serif
        font-weight 400
        font-size 1.1em
        align-self center
        background #e9e9e9
        border 1px solid $default-grey-scale
        padding 10px 15px
        width 150px
        cursor pointer
        margin-top 40px
        transition-duration $default-duration
        &:hover
          background lighten($default-grey-scale, 20)

  &.with-toolbar
    align-items stretch
    justify-content flex-start

    .center-box
      align-self center

  .logo
    display flex
    align-items center
    justify-content center
    margin-bottom 0px

    img
      width 100%
      height 20px

.main
  background #e9e9e9
  min-height 480px
  min-width 320px

  .header
    background $header-background
    height 100px
    display flex
    justify-content flex-end
    align-items center
    width 100%
    top 0

    .header-box
      width 100%
      display flex
      flex 1
      padding 1em $default-padding*2 .5em

      .header-text
        flex-direction column
        align-items center
        justify-content space-between
        display flex
        flex 1

      .icon-box
        display none
        justify-content center

        svg
          width 50px
          fill darken($default-grey-scale, 30)

      .title
        font-size 1.2em
        background-color $header-background
        position relative
        padding-top 5px
        padding-bottom 5px
        span
          z-index 1000

      .call
        text-transform uppercase
        display flex
        align-items center
        .call-bold
          font-weight 600
          font-size 1.5em
        .call-bold-divider
          font-weight 600
          font-size 1.5em
          line-height 1px
          width 20px
          height 13px
          display flex
          justify-content center

@media (min-width: $container-size + 20)
  .main
    .center-box
      max-width $container-size
      width $container-size
      .fields
        padding-left 0px
        padding-right 0px

    .header
      .header-box
        width $container-size
        .header-text
          align-items flex-end
        .icon-box
          display flex

@media (min-width: 768px)
  .main
    min-height 480px
    max-width 580px
    max-height 700px
    align-self center
    justify-self center

@media (max-width: 320px)
  .main
    .center-box
      padding 30px 0 15px
    .header
      .header-box
        padding-right 0
        padding-left 0
</style>
