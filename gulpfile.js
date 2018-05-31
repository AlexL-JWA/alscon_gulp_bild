var gulp = require('gulp'),
    consolidate = require('gulp-consolidate'),
    iconfont = require('gulp-iconfont'),
    postcss = require('gulp-postcss'),
    cssnano = require('gulp-cssnano'),
    concat = require('gulp-concat'),
    brow_sync = require('browser-sync').create(),
    uglify = require('gulp-uglifyjs'),
    sourcemaps = require('gulp-sourcemaps'),
    tinypng = require('gulp-tinypng-compress'),
    cached = require('gulp-cached'),
    path = require('path'),
    remember = require('gulp-remember'),
    cssnext = require('postcss-cssnext'),
    rucksack = require('rucksack-css'),
    inlinesvg = require('postcss-inline-svg'),
    assets = require('postcss-assets'),
    precss = require('precss'),
    babel = require('gulp-babel'),
    mixin = require('postcss-sassy-mixins'),
    plumber = require('gulp-plumber'),
    pug = require('gulp-pug'),
    //wiredep = require('gulp-wiredep'),
    wiredep = require('wiredep').stream,
    useref = require('gulp-useref'),
    gulpif = require('gulp-if'),
    runSequence = require('run-sequence'),
    clip = require('gulp-clip-empty-files'),
    del = require('del');

// Creating icon fonts
gulp.task('iconfont', function () { // svg font

    var processors = [
        assets({
            loadPaths: ['dist/fonts/', 'dist/img/', 'dist/img_clients/'],
            basePath: 'dist/',
            relative: true
        })
    ]
    return gulp.src('dev/icons/*.svg')
        .pipe(iconfont({
            fontName: 'custom-icons',
            formats: ['ttf', 'eot', 'woff', 'woff2'],
            appendCodepoints: true,
            appendUnicode: false,
            normalize: true,
            fontHeight: 1000,
            centerHorizontally: true
        }))
        .on('glyphs', function (glyphs, options) {
            gulp.src('dev/css/template/*.css')
                .pipe(consolidate('underscore', {
                    glyphs: glyphs,
                    fontName: options.fontName,
                    fontDate: new Date().getTime()
                }))
                .pipe(gulp.dest('dev/css/'))
                .pipe(postcss(processors));

            gulp.src('dev/icons/template_html/index.html')
                .pipe(consolidate('underscore', {
                    glyphs: glyphs,
                    fontName: options.fontName
                }))
                .pipe(gulp.dest('dist/preview'));
        })
        .pipe(gulp.dest('dist/fonts'));
});
//End ico fonts

// Compiling PostCSS with syntax capability SASS + NextCSS
gulp.task('post-css', function () { // post css
    var processors = [

        mixin,
        precss({
            parser: 'postcss-scss',
            browsers: ["> 5%"]
        }),
        rucksack,
        inlinesvg,
        cssnext,
        assets({
            loadPaths: ['dist/fonts/', 'dist/img/', 'dist/img_clients/'],
            basePath: 'dist/',
            relative: true
        })
        ];

    return gulp.src(['dev/css/reset.scss', 'dev/css/font.scss', 'dev/css/icons-font.css', 'dev/css/header.scss','dev/css/content.scss', 'dev/css/footer.scss', 'dev/css/media.scss'])
        .pipe(sourcemaps.init())
        .pipe(plumber())
        .pipe(postcss(processors))
        .pipe(concat('main.css'))
        .pipe(sourcemaps.write())
        .pipe(cssnano())
        .pipe(gulp.dest('dist/css'));
});
// End PostCSS

//Bower start task
gulp.task('bower', function(){
    return gulp.src('dev/*.html')
    .pipe(clip())
    .pipe(wiredep({
        directory : 'dev/lib'
    }))
    .pipe(gulp.dest('dev'));
});

gulp.task('asset_lib', function () {
    return gulp.src('dev/lib/**/*{.css,.js}')
        .pipe(gulp.dest('dist/lib'));

}); 
//bower end 

//Browser synchronization
gulp.task('brow_sync', function () { // browser sync
    brow_sync.init({
        server: 'dist'
    });
    brow_sync.watch('dist/**/*.*').on('change', brow_sync.reload);
});
// End browser synchronization

// Track changes to development files
gulp.task('watch', function () {
    gulp.watch('dev/css/*{.css,.scss}', ['post-css']);
    gulp.watch('dev/icons/**/*.svg', ['iconfont']);
    gulp.watch('dev/font/**/*.*', ['asset_font']);
    gulp.watch('dev/pug/**/*.pug', ['pug']);
    gulp.watch('dev/*.html', ['asset_html' ]);
    gulp.watch('dev/*.html', ['bower']);
    gulp.watch('dev/lib/**/*{.js,.css}', ['asset_lib']);
    gulp.watch('dev/js/**/*.js', ['js']);
    gulp.watch('dev/**/*.{{.png,.jpg,.jpeg,.gif}}', ['accet_img'])

});
// end watch

// compiling pug / jade files
gulp.task('pug', function(){
    return gulp.src('dev/pug/**/*.pug')
    .pipe(pug(
        {
            pretty: true
        }
    ))
    .pipe(gulp.dest('dev'));
});
// end pug

// Transferring html files to the dist folder
gulp.task('asset_html', function () {
    return gulp.src('dev/*.html')
        .pipe(useref())
        .pipe(clip())
        .pipe(gulpif('*.js', uglify()))
        .pipe(gulpif('*.css', cssnano()))
        .pipe(gulp.dest('dist/'));

});
// end transfer html files

//Transferring image files to the dist folder
gulp.task('asset_img', function () {
    return gulp.src('dev/**/*{.png,.jpg,.jpeg,.gif}')
        .pipe(gulp.dest('dist'));

});
//End image

//Transferring font files to the dist folder
gulp.task('asset_font', function () {
    return gulp.src('dev/font/**/*.*')
        .pipe(gulp.dest('dist/fonts'));

});
// End font

// Optimizing images through TinyPNG
gulp.task('tinypng', function () {
    return gulp.src('dev/**/*.{png,jpg,jpeg}')
        .pipe(cached('tinypng'))
        .pipe(tinypng({
            key: 'spvfAakKRXcLDr_uaUsHSTd4FrR7Os6J',
            sigFile: 'images/.tinypng-sigs',
            log: true
        }))
        .pipe(remember('tinypng'))
        .pipe(gulp.dest('dist/'));
});
// End optimizing images

// Compiling all js files into one and bringing them to the es2015 standard
gulp.task('js', function () {
    return gulp.src('dev/js/**/*.js')
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(concat('build.js'))
        .pipe(uglify())
        .pipe(gulp.dest('dist/js'));

});
// end js

//Removes the dist directory
gulp.task('del', function () {
    return del('dist');
});
// end del

//Removes the dist directory
gulp.task('delLib', function () {
    return del('dist/lib');
});
// end del

// Starts the development package
gulp.task('default', function(callback){
    runSequence('iconfont', 'asset_font', 'post-css', 'pug', 'bower', 'asset_html', 'asset_lib', 'js', 'asset_img', 'watch', 'brow_sync', callback);
});

//Starts the final assembly of the project 
gulp.task('build', ['del', 'iconfont', 'asset_font', 'post-css', 'pug', 'bower', 'asset_lib', 'asset_html', 'js', 'tinypng',]);
