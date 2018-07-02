'use strict';
var gulp = require('gulp'),
    watch = require('gulp-watch'),
    prefixer = require('gulp-autoprefixer'),
    browserify = require('gulp-browserify'),
    uglify = require('gulp-uglify'),
    sass = require('gulp-sass'),
    sourcemaps = require('gulp-sourcemaps'),
    rigger = require('gulp-rigger'),
    cssmin = require('gulp-minify-css'),
    imagemin = require('gulp-imagemin'),
    rename = require('gulp-rename'),
    gutil = require('gulp-util'),
    pngquant = require('imagemin-pngquant'),
    rimraf = require('rimraf'),
    browserSync = require("browser-sync"),
    webpack = require('webpack'),
    webpackStream = require('webpack-stream'),
    nodeExternals = require('webpack-node-externals'),
    UglifyJsPlugin = require('uglifyjs-webpack-plugin'),
    concat = require('gulp-concat'),
    iconfont = require('gulp-iconfont'),
    iconfontCss = require('gulp-iconfont-css'),
    spritesmith = require("gulp.spritesmith");

var path = {
    build: {
        css: '../project/www/css/',
        js: '../project/www/js/',
        img: '../project/www/img/**/*.*',
    },
    icon: {
        path: ['./icons/*.svg'],
        fontName: 'killer',
        fontPath: '../project/www/fonts/',
        scssTemplate: 'node_modules/gulp-iconfont-css/templates/_icons.scss',
        pathCss: './css/killer.scss',
        pathFonts: '../project/www/fonts/',
    },
    sprite: {
        path: './sprites/*.*',
        imgName: 'sprite.png',
        cssName: 'sprite.scss',
        cssFormat: 'scss',
        cssTemplate: 'spritesmith.scss.template.mustache',
        prefix: 's-',
        saveSprite: './img/',
        saveStyle: './css/',
    },
    src: {
        js: './lib/*.*',
        style: './css/*.scss',
        img: './img/**/*.*',
        fonts: './fonts/**/*.*',
    },
    watch: {
        js: './lib/*.*',
        style: './css/*.scss',
        img: './img/**/*.*',
        fonts: './fonts/**/*.*',
        html: '../*.html',
    },
};

var config = {
    //host: 'dist',
    server: "../",
    port: 3000,
    logPrefix: "Cardinal On NODE.JS",
    open: true,
    changeOrigin : true,
    injectChanges: true,
    notify: true,
};

var bableLoaderOptions = {
    plugins: [
        'transform-object-rest-spread'
    ],
    presets: [
        ['es2015', { loose: true, modules: false }]
    ],
    presets: ['env']
};

var handlers = (err, stats) => {
    if (stats.hasErrors()) {
        if (!stats.compilation.errors[0].error) {
            gutil.log('stats.compilation.errors[0]');
            gutil.log(stats.compilation.errors[0]);
        } else {
            gutil.log(gutil.colors.red(stats.compilation.errors[0].error.toString()));
        }
    } else if (stats.hasWarnings()) {
        if (!stats.compilation.warnings[0].error) {
            gutil.log('stats.compilation.warnings[0]');
            gutil.log(stats.compilation.warnings[0]);
        } else {
            gutil.log(gutil.colors.yellow(stats.compilation.warnings[0].error.toString()));
        }
    }
}

gulp.task('js:build', function () {
    gulp.src(path.src.js)
        .pipe(webpackStream({
            output: {
                filename: 'app.js',
            },
            module: {
                rules: [
                    {
                        test: /\.vue$/,
                        exclude: /node_modules/,
                        loader: 'vue-loader',
                        options: {
                            loaders: {
                                js: {
                                    loader: 'babel-loader',
                                    options: bableLoaderOptions,
                                },
                            },
                        },
                    },
                    {
                        test: /\.(js)$/,
                        exclude: /(node_modules)/,
                        loader: 'babel-loader',
                        options: bableLoaderOptions,
                    },
                    {
                        test: /\.json$/,
                        loader: 'json-loader',
                    },
                ]
            },
            target: 'node',
            externals: [nodeExternals()],
            plugins: [
                new UglifyJsPlugin({
                    uglifyOptions: { compress: { warnings: false }, },
                    sourceMap: true,
                })
                /*new webpack.DefinePlugin({
                    "process.env": {
                        // This has effect on the react lib size
                        "NODE_ENV": JSON.stringify("production")
                    }
                }),*/
            ],
            resolve: {
                alias: {
                    'vue': 'vue/dist/vue.common.js',
                },
            },
        }, null, handlers))
        .pipe(rigger())
        .pipe(sourcemaps.init())
        .pipe(gulp.dest(path.build.js))
        .pipe(browserify())
        .pipe(uglify())
        .pipe(sourcemaps.write('../maps'))
        .pipe(rename({ suffix: '.min' }))
        .pipe(browserSync.reload({stream: true}));
});

