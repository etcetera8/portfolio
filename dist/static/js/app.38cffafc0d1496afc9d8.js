webpackJsonp([1],{"0T2I":function(t,e,a){t.exports=a.p+"static/img/koglock.7df90c8.png"},"4JBm":function(t,e){},"6A3X":function(t,e){},"8S+q":function(t,e,a){t.exports=a.p+"static/img/drapac.93acce1.png"},"D/eh":function(t,e,a){t.exports=a.p+"static/img/weatherly.5ed97c8.png"},DMMF:function(t,e){},"GxB+":function(t,e,a){t.exports=a.p+"static/img/movie.d800cb2.png"},N8CE:function(t,e,a){t.exports=a.p+"static/img/swapibox.dc81896.png"},NHnr:function(t,e,a){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var i=a("7+uW"),s=a("/ocq"),o={render:function(){var t=this,e=t.$createElement,a=t._self._c||e;return a("header",{staticClass:"ui huge header"},[t._m(0),t._v(" "),a("nav",[a("router-link",{attrs:{to:"/",exact:""}},[a("button",{staticClass:"ui button about"},[t._v("ABOUT")])]),t._v(" "),a("router-link",{attrs:{to:"/projects"}},[a("button",{staticClass:"ui button projects"},[t._v("PROJECTS")])]),t._v(" "),a("router-link",{attrs:{to:"/waka"}},[a("button",{staticClass:"ui button waka"},[t._v("WAKA")])]),t._v(" "),a("router-link",{attrs:{to:"/resume"}},[a("button",{staticClass:"ui button resume"},[t._v("RESUME")])])],1)])},staticRenderFns:[function(){var t=this.$createElement,e=this._self._c||t;return e("div",{staticClass:"title-wrapper"},[e("h1",{attrs:{id:"name"}},[this._v("Parker Lindley")]),this._v(" "),e("h4",{staticClass:"subtitle role"},[this._v("Front-End Developer ")]),this._v(" "),e("h5",{staticClass:"subtitle contact"},[this._v("parker.t.lindley@gmail.com")])])}]};var r={name:"App",components:{Header:a("VU/8")({name:"HelloWorld",data:function(){return{msg:"Welcome to Your Vue.js App"}}},o,!1,function(t){a("4JBm")},"data-v-f328cb66",null).exports}},n={render:function(){var t=this.$createElement,e=this._self._c||t;return e("div",{attrs:{id:"app"}},[e("Header"),this._v(" "),e("transition",{attrs:{name:"bounce","enter-active-class":"slideInLeft","leave-active-class":"slideOutRight"}},[e("router-view")],1)],1)},staticRenderFns:[]};var c=a("VU/8")(r,n,!1,function(t){a("xuhk")},null,null).exports,l={render:function(){this.$createElement;this._self._c;return this._m(0)},staticRenderFns:[function(){var t=this,e=t.$createElement,a=t._self._c||e;return a("div",{staticClass:"main-wrapper"},[a("div",{staticClass:"wrapper"},[a("section",{staticClass:"image"}),t._v(" "),a("section",{staticClass:"about"},[a("h2",{staticClass:"hi"},[t._v("Hi,")]),t._v(" "),a("p",{staticClass:"hi"},[t._v("I am an energetic front-end developer with a passion for learning and a drive for creating beautiful, functional and accessible apps. I have developed numerous web and mobile apps and have a background in cartography and GIS.")]),t._v(" "),a("p",{staticClass:"hi"},[t._v("Most of my free time is spent maintaining my stable of bikes, training for racing or working on toy projects. Personal favorite way to start a day? Kick my own ass up and down a mountain, followed by a burrito and then spending the rest of the day creating fun projects in a food coma.")]),t._v(" "),a("p",{staticClass:"hi"},[t._v("Feel free to contact me about any of my work, what I'm working on or mountain biking in Colorado or North Carolina. ")])])]),t._v(" "),a("section",{staticClass:"social"},[a("a",{attrs:{href:"www.linkedin.com/in/parker-lindley"}},[a("article",{staticClass:"icon linkedin"})]),t._v(" "),a("a",{attrs:{href:"https://twitter.com/pshark8"}},[a("article",{staticClass:"icon twitter"})]),t._v(" "),a("a",{attrs:{href:"https://github.com/etcetera8"}},[a("article",{staticClass:"icon github"})]),t._v(" "),a("article",{staticClass:"icon email"})])])}]};var h=a("VU/8")({},l,!1,function(t){a("q/G6")},null,null).exports,p=a("0T2I"),u=a.n(p),d=a("S3PH"),m=a.n(d),g=a("b6cA"),f=a.n(g),v=a("N8CE"),w=a.n(v),b=a("D/eh"),y=a.n(b),k=a("n3Id"),_=a.n(k),C=a("GxB+"),j=a.n(C),x=a("8S+q"),T=a.n(x),I=a("yUDE"),E=a.n(I),A={data:function(){return{message:"hi",show:!0,projects:[{id:1,title:"Kog Locker",description:"Kog Locker is a cycling oriented social and personal motivation application. It's built using React, Router, Redux and uses an express backend to handle the user authentication and api calls to the Strava api. The app features 'gamification' with hand rolled badges, targeting of your number one segment and visualize it with the Google maps api, relevant and most interesting statistics, and lazy loading of images you've taken through various activities.",production:"https://kog-lockr.herokuapp.com/",github:"https://github.com/etcetera8/kog-locker",image:u.a},{id:2,title:"Palette Picker",description:"A postgresql/Node/Express backend with jQuery front-end mimicking the functionality of Coolers or other palette generators. The user is able to create new projects and store unlimited palettes within those projects. ",production:"https://parkerspalettepicker.herokuapp.com/",github:"https://github.com/etcetera8/pallete-picker",image:m.a},{id:3,title:"HEADCOUNT",description:"This react app takes in kindergarten attendance rates for all Colorado school districts. The user is able to live search for any district they wish to find with the results narrowing down as they type. As soon as two districts are selected a comparison card appears that shows the users the ratio of attendance rates between the two. The user can also toggle selection by clicking again on any card or clearing out the entire comparison container. The project is unit and integration tested with Jest and Enzyme.",production:"http://headcount2.surge.sh/",github:"https://github.com/etcetera8/headcount2.0",image:f.a},{id:4,title:"SWAPI-BOX",description:"I created this project using the Star Wars API, React, asynchronus JS, and a full testing suite with Jest and Enzyme. When the user first visits the site they are immediately greeted with scrolling text from one of the Star Wars movies. As the user clicks on one of the three categories, people, planets, or vehicles, another fetch call is made and they are shown 10 of that category. Users have the ability to favorite cards. When they visits the favorites tab they are able to see all of their favorited cards where they can defavorite them if wanted. I also used local storage to store the initial fetch calls so on returning fetch calls would not need to be used again.",production:"http://swapi-box.surge.sh/",github:"https://github.com/etcetera8/swapi-box",image:w.a},{id:5,title:"Weatherly",description:"A React weather app utiling asynchronous JavaScript and tested with Jest and Enzyme. This was a pair project where we set out with the goal to create a weather app that stood out from what most people are familiar with. We created a very simplistic UI with loading indication for improved UX. The user is able to search cities with a prefix trie npm package that I developed. The app utilizes local storage so the user is only prompted once for their location and do not have to visit the welcome screen again.",production:"http://weatherly.surge.sh/",github:"https://github.com/etcetera8/weatherly",image:y.a},{id:6,title:"Trail Finder",description:"One of the first websites I ever created using Vanilla JS and the MTB Project api. I had just moved to Colorado and was overwhelmed with choices in trails to ride near my house. I essentially created a tool that I could filter trails down based on difficulty and distance from my current position. Its how I found my go to 'after work' ride at White Rance Park. One day I would like to revisit this project with Vue or React.",production:"https://etcetera8.github.io/brapBrapProject/",github:"https://github.com/etcetera8/brapBrapProject",image:_.a},{id:7,title:"Movie Tracker",description:"A React, Router, Redux, Node/Express, Postrgresql project. The user has the ability to either sign-up or sign in to their account. Once signed in the app allows the user to find information on recent movie releases, ratings, and save them as favorites. The data is persisted throught the postgresql backend.",production:"https://github.com/etcetera8/movie-tracker",github:"https://github.com/etcetera8/movie-tracker",image:j.a},{id:8,title:"Cycling Team - Static Comp",description:"This was a static comp challenge where I was given a static comp to recreate with my own theme. The project is fully responsive and I ended up having a really good time creating the spec.",production:"https://etcetera8.github.io/pl-comp-challenge-2/",github:"https://github.com/etcetera8/pl-comp-challenge-2",image:T.a},{id:9,title:"Joust",description:"I set out to recreate my favorite arcade game of all time. This project is pure Vanilla JS with extensive use of OOP. All physics and collision detection were written from scratch. The game is two playe so grab a friend and getter ready to Joust! jk",production:"http://joust-clone.surge.sh/",github:"https://github.com/etcetera8/game-time",image:E.a}]}},methods:{previous:function(){var t=this,e=this.projects.pop();this.projects=[e].concat(this.projects),this.show=!this.show,setTimeout(function(){return t.show=!t.show},400)}}},R={render:function(){var t=this,e=t.$createElement,a=t._self._c||e;return a("div",{staticClass:"projects-wrapper"},[a("button",{staticClass:"carousel-button",on:{click:t.previous}},[t._v("NEXT")]),t._v(" "),a("transition-group",{staticClass:"carousel",attrs:{name:"slide",tag:"div"}},t._l(t.projects,function(e){return t.show?a("section",{key:e.id,staticClass:"project-display"},[a("article",{key:e.id,staticClass:"project-card"},[a("div",{staticClass:"project-image",style:{"background-image":"url("+e.image+")"}}),t._v(" "),a("h2",{staticClass:"project-details"},[t._v(t._s(e.title))]),t._v(" "),a("p",{staticClass:"project-details paragraph"},[t._v(t._s(e.description))]),t._v(" "),a("div",{staticClass:"btn-wrapper"},[a("a",{staticClass:"project-details link",attrs:{href:"project.production"}},[t._v("Live Page")]),t._v(" "),a("a",{staticClass:"project-details link",attrs:{href:"project.github"}},[t._v("GitHub")])])])]):t._e()}))],1)},staticRenderFns:[]};var J=a("VU/8")(A,R,!1,function(t){a("DMMF")},"data-v-ee847446",null).exports,P={render:function(){this.$createElement;this._self._c;return this._m(0)},staticRenderFns:[function(){var t=this.$createElement,e=this._self._c||t;return e("div",{staticClass:"resume-wrapper"},[e("div",{staticClass:"resume"})])}]};var S=a("VU/8")(null,P,!1,function(t){a("xJMD")},null,null).exports,U=a("Gu7T"),W=a.n(U),F={created:function(){this.getJson()},data:function(){return{langs:[]}},methods:{getJson:function(){$.ajax({type:"GET",url:"https://wakatime.com/share/@2c90c59e-1b11-4af6-850f-8ba65cdc1447/2898024a-aac7-4588-9473-2488ffd6ed2d.json",dataType:"jsonp",success:function(t){this.langs=[].concat(W()(t.data))}})}}},M={render:function(){this.$createElement;this._self._c;return this._m(0)},staticRenderFns:[function(){var t=this.$createElement,e=this._self._c||t;return e("div",{staticClass:"waka-wrapper"},[e("section",{staticClass:"waka-display"},[e("figure",[e("embed",{attrs:{src:"https://wakatime.com/share/@2c90c59e-1b11-4af6-850f-8ba65cdc1447/defbbcf9-7cf7-4366-afa1-11539692078f.svg"}})])]),this._v(" "),e("section",{staticClass:"waka-description"},[e("p",{staticClass:"hi"},[this._v("This is a breakdown of the languagues I'm using the most at this moment although I'm always more than willing to dive into some new languages or frameworks and see what I can make happen.")])])])}]};var O=a("VU/8")(F,M,!1,function(t){a("ckKw")},null,null).exports;a("6A3X"),i.a.config.productionTip=!1,i.a.use(s.a);var D=[{path:"/",component:h},{path:"/projects",component:J},{path:"/resume",component:S},{path:"/waka",component:O}],H=new s.a({routes:D,mode:"history"});new i.a({el:"#app",router:H,components:{App:c},template:"<App/>"})},S3PH:function(t,e,a){t.exports=a.p+"static/img/palette-pick2.526eb96.png"},b6cA:function(t,e,a){t.exports=a.p+"static/img/headcount.0603e6a.png"},ckKw:function(t,e){},n3Id:function(t,e,a){t.exports=a.p+"static/img/trail.5d080be.png"},"q/G6":function(t,e){},xJMD:function(t,e){},xuhk:function(t,e){},yUDE:function(t,e,a){t.exports=a.p+"static/img/joust.5979006.png"}},["NHnr"]);
//# sourceMappingURL=app.38cffafc0d1496afc9d8.js.map