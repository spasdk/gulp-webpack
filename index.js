/**
 * @author Stanislav Kalashnik <darkpark.main@gmail.com>
 * @license GNU GENERAL PUBLIC LICENSE Version 3
 */

'use strict';

var fs      = require('fs'),
    path    = require('path'),
    webpack = require('webpack'),
    app     = require('spasdk/lib/app'),
    Plugin  = require('spasdk/lib/plugin'),
    plugin  = new Plugin({name: 'webpack', entry: 'build', config: require('./config')});


// rework profile
//plugin.prepare = function ( name ) {
//    var profile = this.config[name],
//        vars    = profile.variables = profile.variables || {};
//
//    // extend vars
//    //vars.name        = vars.name        || this.package.name;
//
//};


// generate output file from profile
//plugin.build = function ( name, callback ) {
//    //var data = this.config[name],
//    //    render;
//	//
//    //try {
//    //    // prepare function
//    //    render = jade.compileFile(data.source, {
//    //        filename: data.source,
//    //        pretty: data.indentString
//    //    });
//	//
//    //    // save generated result
//    //    fs.writeFileSync(data.target, render(data.variables));
//	//
//    //    callback(null);
//    //} catch ( error ) {
//    //    callback(error);
//    //}
//};


// create tasks for profiles
plugin.profiles.forEach(function ( profile ) {
    var compiler = webpack(profile.data.webpack),
        jsonSave = '',
        jsonCurr = '',
        report   = function ( err, stats ) {
            var json     = stats.toJson({source:false}),
                log      = [],
                modules  = [],
                warnings = false;

            if ( err ) {
                log.push('FATAL ERROR', err);
            } else {
                //console.log(json);
                // general info
                log.push('********************************');
                log.push('hash:\t'    + json.hash);
                log.push('version:\t' + json.version);
                log.push('time:\t'    + json.time + ' ms');
                log.push('********************************');

                // title and headers
                log.push('ASSETS');
                log.push('\tSize\tName');
                // data
                json.assets.forEach(function ( asset ) {
                    log.push('\t' + asset.size + '\t' + asset.name);
                });

                // title and headers
                log.push('MODULES');
                log.push('\tID\tSize\tErrs\tWarns\tName');

                // sort modules by name (not always is necessary)
                //json.modules.sort(function ( a, b ) { return a.name.toLowerCase().localeCompare(b.name.toLowerCase()); });

                // data
                json.modules.forEach(function ( module ) {
                    var id = path.relative(app.paths.root, module.identifier);

                    modules.push(id);

                    log.push('\t' +
                        module.id + '\t' +
                        module.size + '\t' +
                        (module.errors > 0 ? module.errors : '0') + '\t' +
                        (module.warnings > 0 ? module.warnings : '0') + '\t' +
                        //(module.name.indexOf('./~/') === 0 ? module.name.replace(/\//g, '/'.grey) : module.name.bold.replace(/\//g, '/'.grey))
                        (id.indexOf('node_modules') === 0 ? id : id)
                    );
                });

                json.errors.forEach(function ( error, errorIndex ) {
                    log.push(('ERROR #' + errorIndex));
                    error.split('\n').forEach(function ( line, lineIndex ) {
                        if ( lineIndex === 0 ) {
                            log.push(line);
                        } else {
                            log.push('\t' + line);
                        }
                    });
                });

                if ( warnings ) {
                    json.warnings.forEach(function ( warning, warningIndex ) {
                        log.push(('WARNING #' + warningIndex));
                        warning.split('\n').forEach(function ( line, lineIndex ) {
                            if ( lineIndex === 0 ) {
                                log.push(line);
                            } else {
                                log.push('\t' + line);
                            }
                        });
                    });
                }

                // save cache
                if ( json.errors.length === 0 ) {
                    jsonCurr = JSON.stringify(modules, null, 4);

                    if ( jsonCurr !== jsonSave ) {
                        fs.mkdir(profile.data.cache, function () {
                            var file = path.join(profile.data.cache, profile.name + '.json');

                            fs.writeFileSync(file, jsonCurr);

                            profile.notify({
                                title: 'cache',
                                message: 'write ' + file,
                                tags: ['cache']
                            });

                            jsonSave = jsonCurr;
                        });
                    }
                }
            }

            profile.notify({
                title: plugin.entry,
                message: log.join('\n')
            });
        },
        watcher;

    // main entry task
    profile.watch(
        profile.task(plugin.entry, function ( done ) {
            compiler.run(function ( error, stats ) {
                report(error, stats);
                done();
            });
        })
    );

    //profile.task('stop', function ( done ) {
    //    watcher.close(done);
    //});
	//
    //profile.task('watch', function ( done ) {
    //    watcher = compiler.watch(profile.data.webpack.watchOptions, report);
    //});

    // remove the generated file
    profile.task('clean', function ( done ) {
        var target = path.join(profile.data.webpack.output.path, profile.data.webpack.output.filename);

        fs.unlink(target, function ( error ) {
            profile.notify({
                type: error ? 'warn' : 'info',
                title: 'clean',
                message: error || ('delete ' + target)
            });

            done();
        });
    });
});

//console.log(plugin);

// public
module.exports = plugin;


return;

