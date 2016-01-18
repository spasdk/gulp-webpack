/**
 * Webpack configuration for webpack gulp task.
 *
 * @author Stanislav Kalashnik <darkpark.main@gmail.com>
 * @license GNU GENERAL PUBLIC LICENSE Version 3
 */

'use strict';

var path   = require('path'),
    extend = require('extend'),
    config = require('spa-gulp/config');


// base config
// each profile inherits all options from the "default" profile
module.exports = extend(true, {}, config, {
    default: {
        // main entry point
        source: path.join(config.default.source, 'js', 'main.js'),

        // intended output file
        target: path.join(config.default.target, 'js', 'release.js'),

        //// whether to use space or tab character for indentation
        //indentType: 'space',
        //
        //// the number of spaces or tabs to be used for indentation
        //indentWidth: 4,
        //
        //// whether to use cr, crlf, lf or lfcr sequence for line break
        //linefeed: 'lf',
        //
        //// output format of the final CSS style
        //// options: nested, expanded, compact, compressed
        //outputStyle: 'compressed',
        //
        //// how many digits after the decimal will be allowed
        //precision: 2,
        //
        //// additional debugging information in the output file as CSS comments
        //sourceComments: false,

        // the writing location for the source map file
        // options: file name, true - inline source map, false - disable
        sourceMap: false

        //// whether to include the source files content in the source map
        //// bigger map file but no need to serve source scss files
        //sourceMapContents: false
    },

    develop: {
        target: path.join(config.default.target, 'js', 'develop.js'),

        sourceMap: path.join(config.default.target, 'js', 'develop.map')
    }
});
