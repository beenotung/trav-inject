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
  , babel = require('gulp-babel')
  , concat = require('gulp-concat')
  , ts = require('gulp-typescript')
  , merge = require('merge2')
  , sass = require('gulp-sass')
  , minifyCss = require('gulp-minify-css')
  , uglify = require('gulp-uglify')
  , rename = require('gulp-rename')
  , replace = require('gulp-replace')
  , webserver = require('gulp-webserver')
  , browserify = require('browserify')
  , tsify = require('tsify')
  , source = require('vinyl-source-stream')
  , buffer = require('vinyl-buffer')
  , runSequence = require('run-sequence')
  , dirSync = require('gulp-directory-sync')
  ;

var watchify = require('watchify');
var fs = require('fs');
var babelify = require('babelify');
var watch = require('gulp-watch');
var livereload = require('gulp-livereload');
var assign = require('lodash.assign');

const paths = {
  html: ['index.html']
  , sass: ['src/**/*.scss', 'src/**/*.css']
  , script: ['src/**/*.ts', 'src/**/*.js']
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
  , libSrc: 'lib'
};

gulp.task('babel', () => {
  let src_files = [
    'build/**/*.js'
    , '!build/**/node_modules/**/*.js'
  ];
  return gulp.src(src_files)
    .pipe(sourcemaps.init())
    .pipe(filesize())
    .pipe(babel({
      presets: [
        'es2015'
      ]
      , plugins: [
        // 'transform-runtime'
        // , 'babel-plugin-transform-es2015-modules-umd'
      ]
    }))
    // .pipe(concat('bundle.js'))
    .pipe(filesize()) // babel output
    .pipe(gulp.dest(paths.distDir));
});

gulp.task('typescript', ()=> {
  return gulp.src(paths.script)
    .pipe(sourcemaps.init())
    .pipe(filesize())
    .pipe(ts({
      target: 'es6'
      , noImplicitAny: true
      , out: 'bundle.js'
    }))
    .pipe(filesize()) // tsc output
    // .pipe(concat('bundle.ts'))
    .pipe(gulp.dest(paths.distDir));
});

gulp.task('tsc', ()=> {
  let tsProject = ts.createProject('tsconfig.json');
  var tsResult = tsProject.src()
    .pipe(ts(tsProject));
  return tsResult.js
    .pipe(gulp.dest(paths.buildSrcDir));
});

gulp.task('sync-lib', function () {
  let source_dir = paths.libSrc;
  let dest_dir = paths.buildDir + '/' + paths.libSrc;
  return gulp.src('')
    .pipe(dirSync(source_dir, dest_dir, {printSummary: true}))
    .on('error', gutil.log);
});

function bundlerFunc() {
  let customOpts = {
    debug: true //inline sourcemap
  };
  let opts = assign({}, watchify.args, customOpts);
  return browserify(opts)
    .transform(babelify.configure({
      // experimental: true,
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

gulp.task('babel-browser', bundle.bind(null, bundlerFunc()));

gulp.task('script', ()=> {
  runSequence('tsc', 'sync-lib', 'babel-browser')
});

gulp.task('sass', done=> {
  gulp.src(paths.sass)
    .pipe(sourcemaps.init())
    .pipe(filesize()) // raw file
    .pipe(concat('bundle.scss'))
    .pipe(sass({
      errLogToConsole: true
    }))
    .pipe(filesize()) // sass output
    .pipe(minifyCss({
      keepSpecialComments: 0
    }))
    .pipe(rename({
      extname: '.min.css'
    }))
    .pipe(filesize()) // minifyCss output
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(paths.distDir))
});

gulp.task('script_old', (done)=> {
  return gulp.src(paths.script)
    .pipe(sourcemaps.init())
    .pipe(filesize()) // raw files
    .pipe(ts({
      target: 'es6'
      , noImplicitAny: true
      , out: 'bundle.es6.js'
      , allowJs: true
    }))
    // .pipe(gulp.dest('bundle.es6.js'))
    .pipe(filesize()) // tsc output
    .pipe(babel({
      presets: ['es2015']
      , plugins: [
        // 'transform-runtime'
        // , 'babel-plugin-transform-es2015-modules-amd'
        // , 'babel-plugin-transform-es2015-modules-umd'
        // , 'babel-plugin-transform-es2015-modules-commonjs'
      ]
    }))
    .pipe(rename('bundle.babel.js'))
    .pipe(filesize()) // babel output

    // .pipe(browserify({
    //   insertGlobals: true
    //   , debug: !gulp.env.production
    // }))
    // .pipe(filesize()) // browserify output

    .pipe(uglify())
    .pipe(rename('bundle.min.js'))
    .pipe(filesize()) // uglify output
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(paths.distDir))
});

gulp.task('html', ()=> {
  gulp.src(paths.html)
    .pipe(replace(/dist\//g, ''))
    .pipe(gulp.dest(paths.distDir))
});


gulp.task('watch', done=> {
  gulp.watch(paths.srcFile, ['build'])
});

gulp.task('clean', ()=> {
  let src = [
    paths.distDir + '/*'
    , paths.buildDir + '/*'
  ];
  return gulp.src(src, {read: false})
  // .pipe(filesize())
    .pipe(clean());
});

gulp.task('run', done=> {
  gulp.src(paths.distDir)
    .pipe(webserver({
      livereload: true
      , host: '0.0.0.0'
      , port: 8080
      , directoryListing: {
        enable: false,
        path: paths.distDir
      }
      , open: true
      // , path: paths.distDir + '/'
      // , fallback: 'index.html'
    }))
    .on('end', done)
});

gulp.task('build', ['html', 'script', 'sass']);
gulp.task('start', ['build', 'watch', 'run']);

/* ---- testing ---- */
// reference [TypeScript + Browserify + SourceMaps] : http://stackoverflow.com/questions/36184581/typescript-browserify-sourcemaps-in-gulp
gulp.task('scripts', function () {
  return browserify(paths.mainTs, {debug: true})
    .on('error', console.error.bind(console))
    .plugin(tsify)
    .bundle()
    .pipe(concat('all.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(gulp.dest('dist/bundle.js'))
    .pipe(rename('all.min.js'))
    .pipe(uglify())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('dist/bundle.min.js'));
});
