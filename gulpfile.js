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
  ;

// const watchify = require('watchify');
// const browserify = require('gulp-browserify');
// var source = require('vinyl-source-stream');
// var buffer = require('vinyl-buffer');

// function compile(watch) {
//   var bundler = watchify(browserify('./src/*.js', {debug: true}).transform(babel));
//
//   function rebundle() {
//     bundler.bundle()
//       .on('error', err=> {
//         console.error(err);
//         this.emit('end');
//       })
//       .pipe(source('build.js'))
//       .pipe(buffer())
//       .pipe(sourcemaps.init({loadMaps: true}))
//       .pipe(sourcemaps.write('./'))
//       .pipe(gulp.dest('./build'));
//   }
//
//   if (watch) {
//     bundler.on('update', ()=> {
//       console.log('-> bundling...');
//       rebundle();
//     })
//   }
//   rebundle();
// }

// function watch() {
//   return compile(true)
// }

// gulp.task('build', compile);
// gulp.task('watch', watch);

// gulp.task('default', ['watch']);

gulp.task('test', ()=> {
  return gulp.src('src/**/*.js')
    .pipe(browserify({
      insertGlobals: true
      , debug: !gulp.env.production
    }))
    .pipe(gulp.dest('dist'));
});

gulp.task('babel', () => {
  return gulp.src('src/**/*.js')
    .pipe(filesize())
    .pipe(sourcemaps.init())
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
    .pipe(gulp.dest('dist'));
});

gulp.task('typescript', ()=> {
  return gulp.src('src/**/*.ts')
    .pipe(filesize())
    .pipe(sourcemaps.init())
    .pipe(ts({
      target: 'es6'
      , noImplicitAny: true
      , out: 'bundle.js'
    }))
    .pipe(filesize()) // tsc output
    // .pipe(concat('bundle.ts'))
    .pipe(gulp.dest('dist'));
});

gulp.task('build', ()=> {
  return gulp.src('src/**/*.?s')
    .pipe(filesize()) // raw files
    .pipe(sourcemaps.init())
    .pipe(ts({
      target: 'es6'
      , noImplicitAny: true
      , out: 'bundle.js'
    }))
    .pipe(filesize()) // tsc output
    .pipe(babel({
      presets: ['es2015']
      , plugins: [
        'transform-runtime'
        // , 'babel-plugin-transform-es2015-modules-amd'
        , 'babel-plugin-transform-es2015-modules-umd'
        // , 'babel-plugin-transform-es2015-modules-commonjs'
      ]
    }))
    .pipe(filesize()) // babel output
    // .pipe(browserify({
    //   insertGlobals: true
    //   , debug: !gulp.env.production
    // }))
    // .pipe(filesize()) // browserify output
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist'));
});

gulp.task('clean', ()=> {
  return gulp.src('dist/*', {read: false})
    .pipe(filesize())
    .pipe(clean());
});

/* this is for library, not for web app project*/
gulp.task('typescript-library', ()=> {
  const tsResult = gulp.src('src/**/*.ts')
    .pipe(ts({
      declaration: true,
      noExternalResolve: true
    }));
  return merge([
    tsResult.dts.pipe(gulp.dest('dist/definitions'))
    , tsResult.js.pipe(gulp.dest('dist/js'))
  ]);
});
