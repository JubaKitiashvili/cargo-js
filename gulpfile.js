var gulp = require("gulp");
var umd = require("gulp-umd");
var uglify = require("gulp-uglify");
var rename = require("gulp-rename");
var replace = require("gulp-replace");
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var exec = require('child_process').exec;

gulp.task('doc', function (cb) {
	exec("make -C src/documentation html", function (err, stdout, stderr) {
		console.log(stdout);
		console.log(stderr);
		cb(err);
	});
	gulp.src('src/documentation/build/html/**/*.*')
		.pipe(gulp.dest('dist/documentation/'));
});

gulp.task('deps_morphdom', function () {
	gulp.src('bower_components/morphdom/dist/morphdom-umd.js')
		.pipe(rename('morphdom.js'))
		.pipe(gulp.dest('dist/dependencies'));
});

gulp.task('deps', function () {
	gulp.src(['bower_components/requirejs/require.js',
		'bower_components/jquery/dist/jquery.js',
		'bower_components/handlebars/handlebars.js',
		'bower_components/underscore/underscore.js',
		'bower_components/js-cookie/src/js.cookie.js',
		'node_modules/superagent/superagent.js'
	]).pipe(gulp.dest('dist/dependencies'));
});

gulp.task('build_component', ['deps_morphdom'], function () {
	// Build Component.js for bower
	var umdOptions = {
		namespace: function () {
			return "cargo.Component";
		},
		template: 'umdTemplate.templ',
		dependencies: function () {
			return ["Handlebars", "morphdom", "superagent",
				{
					name: 'underscore',
					amd: 'underscore',
					cjs: 'underscore',
					global: 'underscore',
					param: '_'
				}
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
	
	// Build Template.js for bower
	umdOptions = {
		namespace: function () {
			return "cargo.Template";
		},
		template: 'umdTemplate.templ',
		dependencies: function () {
			return ["Handlebars", "superagent",
				{
					name: 'underscore',
					amd: 'underscore',
					cjs: 'underscore',
					global: 'underscore',
					param: '_'
				}
			];
		}
	};
	gulp.src('src/component/Template.js')
		.pipe(umd(umdOptions))
		.pipe(rename("template.handlebars.js"))
		.pipe(gulp.dest('dist/'));
	gulp.src('src/component/Template.js')
		.pipe(umd(umdOptions))
		.pipe(uglify())
		.pipe(rename("template.handlebars.min.js"))
		.pipe(gulp.dest('dist/'));
	
});

gulp.task('build_node_js', ['build_model', 'build_component', 'build_translation'], function () {
	
	gulp.src('dist/component.js')
		.pipe(rename("cargo-component.js"))
		.pipe(gulp.dest('dist/node'));
	gulp.src('dist/template.handlebars.js')
		.pipe(rename("cargo-template.js"))
		.pipe(gulp.dest('dist/node'));
	gulp.src('dist/model.js')
		.pipe(rename("cargo-model.js"))
		.pipe(gulp.dest('dist/node'));
	gulp.src('dist/translation.js')
		.pipe(rename("cargo-translation.js"))
		.pipe(gulp.dest('dist/node'));
	gulp.src('dist/translation.js')
		.pipe(rename("cargo-translation.js"))
		.pipe(gulp.dest('dist/node'));
	gulp.src('src/node/*.js')
		.pipe(gulp.dest('dist/node/'));
	
	
});

gulp.task('build_translation', function () {
	var umdOptions = {
		namespace: function () {
			return "cargo.Translation";
		},
		template: 'umdTemplate.templ',
		dependencies: function () {
			return ["superagent",
				{
					name: 'underscore',
					amd: 'underscore',
					cjs: 'underscore',
					global: 'underscore',
					param: '_'
				}
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

gulp.task('build_example', ['build_component', 'build_model', 'build_translation'], function () {
	var Template = require('./dist/node/index').Template;
	var compileComponent = require('./dist/node/index').compileTemplate;
	gulp.src('example/component/templates/LanguageMenu.html')
		.pipe(compileComponent({compiler: Template}))
		.pipe(rename('LanguageMenu.js'))
		.pipe(gulp.dest('example/component/templates/'));
	gulp.src('example/component/templates/Signin.html')
		.pipe(compileComponent({compiler: Template}))
		.pipe(rename('Signin.js'))
		.pipe(gulp.dest('example/component/templates/'));
});

gulp.task('build', ['deps', 'build_model', 'build_component', 'build_translation', 'build_node_js', 'build_example'], function () {
});

gulp.task('default', ['build'], function () {
	gulp.watch('src/**/*.js', ['build']);
});
