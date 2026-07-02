/**common node */
import path from "node:path";

import browserSyncLyb from "browser-sync";
import { src, dest, watch, parallel, series } from "gulp";
import concat from "gulp-concat";
import rename from "gulp-rename";
import changed from "gulp-changed";
import gulpIf from "gulp-if";
import sourcemaps from "gulp-sourcemaps";
import chalk from "chalk";
import { deleteAsync } from "del";

/**scripts */
import babel from "gulp-babel";
import terser from "gulp-terser";

/**html */
import htmlmin from "gulp-html-minifier-terser";
/** styles */
import * as dartSass from "sass";
import gulpSass from "gulp-sass";
import autoprefixer from "gulp-autoprefixer";
import cleanCss from "gulp-clean-css";

/**images */
import imagemin, {mozjpeg, optipng, svgo} from "gulp-imagemin"

const sass = gulpSass(dartSass);
const server = browserSyncLyb.create("henrik-website");
const PORT = 9000;
const isProd = process.env.NODE_ENV === "production";

const paths = {
  scripts: {
    src: "src/scripts/**/*.{js,mjs,cjs}",
    dest: "build/scripts/",
  },
  html: {
    src: "src/index.html",
    dest: "build/",
  },
  styles: {
    src: "src/scss/main.scss",
    watch: "src/scss/**/*.scss",
    dest: "build/styles/",
  },
  images: {
    src: "src/images/**/*.{jpeg,svg,jpg,png}",
    dest: "build/images/"
  },
  fonts: {
    src: "src/fonts/*",
    dest: "build/fonts",
  },
};

function serve() {
  server.init(
    {
      server: {
        baseDir: path.resolve(process.cwd(), "./build"),
      },
      port: PORT,
      open: false,
      logLevel: "info",
      logPrefix: chalk.red.bold("henrik".toUpperCase()),
      notify: false
    },
    () => {
      console.log(
        chalk.blue.bold(`\nСервер разработки успешно запущен на порту: ${PORT}`)
      );
    }
  );
  watch(paths.scripts.src, scripts);
  watch(paths.html.src, html);
  watch(paths.styles.watch, styles);
  watch(paths.images.src, images);
  watch(paths.fonts.src, copyFonts);
}

function scripts() {
  return src(paths.scripts.src)
    .pipe(gulpIf(!isProd, sourcemaps.init()))
    .pipe(
      babel({
        presets: ["@babel/preset-env"],
        plugins: ["@babel/plugin-transform-arrow-functions"],
      })
    )
    .pipe(concat("all.js"))
    .pipe(terser({ keep_classnames: true, keep_fnames: true }))
    .pipe(rename({ suffix: ".min" }))
    .pipe(gulpIf(!isProd, sourcemaps.write(".")))
    .pipe(dest(paths.scripts.dest))
    .pipe(server.stream());
}

function html() {
  return src(paths.html.src)
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(dest(paths.html.dest))
    .pipe(server.stream());
}

function styles() {
  return src(paths.styles.src)
    .pipe(changed(paths.styles.dest))
    .pipe(gulpIf(!isProd, sourcemaps.init()))
    .pipe(sass().on("error", sass.logError))
    .pipe(rename({suffix: ".min"}))
    .pipe(gulpIf(isProd, autoprefixer()))
    .pipe(gulpIf(isProd, cleanCss({ level: 2 })))
    .pipe(gulpIf(!isProd, sourcemaps.write(".")))
    
    .pipe(dest(paths.styles.dest))
    .pipe(server.stream());
}




export function images() {
  return src(paths.images.src, { encoding: false })
    .pipe(changed(paths.images.dest))
    .pipe(
      gulpIf(
        isProd,
        imagemin([
          mozjpeg({ quality: 60, progressive: true }),
          optipng({
            optimizationLevel: 5,
          }),
          svgo({
            plugins: [{ name: "removeViewBox", active: false }],
          }),
        ])
      )
    )
    .pipe(dest(paths.images.dest))
    .pipe(server.stream());
}

function cleanBuild() {
  return deleteAsync(["build/**", "!build/"]);
}

function copyFonts() {
  return src(paths.fonts.src, { encoding: false })
    .pipe(changed(paths.fonts.dest))
    .pipe(dest(paths.fonts.dest))
    .pipe(server.stream());
}

export const build = series(
  cleanBuild,
  parallel(html, styles, scripts, images, copyFonts)
);
export default series(
  cleanBuild,
  parallel(html, styles, scripts, copyFonts, images, serve)
);
