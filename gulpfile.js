// объявляем папку исходника (src_folder - в ней пишем код) и папку выгрузки (project_folder - ее отдаем заказчику)
const project_folder = 'dist';
const src_folder = '#src';

// объявляем пути для копирования файлов
const path = {
    //конечная сборка
    build: {
        html: project_folder + '/',
        css: project_folder + '/css/',
        js: project_folder + '/js/',
        img: project_folder + '/img/',
        fonts: project_folder + '/fonts/',
    },
    //исходник
    src: {
        html: [src_folder + '/*.html', '!' + src_folder + '/_*.html'],
        css: src_folder + '/scss/style.scss',
        js: src_folder + '/js/main.js',
        img: src_folder + '/img/**/*.{jpg,png,svg,gif,webp,ico}',
        fonts: src_folder + '/fonts/*.ttf',
    },
    //наблюдатель
    watch: {
        html: src_folder + '/**/*.html',
        css: src_folder + '/scss/**/*.scss',
        js: src_folder + '/js/**/*.js',
        img: src_folder + '/img/**/*.{jpg,png,svg,gif,webp,ico}',
    },
    clean: './' + project_folder + '/',
}

//переменные подключаемых плагинов галп

const { src, dest } = require('gulp');
const gulp = require('gulp');
const browserSync = require('browser-sync').create();
const fileinclude = require('gulp-file-include');
const del = require('del');
const scss = require('gulp-sass')(require('sass'));
const autoprefixer = require('gulp-autoprefixer');
const group_media = require('gulp-group-css-media-queries');
const clean_css = require('gulp-clean-css');
const rename = require('gulp-rename');
const uglify = require('gulp-uglify-es').default;
const imagemin = require('gulp-imagemin');
const webp = require('gulp-webp');
const webp_html = require('gulp-webp-html');
const webpcss = require('gulp-webpcss');
const svgSprite = require('gulp-svg-sprite');
const ttf2woff = require('gulp-ttf2woff');
const ttf2woff2 = require('gulp-ttf2woff2');

//авотматическое подключение шрифтов к css

const fs = require('fs');

function fontsStyle(params) {

    let file_content = fs.readFileSync(src_folder + '/scss/fonts.scss');
    if (file_content == '') {
        fs.writeFile(src_folder + '/scss/fonts.scss', '', cb);
        return fs.readdir(path.build.fonts, function (err, items) {
            if (items) {
                let c_fontname;
                for (let i = 0; i < items.length; i++) {
                    let fontname = items[i].split('.');
                    fontname = fontname[0];
                    if (c_fontname != fontname) {
                        fs.appendFile(src_folder + '/scss/fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
                    }
                    c_fontname = fontname;
                }
            }
        })
    }
}

function cb() { }

//функции для работы плагинов

function browser_sync(params) {
    browserSync.init({
        server: {
            baseDir: './' + project_folder + '/'
        },
        notify: false
    })
}

function html() {
    return src(path.src.html)
        .pipe(fileinclude())
        .pipe(webp_html())
        .pipe(dest(path.build.html))
        .pipe(browserSync.stream())
}

function css() {
    return src(path.src.css)
        .pipe(
            scss({
                outputStyle: 'expanded'
            })
        )
        .pipe(
            group_media()
        )
        .pipe(
            autoprefixer({
                overrideBrowserList: ['last 5 version'],
                cascade: true
            })
        )
        .pipe(webpcss())
        .pipe(dest(path.build.css))
        .pipe(clean_css())
        .pipe(
            rename({
                extname: '.min.css'
            })
        )
        .pipe(dest(path.build.css))
        .pipe(browserSync.stream())
}

function js() {
    return src(path.src.js)
        .pipe(fileinclude())
        .pipe(dest(path.build.js))
        .pipe(uglify())
        .pipe(
            rename({
                extname: '.min.js'
            })
        )
        .pipe(dest(path.build.js))
        .pipe(browserSync.stream())
}

function images() {
    return src(path.src.img)
        .pipe(webp({
            quality: 70
        }))
        .pipe(dest(path.build.img))
        .pipe(src(path.src.img))
        .pipe(
            imagemin({
                progressive: true,
                svgoPlugins: [{ removeViewBox: true }],
                interlaced: true,
                optimizationLevel: 3
            })
        )
        .pipe(dest(path.build.img))
        .pipe(browserSync.stream())
}

function fonts(params) {
    src(path.src.fonts)
        .pipe(ttf2woff())
        .pipe(dest(path.build.fonts))
    return src(path.src.fonts)
        .pipe(ttf2woff2())
        .pipe(dest(path.build.fonts))
}

gulp.task('svgSprite', function () {
    return gulp.src([src_folder + '/iconsprite/*.svg'])
        .pipe(svgSprite({
            mode: {
                stack: {
                    sprite: '../icons/icons.svg',
                }
            }
        }))
        .pipe(dest(path.build.img))
})

function watchFiles(params) {
    gulp.watch([path.watch.html], html);
    gulp.watch([path.watch.css], css);
    gulp.watch([path.watch.js], js);
    gulp.watch([path.watch.img], images);
}

function clean(params) {
    return del(path.clean)
}

// финальная сборка... пока не особо понятная

const build = gulp.series(clean, gulp.parallel(js, css, html, images, fonts), fontsStyle);
const watch = gulp.parallel(build, watchFiles, browser_sync);

exports.css = css;
exports.js = js;
exports.html = html;
exports.images = images;
exports.fonts = fonts;
exports.fontsStyle = fontsStyle;
exports.build = build;
exports.watch = watch;
exports.default = watch;