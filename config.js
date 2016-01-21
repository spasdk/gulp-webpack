/**
 * Webpack configuration for webpack gulp task.
 *
 * @author Stanislav Kalashnik <darkpark.main@gmail.com>
 * @license GNU GENERAL PUBLIC LICENSE Version 3
 */

'use strict';

var path   = require('path'),
    extend = require('extend'),
    config = require('spa-gulp/config'),
    entry  = path.resolve(path.join(config.default.source, 'js', 'main.js'));


// base config
// each profile inherits all options from the "default" profile
module.exports = extend(true, {}, config, {
    default: {
        // main entry point
        source: entry,

        // intended output file
        target: path.join(config.default.target, 'js', 'release.js'),

        // local variables available in the source files
        variables: {
            DEBUG: false
        },

        // the writing location for the source map file
        sourceMap: '',

        // choose a developer tool to enhance debugging
        devtool: false,

        // info channels
        notifications: {
            popup: {
                info: {
                    icon: path.join(__dirname, 'media', 'info.png')
                },
                warn: {
                    icon: path.join(__dirname, 'media', 'warn.png')
                },
                fail: {
                    icon: path.join(__dirname, 'media', 'fail.png')
                }
            }
        }
    },

    develop: {
        source: [
            'spa-develop',
            entry
        ],

        target: path.join(config.default.target, 'js', 'develop.js'),

        variables: {
            DEBUG: true
        }

        //devtool: 'eval'
    }
});
