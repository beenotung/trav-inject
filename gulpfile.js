// reference [babel] : https://babeljs.io/docs/setup/#installation
// reference [gulp] : https://github.com/gulpjs/gulp/blob/master/docs/API.md
// reference [watchify, browserify] : https://gist.github.com/danharper/3ca2273125f500429945
// .. https://github.com/mpj/fpjs8.git
// .. http://stackoverflow.com/questions/31708318/gulp-doesnt-exit-with-watchify-browserify
// refernece [filesize] : http://stackoverflow.com/questions/21806925/get-the-current-file-name-in-gulp-src

const
  gulp = require('gulp')
  , gutil = require('gulp-util')
  , clean = require('gulp-clean')
  , filesize = require('gulp-filesize')
  , sourcemaps = require('gulp-sourcemaps')
  // , babel = require('gulp-babel')
  , concat = require('gulp-concat')
  , ts = require('gulp-typescript')
  , merge = require('merge2')
  , sass = require('gulp-sass')
  // , minifyCss = require('gulp-minify-css')
  , cleanCSS = require('gulp-clean-css')
  // , uglify = require('gulp-uglify')
  , rename = require('gulp-rename')
  , replace = require('gulp-replace')
  , webserver = require('gulp-webserver')
  , browserify = require('browserify')
  // , tsify = require('tsify')
  , source = require('vinyl-source-stream')
  , buffer = require('vinyl-buffer')
  , runSequence = require('run-sequence')
  , dirSync = require('gulp-directory-sync')
  , watchify = require('watchify')
  , fs = require('fs')
  , babelify = require('babelify')
  // , watch = require('gulp-watch')
  // , livereload = require('gulp-livereload')
  , assign = require('lodash.assign')
  ;

const paths = {
  html: ['index.html']
  , sass: ['src/**/*.scss', 'src/**/*.css']
  , script: ['src/*.ts', 'src/**/*.ts', 'src/*.js', 'src/**/*.js']
  , distDir: 'dist'
  , distFile: ['dist/*']
  , buildFile: ['build/**/*.js']
  , srcFile: ['index.html', 'src/**/*.*']
  , mainTs: "src/main.ts"
  , mainJs: 'build/src/main.js'
  , buildDir: 'build'
  , buildSrcDir: 'build/src'
  , jsOutDir: 'dist'
  , jsOutFile: 'dist/bundle.js'
  , jsOutFilename: 'bundle.js'
  , jsOutMinifyFilename: 'bundle.min.js'
  , libSrcDir: 'lib'
};

/* ---- sub tasks (internal) ---- */

gulp.task('html', ()=> {
  gulp.src(paths.html)
    .pipe(replace(/dist\//g, ''))
    .pipe(gulp.dest(paths.distDir))
});

gulp.task('sass', done=> {
  gulp.src(paths.sass)
    .pipe(sourcemaps.init())
    .pipe(filesize()) // raw file
    .pipe(concat('bundle.scss'))
    .pipe(sass({
      errLogToConsole: true
    }))
    // .pipe(filesize()) // sass output
    // .pipe(minifyCss({keepSpecialComments: 0}))
    .pipe(cleanCSS({compatibility: 'ie8'}))
    .pipe(rename({
      extname: '.min.css'
    }))
    // .pipe(filesize()) // minifyCss output
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(paths.distDir))
});

gulp.task('tsc', ()=> {
  let tsProject = ts.createProject('tsconfig.json');
  var tsResult = tsProject.src()
    .pipe(ts(tsProject));
  return tsResult.js
    .pipe(gulp.dest(paths.buildSrcDir));
});

gulp.task('sync-lib', function () {
  let source_dir = paths.libSrcDir;
  const sync = dest_dir=> {
    return gulp.src('')
      .pipe(dirSync(source_dir, dest_dir, {printSummary: true}))
      .on('error', gutil.log)
  };
  return merge([
    sync(paths.buildDir + '/' + paths.libSrcDir)
    , sync(paths.distDir + '/' + paths.libSrcDir)
  ])
});

function bundlerFunc() {
  let customOpts = {
    debug: true //inline sourcemap
  };
  let opts = assign({}, watchify.args, customOpts);
  return browserify(opts)
    .transform(babelify.configure({
      // experimental: true,
      presets: [
        "es2015"
      ]
    }))
    .add(paths.mainJs)
    .on('log', gutil.log)
    .on('error', function (err) {
      fs.createWriteStream(paths.jsOutFile)
        .write(
          'var errStr = "COMPILATION ERROR! ' + err.message + '";' +
          'console.warn(errStr); document.write(errStr)');
      console.warn('Error :', err.message);
      this.emit('end')
    })
}
let watcher = watchify(bundlerFunc());
function bundle(pkg) {
  return pkg.bundle()
    .pipe(source(paths.mainJs))
    .pipe(buffer())
    .pipe(sourcemaps.init({
      loadMaps: true
    }))
    .pipe(rename(paths.jsOutFilename))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(paths.distDir))
}

/* babel (ES6 to ES5) t + browserify */
gulp.task('babel-browser', bundle.bind(null, bundlerFunc()));

function runServer(done, host, port) {
  return gulp.src(paths.distDir)
    .pipe(webserver({
      livereload: true
      , host: host
      , port: port
      , directoryListing: {
        enable: false,
        path: paths.distDir
      }
      , open: true
      // , path: paths.distDir + '/'
      // , fallback: 'index.html'
    }))
  // .on('end', done)
}

gulp.task('run-dev', done=>runServer(done, 'localhost', 8080));
gulp.task('run-publish', done=>runServer(done, '0.0.0.0', 8080));

gulp.task('watch-html', ()=> {
  gulp.watch(paths.html, ['html'])
});
gulp.task('watch-sass', ()=> {
  gulp.watch(paths.sass, ['sass'])
});
gulp.task('watch-script', ()=> {
  gulp.watch(paths.script, ['script'])
});

/* ---- chained tasks (internal) ---- */

gulp.task('script', ()=> {
  runSequence('tsc', 'sync-lib', 'babel-browser')
});

gulp.task('watch', ['watch-html', 'watch-sass', 'watch-script']);

/* ---- main tasks (external) ---- */

gulp.task('clean', ()=> {
  let src = [
    , paths.buildDir + '/*'
    , paths.distDir + '/*'
    , '!' + paths.buildDir + '/' + paths.libSrcDir
    , '!' + paths.distDir + '/' + paths.libSrcDir
  ];
  return gulp.src(src, {read: false})
    .pipe(filesize())
    .pipe(clean());
});

gulp.task('build', ['html', 'sass', 'script']);

gulp.task('dev', ['watch', 'run-dev']);

gulp.task('publish', ['run-publish']);