/*
var path     = require('path'),
    util     = require('util'),
    gulp     = require('gulp'),
    plumber  = require('gulp-plumber'),
    wpStream = require('webpack-stream'),
    webpack  = require('webpack'),
    log      = require('gulp-util').log,
    del      = require('del'),
    load     = require('require-nocache')(module),
    wpkFile  = path.join(process.env.PATH_ROOT, 'node_modules', 'webpack', 'package.json'),
    entry    = path.join(process.env.PATH_SRC, 'js', 'main.js'),
    outPath  = path.join(process.env.PATH_APP, 'js'),
    warnings = false;


/!**
 * Callback to output the statistics.
 *
 * @param {Object} err problem description structure if any
 * @param {Object} stats data to report
 *!/
function report ( err, stats ) {
    var json  = stats.toJson({source:false}),
        title = 'webpack '.inverse;

    if ( err ) {
        log(title, 'FATAL ERROR'.red, err);
    } else {
        // general info
        log(title, '********************************'.grey);
        log(title, 'hash:\t'    + json.hash.bold);
        log(title, 'version:\t' + json.version.bold);
        log(title, 'time:\t'    + json.time.toString().bold + ' ms');
        log(title, '********************************'.grey);

        // title and headers
        log(title, 'ASSETS'.green);
        log(title, '\tSize\tName'.grey);
        // data
        json.assets.forEach(function ( asset ) {
            log(title, '\t' + asset.size + '\t' + asset.name.bold);
        });

        // title and headers
        log(title, 'MODULES'.green);
        log(title, '\tID\tSize\tErrs\tWarns\tName'.grey);

        // sort modules by name (not always is necessary)
        //json.modules.sort(function ( a, b ) { return a.name.toLowerCase().localeCompare(b.name.toLowerCase()); });

        // data
        json.modules.forEach(function ( module ) {
            log(title, '\t' +
                module.id + '\t' +
                module.size + '\t' +
                (module.errors > 0 ? module.errors.toString().red : '0') + '\t' +
                (module.warnings > 0 ? module.warnings.toString().yellow : '0') + '\t' +
                (module.name.indexOf('./~/') === 0 ? module.name.replace(/\//g, '/'.grey) : module.name.bold.replace(/\//g, '/'.grey))
            );
        });

        json.errors.forEach(function ( error, errorIndex ) {
            log(title, ('ERROR #' + errorIndex).red);
            error.split('\n').forEach(function ( line, lineIndex ) {
                if ( lineIndex === 0 ) {
                    log(title, line.bold);
                } else {
                    log(title, '\t' + line.grey);
                }
            });
        });

        if ( warnings ) {
            json.warnings.forEach(function ( warning, warningIndex ) {
                log(title, ('WARNING #' + warningIndex).yellow);
                warning.split('\n').forEach(function ( line, lineIndex ) {
                    if ( lineIndex === 0 ) {
                        log(title, line.bold);
                    } else {
                        log(title, '\t' + line.grey);
                    }
                });
            });
        }
    }
}


function compile ( config, mode, done ) {
    var options = config[mode];

    webpack(options, function ( error, stats ) {
        console.log(error);
        console.log(stats);

        done();
    });
}


// task set was turned off in gulp.js
if ( !config ) {
    // do not create tasks
    return;
}


// remove all generated js/map files
gulp.task('webpack:clean', function () {
    return del([
        path.join(process.env.PATH_APP, 'js', 'release.js'),
        path.join(process.env.PATH_APP, 'js', 'develop.js'),
        path.join(process.env.PATH_APP, 'js', 'develop.map')
    ]);
});


// generate js files
gulp.task('webpack:develop', function () {
    return gulp
        .src(path.join('node_modules', process.env.TARGET + '-develop', 'index.js'))
        .pipe(plumber())
        .pipe(wpStream({
            output: {
                filename: 'develop.js',
                pathinfo: true,
                sourcePrefix: '\t\t\t'
            },
            resolve: {
                root: [
                    // to use both app and *-develop sources
                    path.join(process.env.PATH_ROOT, process.env.PATH_SRC),
                    path.join(process.env.PATH_ROOT, 'node_modules', process.env.TARGET + '-develop')
                ],
                extensions:['', '.js']
            },
            devtool: 'source-map',
            node: {
                console: false,
                process: true,
                global: false,
                buffer: false,
                __filename: true,
                __dirname: true
            },
            debug: true,
            cache: false,
            plugins: [
                // fix compilation persistence
                new webpack.optimize.OccurenceOrderPlugin(true),
                // global constants
                new webpack.DefinePlugin({
                    DEBUG: true
                })
            ]
        }, null, report))
        .pipe(gulp.dest(outPath));
});


// generate js files
gulp.task('webpack:release', function () {
    var pkgInfo = load(process.env.PACKAGE),
        wpkInfo = load(wpkFile);

    return gulp
        .src(entry)
        .pipe(plumber())
        .pipe(wpStream({
            output: {
                filename: 'release.js'
            },
            resolve: {
                extensions:['', '.js']
            },
            debug: false,
            cache: false,
            plugins: [
                // fix compilation persistence
                new webpack.optimize.OccurenceOrderPlugin(true),
                // global constants
                new webpack.DefinePlugin({
                    DEBUG: false
                }),
                // obfuscation
                new webpack.optimize.UglifyJsPlugin({
                    // this option prevents name changing
                    // use in case of strange errors
                    // mangle: false,
                    sourceMap: false,
                    output: {
                        comments: false
                    },
                    /!*eslint camelcase:0 *!/
                    compress: {
                        warnings: true,
                        unused: true,
                        dead_code: true,
                        drop_console: true,
                        drop_debugger: true,
                        pure_funcs: ['debug.assert', 'debug.log', 'debug.info', 'debug.inspect', 'debug.event', 'debug.stub', 'debug.time', 'debug.timeEnd']
                    }
                }),
                // add comment to the top of app.js
                new webpack.BannerPlugin(util.format(
                    '%s: v%s (webpack: v%s)',
                    pkgInfo.name, pkgInfo.version, wpkInfo.version
                ))
            ]
        }, null, report))
        .pipe(gulp.dest(outPath));
});


// generate all js files
gulp.task('webpack', ['webpack:develop', 'webpack:release']);


// public
module.exports = {
    compile: compile
};
*/
