var gulp = require("gulp");
var umd = require("gulp-umd");
var uglify = require("gulp-uglify");
var rename = require("gulp-rename");
var replace = require("gulp-replace");
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var exec = require('child_process').exec;



gulp.task('doc', function(cb) {
    exec("make -C src/documentation html", function(err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        cb(err);
    });
    gulp.src('src/documentation/build/html/**/*.*')
        .pipe(gulp.dest('dist/documentation/'));
});

gulp.task('deps', function() {
    gulp.src(['bower_components/requirejs/require.js',
            'bower_components/jquery/dist/jquery.js',
            'bower_components/virtual-dom/dist/virtual-dom.js',
            'bower_components/handlebars/handlebars.js',
            'bower_components/underscore/underscore.js',
            'bower_components/js-cookie/src/js.cookie.js',
            'dist/html2hscript.js',
            'node_modules/superagent/superagent.js'])
        .pipe(gulp.dest('dist/dependencies'));
});

gulp.task('deps_html2hscript', function () {
    return browserify({
        entries: ['node_modules/html2hscript/index.js'],
        standalone: 'html2hscript'
    })
        .bundle()
        .pipe(source('html2hscript.js'))
        .pipe(replace('}, {decodeEntities: true, xmlMode: true});', '}, {decodeEntities: true, xmlMode: false});'))
        .pipe(gulp.dest("dist/dependencies/"));
});

gulp.task('build_example', function() {
    gulp.src(['dist/component.js', 'dist/model.js', 'dist/promise.js'])
        .pipe(gulp.dest('example/component/js/lib/'));
    gulp.src(['dist/dependencies/require.js',
        'dist/dependencies/jquery.js',
        'dist/dependencies/virtual-dom.js',
        'dist/dependencies/handlebars.js',
        'dist/dependencies/html2hscript.js',
        'dist/dependencies/superagent.js'])
        .pipe(gulp.dest('example/component/js/lib/third-party/'));
});

gulp.task('build_component', ['deps_html2hscript'], function () {
    var umdOptions = {
        namespace: function () {
            return "cargo.Component";
        },
        template: 'umdTemplate.templ',
        dependencies: function () {
            return [
                {
                    name: 'Promise',
                    amd: 'cargo.Promise',
                    cjs: 'cargo.Promise',
                    global: 'cargo.Promise',
                    param: 'Promise'
                },
                {
                    name: 'Model',
                    amd: 'cargo.Model',
                    cjs: 'cargo.Model',
                    global: 'cargo.Model',
                    param: 'Model'
                },
                {
                    name: 'Translation',
                    amd: 'cargo.Translation',
                    cjs: 'cargo.Translation',
                    global: 'cargo.Translation',
                    param: 'Translation'
                },
                "virtualDom", "html2hscript", "Handlebars", "superagent"

            ];
        }
    };
    gulp.src('src/component/Component.js')
        .pipe(umd(umdOptions))
        .pipe(rename("component.js"))
        .pipe(gulp.dest('dist/'));
    gulp.src('src/component/Component.js')
        .pipe(umd(umdOptions))
        .pipe(uglify())
        .pipe(rename("component.min.js"))
        .pipe(gulp.dest('dist/'));

});

gulp.task('build_translation', function () {
    var umdOptions = {
        namespace: function () {
            return "cargo.Translation";
        },
        template: 'umdTemplate.templ',
        dependencies: function () {
            return [
                {
                    name: 'Promise',
                    amd: 'cargo.Promise',
                    cjs: 'cargo.Promise',
                    global: 'cargo.Promise',
                    param: 'Promise'
                },
                {
                    name: 'Model',
                    amd: 'cargo.Model',
                    cjs: 'cargo.Model',
                    global: 'cargo.Model',
                    param: 'Model'
                }, "superagent", "_"

            ];
        }
    };

    gulp.src('src/translation/Translation.js')
        .pipe(umd(umdOptions))
        .pipe(rename("translation.js"))
        .pipe(gulp.dest('dist/'));
    gulp.src('src/translation/Translation.js')
        .pipe(umd(umdOptions))
        .pipe(uglify())
        .pipe(rename("translation.min.js"))
        .pipe(gulp.dest('dist/'));

});

gulp.task('build_model', function () {
    var umdOptions = {
        namespace: function () {
            return "cargo.Model";
        },
        dependencies: function () {
            return [
                {
                    name: 'Promise',
                    amd: 'cargo.Promise',
                    cjs: 'cargo.Promise',
                    global: 'cargo.Promise',
                    param: 'Promise'
                }]
        },
        template: 'umdTemplate.templ'
    };
    gulp.src('src/model/Model.js')
        .pipe(umd(umdOptions))
        .pipe(rename("model.js"))
        .pipe(gulp.dest('dist/'));
    gulp.src('src/model/Model.js')
        .pipe(umd(umdOptions))
        .pipe(uglify())
        .pipe(rename("model.min.js"))
        .pipe(gulp.dest('dist/'));
});

gulp.task('build_promise', function () {
    var umdOptions = {
        exports: function (file) {
            return "Promise";
        },
        namespace: function () {
            return "cargo.Promise";
        },
        template: 'umdTemplate.templ'
    };
    gulp.src('src/promise/Promise.js')
        .pipe(umd(umdOptions))
        .pipe(rename("promise.js"))
        .pipe(gulp.dest('dist/'));
    gulp.src('src/promise/Promise.js')
        .pipe(umd(umdOptions))
        .pipe(uglify())
        .pipe(rename("promise.min.js"))
        .pipe(gulp.dest('dist/'));
});


gulp.task('build', ['deps', 'build_model', 'build_promise', 'build_component', 'build_translation', 'build_example'], function () {
});

gulp.task('default', ['build'], function () {
    gulp.watch('src/**/*.js', ['build']);
});