gulp.task('style:build', function () {
    gulp.src(path.src.style)
        .pipe(rigger())
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', function(err) {
            console.error(err.message);
            browserSync.notify(err.message, 3000); 
            this.emit('end'); 
        }))
        .pipe(prefixer({
            browsers: ['> 1% in SE', 'ie >= 6', 'last 2 versions', 'Firefox ESR', 'Opera 12.1']
        }))
        .pipe(cssmin())
        .pipe(concat('main.css'))
        .pipe(sourcemaps.write('../maps'))
        .pipe(gulp.dest(path.build.css))
        .pipe(browserSync.reload({stream: true}));
});

gulp.task('image:build', function () {
    gulp.src(path.src.img)
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{
                removeViewBox: false
            }],
            use: [pngquant()],
            interlaced: true
        }))
        .pipe(gulp.dest(path.build.img))
        .pipe(browserSync.reload({stream: true}));
});

gulp.task('fonts:build', function () {
    gulp.src(path.src.fonts)
});

gulp.task('icon:build', function() {
    gulp.src(path.icon.path)
        .pipe(iconfontCss({
            path: path.icon.scssTemplate,
            fontName: path.icon.fontName,
            targetPath: path.icon.pathCss,
            fontPath: path.icon.pathFonts,
        }))
        .pipe(iconfont({
            fontName: path.icon.fontName,
        }))
        .pipe(gulp.dest(path.icon.pathFonts));
});

gulp.task('sprite:build', function() {
    var spriteData = gulp.src(path.sprite.path) // путь, откуда берем картинки для спрайта
        .pipe(spritesmith({
            imgName: path.sprite.imgName,
            cssName: path.sprite.cssName,
            cssFormat: path.sprite.cssFormat,
            algorithm: 'binary-tree',
            cssTemplate: path.sprite.cssTemplate,
            cssVarMap: function(sprite) {
                sprite.name = path.sprite.prefix + sprite.name
            }
        }));
        spriteData.img.pipe(gulp.dest(path.sprite.saveSprite)); // путь, куда сохраняем картинку
        spriteData.css.pipe(gulp.dest(path.sprite.saveStyle)); // путь, куда сохраняем стили
});

gulp.task('html:build', function () {
    gulp.src(path.watch.html)
});

gulp.task('build', [
    'style:build',
    'icon:build',
    'sprite:build',
    'js:build',
    'fonts:build',
    'image:build',
    'html:build',
]);

gulp.task('watch', function () {
    watch([path.watch.style], function (event, cb) {
        gulp.start('style:build');
    });
    watch([path.watch.js], function (event, cb) {
        gulp.start('js:build');
    });
    watch(path.sprite.path, function (event, cb) {
        gulp.start('sprite:build');
    });
    watch(path.icon.path, function (event, cb) {
        gulp.start('icon:build');
    });
    watch([path.watch.img], function (event, cb) {
        gulp.start('image:build');
    });
    watch([path.watch.fonts], function (event, cb) {
        gulp.start('fonts:build');
    });
    watch([path.watch.html], function (event, cb) {
        gulp.start('html:build');
    });
});

gulp.task('webserver', function () {
    browserSync(config);
});

gulp.task('clean', function (cb) {
    rimraf(path.clean, cb);
});

gulp.task('default', ['build', 'webserver', 'watch']);