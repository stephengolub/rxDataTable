/* jshint node:true */
module.exports = function(config) {
    config.set({
        // base path, that will be used to resolve files and exclude
        basePath: '',

        // frameworks to use
        frameworks: ['mocha', 'chai', 'sinon-chai'],


        // list of files / patterns to load in the browser
        files: [
            'bower_components/jquery/jquery.min.js',
            'bower_components/angular/angular.js',
            'bower_components/angular-animate/angular-animate.js',
            'bower_components/angular-mocks/angular-mocks.js',
            'bower_components/angular-sanitize/angular-sanitize.js',
            'bower_components/angular-xeditable/dist/js/xeditable.js',
            'bower_components/lodash/dist/lodash.js',
            'test/browser-helpers.js',
            'src/styles/*.css',
            'src/templates/*.html',
            'src/scripts/rx-data-table.src.js',
            'src/scripts/paginate.js',
            'src/scripts/rx-data-table.spec.js',
            'src/scripts/paginate.spec.js'
        ],

        // list of files to exclude
        exclude: [
        ],

        preprocessors: {
            'src/templates/*.html': 'ng-html2js',
            'src/scripts/!(*.spec).js': ['coverage']
        },


        // test results reporter to use
        // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
        reporters: ['progress', 'coverage'],

        coverageReporter: {
            type : 'html',
            dir : './coverage/'
        },

        // web server port
        port: 9876,


        // enable / disable colors in the output (reporters and logs)
        colors: true,


        // level of logging
        // possible values:
        //  config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_WARN,


        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,


        // Start these browsers, currently available:
        // - Chrome
        // - ChromeCanary
        // - Firefox
        // - Opera
        // - Safari (only Mac)
        // - PhantomJS
        // - IE (only Windows)
        browsers: ['PhantomJS'],


        // If browser does not capture in given timeout [ms], kill it
        captureTimeout: 60000,


        // Continuous Integration mode
        // if true, it capture browsers, run tests and exit
        singleRun: false
    });
};
