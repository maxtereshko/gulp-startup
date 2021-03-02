// VARIABLES & PATHS

let preprocessor = "scss",
  fileswatch = "html,htm,txt,json,md,woff2",
  imageswatch = "jpg,jpeg,png,webp,svg",
  baseDir = "app",
  online = false

let paths = {
  scripts: {
    src: [
      // 'node_modules/jquery/dist/jquery.min.js', // npm vendor example (npm i --save-dev jquery)
      baseDir + "/js/app.js"
    ],
    dest: baseDir + "/js"
  },

  styles: {
    src: baseDir + "/scss/main.*",
    dest: baseDir + "/css"
  },

  images: {
    src: baseDir + "/images/src/**/*",
    dest: baseDir + "/images/dest"
  },
  cssOutputName: "app.min.css",
  jsOutputName: "app.min.js"
}

const { src, dest, parallel, series, watch } = require("gulp")
const scss = require("gulp-sass")
const cleancss = require("gulp-clean-css")
const concat = require("gulp-concat")
const browserSync = require("browser-sync").create()
const uglify = require("gulp-uglify-es").default
const autoprefixer = require("gulp-autoprefixer")
const imagemin = require("gulp-imagemin")
const newer = require("gulp-newer")
const rsync = require("gulp-rsync")
const del = require("del")

function browsersync() {
  browserSync.init({
    server: { baseDir: baseDir + "/" },
    notify: false,
    online: online
  })
}

function scripts() {
  return src(paths.scripts.src)
    .pipe(concat(paths.jsOutputName))
    .pipe(uglify())
    .pipe(dest(paths.scripts.dest))
    .pipe(browserSync.stream())
}

function styles() {
  return src(paths.styles.src)
    .pipe(eval(preprocessor)())
    .pipe(concat(paths.cssOutputName))
    .pipe(
      autoprefixer({ overrideBrowserslist: ["last 10 versions"], grid: true })
    )
    .pipe(
      cleancss({
        level: { 1: { specialComments: 0 } } /* format: 'beautify' */
      })
    )
    .pipe(dest(paths.styles.dest))
    .pipe(browserSync.stream())
}

function images() {
  return src(paths.images.src)
    .pipe(newer(paths.images.dest))
    .pipe(imagemin())
    .pipe(dest(paths.images.dest))
}

function cleanimg() {
  return del("" + paths.images.dest + "/**/*", { force: true })
}

function deploy() {
  return src(baseDir + "/").pipe(
    rsync({
      root: baseDir + "/",
      hostname: paths.deploy.hostname,
      destination: paths.deploy.destination,
      include: paths.deploy.include,
      exclude: paths.deploy.exclude,
      recursive: true,
      archive: true,
      silent: false,
      compress: true
    })
  )
}

function startwatch() {
  watch(baseDir + "/scss/**/*", { usePolling: true }, styles)
  watch(
    baseDir + "/images/src/**/*.{" + imageswatch + "}",
    { usePolling: true },
    images
  )
  watch(baseDir + "/**/*.{" + fileswatch + "}", { usePolling: true }).on(
    "change",
    browserSync.reload
  )
  watch(
    [baseDir + "/js/**/*.js", "!" + paths.scripts.dest + "/*.min.js"],
    { usePolling: true },
    scripts
  )
}

exports.browsersync = browsersync
exports.assets = series(cleanimg, styles, scripts, images)
exports.styles = styles
exports.scripts = scripts
exports.images = images
exports.cleanimg = cleanimg
exports.deploy = deploy
exports.default = parallel(images, styles, scripts, browsersync, startwatch)
