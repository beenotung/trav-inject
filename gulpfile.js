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
  ;

const paths = {
  html: ['index.html']
  , sass: ['src/**/*.scss', 'src/**/*.css']
  , script: ['src/**/*.ts', 'src/**/*.js']
  , distDir: 'dist'
  , distFile: ['dist/*']
  , srcFile: ['index.html', 'src/**/*.*']
};

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
  return gulp.src(paths.script)
    .pipe(browserify({
      insertGlobals: true
      , debug: !gulp.env.production
    }))
    .pipe(gulp.dest(paths.distDir));
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
    .pipe(gulp.dest(paths.distDir));
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
    .pipe(gulp.dest(paths.distDir));
});

gulp.task('sass', done=> {
  gulp.src(paths.sass)
    .pipe(sourcemaps.init())
    .pipe(concat('bundle.scss'))
    .pipe(sass({
      errLogToConsole: true
    }))
    .pipe(gulp.dest(paths.distDir))
    .pipe(minifyCss({
      keepSpecialComments: 0
    }))
    .pipe(rename({
      extname: '.min.css'
    }))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(paths.distDir))
});

gulp.task('script', (done)=> {
  return gulp.src(paths.script)
    .pipe(filesize()) // raw files
    .pipe(sourcemaps.init())
    .pipe(ts({
      target: 'es6'
      , noImplicitAny: true
      , out: 'bundle.es6.js'
    }))
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
