// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import VueRouter from 'vue-router'
import App from './App'
import Home from './components/Home/Home.vue'
import Projects from './components/Projects/Projects.vue'
import Resume from './components/Resume/Resume.vue'
import Waka from './components/Waka/Waka.vue'
import VueResize from 'vue-resize'

require('vue2-animate/dist/vue2-animate.min.css')

Vue.config.productionTip = false

Vue.use(VueRouter)
Vue.use(VueResize)

const routes = [
  { path: '/', component: Home },
  { path: '/projects', component: Projects },
  { path: '/resume', component: Resume },
  { path: '/waka', component: Waka }
]

const router = new VueRouter({
  routes,
  mode: 'history'
})
/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  components: { App },
  template: '<App/>'
})
