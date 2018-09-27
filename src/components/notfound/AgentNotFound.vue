<template>
  <div class="main vbox">
    <header-toolbar :grey="true" :before-close="closeHeader">
      <span class="header-message">
      {{firstname()}}, no momento não existem agentes online. Deixe sua dúvida que entraremos em contato o mais rápido possível.
      </span>
    </header-toolbar>

    <div class="center-box vbox">
      
      <div class="fields">

        <div class="form-field">
          <label for="Obs">Deixe sua dúvida aqui:</label>
          <textarea name="Obs" cols="30" rows="10" 
            v-model="mensagem"
            :disabled="loading"></textarea>
        </div>

        <div class="form-field">
          <button
            class="send-button"
            :size="'normal'" 
            @click="sendInformation"
            :disabled="loading"
            >
              {{this.loading ? "Enviando..." : "Enviar"}}
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
import HeaderToolbar from '@/components/livechat/HeaderToolbar'
import { SEND_QUESTION, USER_DATA, LOGOUT_REDIRECT_TO_REGISTER, LOADING_SEND_FORM } from '@/store'
import { mapGetters } from 'vuex'

export default {
  components: { HeaderToolbar },

  data () {
    return {
      useHeaderToolbar: false,
      mensagem: '',
      firstname: () => {
        return this.userData['name'].length === 0 ? 'Olá' : this.userData['name']
      }
    }
  },

  computed: {
    ...mapGetters({
      userData: USER_DATA,
      loading: LOADING_SEND_FORM
    })
  },

  mounted () {
    if (window.parent && window.parent !== window.self) {
      this.useHeaderToolbar = true
    }
  },

  methods: {
    closeHeader () {
      if (window.parent && window.parent !== window.self) {
        window.parent.postMessage({ event: 'onMoveleirosPluginClose' }, '*')
      }

      this.$store.commit(LOGOUT_REDIRECT_TO_REGISTER)
    },

    sendInformation () {
      this.$store.commit(SEND_QUESTION, this.mensagem)
    }
  }
}
</script>

<style lang="stylus" scoped>
@import '../styles/_vars'

$container-size = 390px
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
  min-height 530px
  min-width 320px

  .center-box
    max-width $container-size
    width $container-size
    min-height 285px
    display flex
    flex 1
    padding $default-padding $default-padding*2 $default-padding
    justify-content space-between

    .form-field
      margin-top 12px
      display flex
      flex-direction column
      span
        color red
        font-size .8em
        margin-top 2px
      textarea
        margin-top 5px
        padding 5px
        resize none
        font-family inherit
        font-size inherit
        &[invalid="true"]
          border 1px solid red

      .send-button
        font-family 'Roboto Condensed', TitilliumRegular, Helvetica, Arial, sans-serif
        font-weight 400
        font-size 1.1em
        align-self center
        background #e9e9e9
        border 1px solid $default-grey-scale
        padding 10px 15px
        width 150px
        cursor pointer
        margin-top 20px
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

  .header
    background $header-background
    padding 2px 15px
    display flex
    justify-content flex-end
    align-items center
    width 100%
    top 0

.header-message
  font-size 1.2em
  padding-right 10px

@media (min-width: 768px)
  .main
    max-width 580px
    max-height 700px
    align-self center
    justify-self center

@media (max-width: 425px)
  .main
    .center-box
      width 100%
      padding 30px 30px 15px

@media (max-width: 320px)
  .main
    .center-box
      width 100%
    .header
      .header-box
        padding-right 0
        padding-left 0
</style>
