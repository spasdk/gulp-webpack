/**
 * @author Stanislav Kalashnik <darkpark.main@gmail.com>
 * @license GNU GENERAL PUBLIC LICENSE Version 3
 */

'use strict';

var fs      = require('fs'),
    path    = require('path'),
    webpack = require('webpack'),
    PluginTemplate = require('spa-plugin');


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


/**
 * @constructor
 * @extends PluginTemplate
 *
 * @param {Object} config init parameters (all inherited from the parent)
 */
function Plugin ( config ) {
    var self = this;

    // parent constructor call
    PluginTemplate.call(this, config);

    // create tasks for profiles
    this.profiles.forEach(function ( profile ) {
        var compiler = webpack(profile.data.webpack),
            //jsonSave = '',
            //jsonCurr = '',
            taskName = profile.task(self.entry, function ( done ) {
                compiler.run(function ( error, stats ) {
                    report(error, stats);
                    done();
                });
            }),
            report   = function ( err, stats ) {
                var json     = stats.toJson({source: false}),
                    log      = [],
                    modules  = [],
                    warnings = false,
                    msg      = {
                        info: 'write ' + path.join(profile.data.webpack.output.path, profile.data.webpack.output.filename),
                        tags: [self.entry]
                    };

                if ( err ) {
                    log.push('FATAL ERROR', err);

                    msg.type = 'fail';
                    msg.data = err;
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
                        var id = path.relative(self.app.paths.root, module.identifier);

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

                    msg.type = json.warnings.length ? 'warn' : (json.errors.length ? 'fail' : 'info');
                    msg.data = json.warnings.length ? json.warnings : (json.errors.length ? json.errors : json.modules);

                    // save cache
                    if ( json.errors.length === 0 ) {
                        //jsonCurr = JSON.stringify(modules, null, 4);

                        //if ( jsonCurr !== jsonSave ) {
                            /*fs.mkdir(profile.data.cache, function () {
                                var file = path.join(profile.data.cache, profile.name + '.json');

                                fs.writeFileSync(file, jsonCurr);

                                profile.notify({
                                    title: 'cache',
                                    info: 'write ' + file,
                                    tags: ['cache']
                                });

                                jsonSave = jsonCurr;
                            });*/
                        //}
                    }

                    self.debug('\n' + log.join('\n') + '\n');
                }

                profile.notify(msg);

                /*profile.notify({
                    //message: log.join('\n')
                    type: type,
                    info: 'write ' + path.join(profile.data.webpack.output.path, profile.data.webpack.output.filename),
                    tags: [self.entry],
                    data: json
                });*/
            },
            watcher;

        // rebuild on files change
        profile.task('watch', function ( done ) {
            watcher = self.watch(profile.data.watch, taskName);
            watcher.done = done;
        });

        // stop watching
        profile.task('unwatch', function () {
            if ( watcher ) {
                // finish chokidar
                watcher.close();
                // complete the initial task
                watcher.done();
                // clear
                watcher = null;
            }
        });

        // remove the generated file
        profile.task('clean', function ( done ) {
            var target = path.join(profile.data.webpack.output.path, profile.data.webpack.output.filename);

            fs.unlink(target, function ( error ) {
                var msg = {
                    info: 'delete ' + target,
                    tags: ['clean']
                };

                if ( error ) {
                    msg.type = 'warn';
                    msg.data = error;
                }

                profile.notify(msg);

                done();
            });
        });
    });

    this.debug('tasks: ' + Object.keys(this.tasks).sort().join(', '));
}


// inheritance
Plugin.prototype = Object.create(PluginTemplate.prototype);
Plugin.prototype.constructor = Plugin;


// public
module.exports = Plugin;
