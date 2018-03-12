var gulp = require('gulp')
var argv = require('yargs').argv
var clean = require('gulp-clean')
var rename = require('gulp-rename')
var replace = require('gulp-replace')
var gulpSequence = require('gulp-sequence')

var argvTid = argv.tid

if (!argvTid) {
  throw new Error('[argv error] tid')
  process.exit(1)
}

var tid = argvTid.slice(0, 12)
var datetime = new Date().getTime()

gulp.task('clean', function () {
  return gulp.src(`release/${tid}`, { read: false })
    .pipe(clean())
})

gulp.task('htmlreplace',function(){
  return gulp.src([`pages/${argvTid}.html`])
    .pipe(replace('gulpVersionNeedReplaced', datetime))
    .pipe(replace(/<a target="_blank"/, '<a'))
    .pipe(rename('index.html'))
    .pipe(gulp.dest(`release/${tid}`))
})

gulp.task('default', gulpSequence('clean', 'htmlreplace'))
