/**
 * @author Stanislav Kalashnik <darkpark.main@gmail.com>
 * @license GNU GENERAL PUBLIC LICENSE Version 3
 */

'use strict';

var util     = require('util'),
    path     = require('path'),
    extend   = require('extend'),
    webpack  = require('webpack'),
    config   = require('spasdk/config'),
    pkgData  = require(path.join(process.cwd(), 'package.json')),
    wpkData  = require(path.join(path.dirname(require.resolve('webpack')), '..', 'package.json')),
    srcPath  = path.join(config.source, 'js'),
    dstPath  = path.join(config.target, 'js'),
    profiles = {};


// main
profiles.default = extend(true, {}, config, {
    // source files location
    source: srcPath,

    // output files location
    target: dstPath,

    // dir for temp files
    cache: path.join(srcPath, '.cache'),

    // build config
    webpack: {
        // the entry point for the bundle
        entry: './' + path.join(srcPath, 'main.js'),

        // options affecting the output of the compilation
        output: {
            filename: 'release.js',
            path: dstPath,
            sourceMapFilename: 'release.map'
        },

        // options affecting the normal modules
        // NormalModuleFactory
        module: {
            // don't parse files matching
            // they are expected to have no call to require, define or similar
            noParse: [/\.min\.js$/, /livereload\.js$/],

            loaders: [
                //{
                //    test: /cjs-validator/,
                //    loader: 'less'
                //}
            ]
        },

        // rebuilds on file change mode
        watchOptions: {
            // delay the rebuilt after the first change (in ms)
            aggregateTimeout: 50
        },

        // choose a developer tool to enhance debugging
        devtool: 'source-map',

        // additional functionality
        plugins: [
            //new webpack.IgnorePlugin(/cjs-validator/),
            // fix compilation persistence
            //new webpack.optimize.OccurenceOrderPlugin(true),
            // global constants
            new webpack.DefinePlugin({
                DEBUG: false,
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
                /* eslint camelcase: 0 */
                compress: {
                    warnings: true,
                    unused: true,
                    dead_code: true,
                    drop_console: true,
                    drop_debugger: true,
                    pure_funcs: [
                        'debug.assert', 'debug.log', 'debug.info', 'debug.inspect', 'debug.event', 'debug.stub', 'debug.time', 'debug.timeEnd'
                    ]
                }
            }),
            // add comment to the top of app.js
            new webpack.BannerPlugin(util.format(
                '%s v%s (webpack: v%s)',
                pkgData.name, pkgData.version, wpkData.version
            ))
        ]
    },

    // false to prevent watch task creation
    // otherwise array of globs to monitor
    watch: [path.join(config.source, 'js', '**', '*.js')],

    // info channels
    notifications: {
        popup: {
            info: {icon: path.join(__dirname, 'media', 'info.png')},
            warn: {icon: path.join(__dirname, 'media', 'warn.png')},
            fail: {icon: path.join(__dirname, 'media', 'fail.png')}
        }
    }
});


// additional
profiles.develop = extend(true, {}, profiles.default, {
    // build config
    webpack: {
        // options affecting the output of the compilation
        output: {
            pathinfo: true,
            filename: 'develop.js',
            sourceMapFilename: 'develop.map'
        },

        // choose a developer tool to enhance debugging
        //devtool: 'eval',

        // polyfills or mocks
        node: {
            Buffer: false,
            __filename: true,
            __dirname: true
        }
    }
});

// overwrite all plugins
profiles.develop.webpack.plugins = [
    // global constants
    new webpack.DefinePlugin({
        DEBUG: true,
        DEVELOP: true,
        LIVERELOAD: require('spa-plugin-livereload/config').default.tinylr
    })
];


// public
module.exports = profiles;
