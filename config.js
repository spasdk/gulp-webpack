/**
 * Webpack configuration for webpack gulp task.
 *
 * @author Stanislav Kalashnik <darkpark.main@gmail.com>
 * @license GNU GENERAL PUBLIC LICENSE Version 3
 */

'use strict';

var path     = require('path'),
    extend   = require('extend'),
    webpack  = require('webpack'),
    config   = require('spa-gulp/config'),
    entry    = path.resolve(path.join(config.source, 'js', 'main.js')),
    profiles = {};


// main
profiles.default = extend(true, {}, config, {
    // main entry point
    source: entry,

    // intended output file
    target: path.join(config.target, 'js', 'release.js'),

    // local variables available in the source files
    variables: {
        DEVELOP: false
    },

    // the writing location for the source map file
    sourceMap: '',

    // choose a developer tool to enhance debugging
    devtool: false,

    plugins: [
        // fix compilation persistence
        //new webpack.optimize.OccurenceOrderPlugin(true),
        // global constants
        new webpack.DefinePlugin({
            DEVELOP: false
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
        new webpack.BannerPlugin(//util.format(
            '%s: v%s (webpack: v%s)'
            //pkgInfo.name, pkgInfo.version, wpkInfo.version
        )
    ],

    // info channels
    notifications: {
        popup: {
            info: {icon: path.join(__dirname, 'media', 'info.png')},
            warn: {icon: path.join(__dirname, 'media', 'warn.png')},
            fail: {icon: path.join(__dirname, 'media', 'fail.png')}
        }
    }
});


profiles.develop = extend(true, {}, profiles.default, {

});


// public
module.exports = profiles;
