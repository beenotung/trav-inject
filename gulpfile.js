// reference [babel] : https://babeljs.io/docs/setup/#installation
// reference [gulp] : https://github.com/gulpjs/gulp/blob/master/docs/API.md
// reference [watchify, browserify] : https://gist.github.com/danharper/3ca2273125f500429945
// refernece [filesize] : http://stackoverflow.com/questions/21806925/get-the-current-file-name-in-gulp-src

const
  gulp = require('gulp')
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
  , source = require('source')
  , buffer = require('gulp-buffer')
  ;

const paths = {
  html: ['index.html']
  , sass: ['src/**/*.scss', 'src/**/*.css']
  , script: ['src/**/*.ts', 'src/**/*.js']
  , distDir: 'dist'
  , distFile: ['dist/*']
  , srcFile: ['index.html', 'src/**/*.*']
  , mainTs: "src/main.ts"
};

gulp.task('babel', () => {
  return gulp.src('src/**/*.js')
    .pipe(sourcemaps.init())
    .pipe(filesize())
    .pipe(babel({
      presets: [
        'es2015'
      ]
      , plugins: [
        'transform-runtime'
        , 'babel-plugin-transform-es2015-modules-umd'
      ]
    }))
    .pipe(concat('bundle.js'))
    .pipe(filesize()) // babel output
    .pipe(gulp.dest(paths.distDir));
});

gulp.task('typescript', ()=> {
  return gulp.src('src/**/*.ts')
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

gulp.task('script', (done)=> {
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

gulp.task('build', ['html', 'script', 'sass']);

gulp.task('watch', done=> {
  gulp.watch(paths.srcFile, ['build'])
});

gulp.task('clean', ()=> {
  return gulp.src(paths.distFile, {read: false})
    .pipe(filesize())
    .pipe(clean());
});

/* this is for library, not for web app project*/
gulp.task('typescript-library', ()=> {
  const tsResult = gulp.src(paths.script)
    .pipe(ts({
      declaration: true,
      noExternalResolve: true
    }));
  return merge([
    tsResult.dts.pipe(gulp.dest(paths.distDir + '/definitions'))
    , tsResult.js.pipe(gulp.dest(paths.distDir + '/js'))
  ]);
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

gulp.task('start', ['build', 'watch', 'run']);

/* ---- testing ---- */
// reference [TypeScript + Browserify + SourceMaps] : http://stackoverflow.com/questions/36184581/typescript-browserify-sourcemaps-in-gulp
gulp.task('scripts', function () {
  return browserify(paths.mainTs, {debug: true})
    .on('error', console.error.bind(console))
    .plugin(tsify)
    .bundle()
    .pipe(source('all.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(gulp.dest(paths.outscripts))
    .pipe(rename('all.min.js'))
    .pipe(uglify())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(paths.outscripts));
});
