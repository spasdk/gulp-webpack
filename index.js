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
            var json     = stats.toJson({source: false}),
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
                                info: 'write ' + file,
                                tags: ['cache']
                            });

                            jsonSave = jsonCurr;
                        });
                    }
                }
            }

            profile.notify({
                title: plugin.entry,
                //message: log.join('\n')
                info: 'write ' + path.join(profile.data.webpack.output.path, profile.data.webpack.output.filename),
                message: json
            });
        };
        //watcher;

    // main entry task
    profile.watch('', profile.data.watch,
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
                info: 'delete ' + target,
                message: error ? error.message : ''
            });

            done();
        });
    });
});

//console.log(plugin);

// public
module.exports = plugin;
