<template>
  <div class="projects-wrapper">
    <button class='carousel-button' @click="previous">
      VIEW NEXT
    </button>
    <div class="indicator">
      <span
        class="dot"
        v-for="(number, index) in projectMatches"
        :key="index"
        :data="number"
        v-bind:class="getClass(index)"
      ></span>
    </div>
    <transition-group class="carousel" name="slide" tag="div">
      <section v-if="show" class="project-display" v-for="project in projects" v-bind:key="project.id">
        <ProjectCard
          :key="project.id"
          v-bind:project="project"
        />
      </section>
    </transition-group>
  </div>
</template>

<script>
import { projects } from '../../../projects'
import ProjectCard from '../ProjectCard/ProjectCard.vue'

export default {

  components: {
    'ProjectCard': ProjectCard
  },

  data () {
    return {
      show: true,
      projects: projects,
      projectMatches: this.numProjects(projects),
      current: projects[0]
    }
  },

  methods: {
    previous () {
      const last = this.projects.pop()
      this.current = last
      this.projects = [last].concat(this.projects)
      this.show = !this.show
      setTimeout(() => this.show = !this.show, 400)
    },

    getClass (id) {
      return id === this.current.id ? 'active' : ''
    },

    numProjects (projects) {
      return projects.map((project, index) => {
        return index - 1
      })
    }
  }
}
</script>

<style scoped>

  .carousel-button {
    display: flex;
    align-self: unset;
    justify-content: center;
    flex-basis: 100%;
    margin-top: 30px;
    border: 1px solid #1B998B;
    cursor: pointer;
    width: 100px;
    font-size: 1em;
    color: #1B998B;
    padding: 15px 0;
    padding-bottom: 30px;
    background: none;
    transition: border-color .2s, color .2s, background .3s;
  }

  .carousel-button:hover {
    border-color: #383d3b;
    color: #383d3b;
  }

  .chevron {
    height: 7%;
    width: 12%;
  }

  .indicator {
    display: flex;
    justify-content: space-around;
    width: 60%;
    height: 125px;
    margin-top: 40px;
  }

  .dot {
    border: 7px solid lightgray;
    border-radius: 50%;
  }

  .active {
    border: 9px solid #1B998B;
    position: relative;
    top: -3px;
  }

  .slide-leave-active,
  .slide-enter-active {
    transition: 1s;
  }
  .slide-enter {
    transform: translate(100%, 0);
  }
  .slide-leave-to {
    transform: translate(-100%, 0);
  }

  .projects-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    border: 1px solid lightgray;
    margin: 25px;
    overflow: hidden;
    min-height: 711px;
    max-height: 800px;
    background: #fff;
  }

  .project-display {
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    margin-bottom: 25px;
  }

  .btn-wrapper {
    bottom: 0;
    margin-bottom: 25px;
  }

  @media screen and (max-width: 850px)  {
    .projects-wrapper {
      height: 800px;
    }
  }

  @media screen and (max-width: 490px)  {
    .projects-wrapper {
      height: 780px;
      margin: 0;
    }
  }

  @media screen and (max-width: 400px)  {
    .projects-wrapper {
      height: 780px;
    }
  }

</style>
