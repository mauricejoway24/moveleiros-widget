<template>
  <div class="iframe-root">
    <iframe :src="url" class="iframe"><p>Sem suporte para iframe.</p></iframe>
  </div>
</template>

<script>
import { FORWARD_URL } from '@/store'
import { mapGetters } from 'vuex'

export default {
  computed: {
    ...mapGetters({
      url: FORWARD_URL
    })
  },

  mounted () {
    if (this.url.length === 0) {
      this.$router.push('/agent')
    }
  }
}
</script>

<style lang="stylus" scoped>
.iframe-root
  display flex
  flex 1

  .iframe
    flex 1
    border none
    background white
</style>
