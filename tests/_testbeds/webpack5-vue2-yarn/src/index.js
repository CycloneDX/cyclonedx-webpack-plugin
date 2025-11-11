import Vue from 'vue'

const app = new Vue({
  data: {},
  methods: {}
})

document.addEventListener(
  'DOMContentLoaded',
  function () {
    app.$mount('#app')
  },
  false
)
