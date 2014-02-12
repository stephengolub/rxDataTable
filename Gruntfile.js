/* jshint node:true */
/* jshint camelcase:false */

var gruntConnectConfig = {
    app: 'docs',
    dist : 'dist',
    coverage: 'coverage',
    ngdocs: 'docs/ngdocs',
    open: {
        hostname: 'localhost',
        port: 9000
    },
    liveReloadPage: require('connect-livereload')({ port: 35729 }),
    proxyRequest: require('grunt-connect-proxy/lib/utils').proxyRequest,
    modRewrite: require('connect-modrewrite'),
    mountFolder : function (connect, dir) {
        return connect.static(require('path').resolve(dir));
    }
};

module.exports = function(grunt) {

    grunt.initConfig({
        cmpnt: grunt.file.readJSON('bower.json'),
        dist: 'dist',
        banner: '/*! rxDataTable v<%= cmpnt.version %> by Stephen Golub(stephen.golub@rackspace.com) - ' +
                'https://github.com/nickburns2006/rxDataTable - New BSD License */\n',
        clean: {
            working: {
                src: ['src/scripts/rx-data-table.js', 'src/styles/rx-data-table.css']
            }
        },

        copy: {
            styles: {
                files: [
                    {
                        src: './src/styles/rx-data-table.css',
                        dest: '<%= dist %>/styles/rx-data-table.css'
                    },
                    {
                        src: './src/scripts/rx-data-table.js',
                        dest: '<%= dist %>/scripts/rx-data-table.js'
                    }
                ]
            }
        },

        uglify: {
            js: {
                src: ['<%=dist %>/scripts/rx-data-table.js'],
                dest: '<%= dist %>/scripts/rx-data-table.min.js',
                options: {
                    banner: '<%= banner %>',
                    sourceMap: function(fileName) {
                        return fileName.replace(/\.js$/, '.map');
                    }
                }
            }
        },

        concat: {
            js: {
                src: [
                    'src/scripts/rx-data-table.src.js',
                    'src/scripts/paginate.js',
                    'src/scripts/rx-data-table.tpls.js'
                ],
                dest: 'src/scripts/rx-data-table.js'
            }
        },

        less: {
            css: {
                files: {
                    'src/styles/rx-data-table.css': 'src/styles/rx-data-table.less'
                }
            }
        },

        cssmin: {
            css: {
                files: {
                    '<%= dist %>/styles/rx-data-table.min.css': '<%= dist %>/styles/rx-data-table.css'
                },
                options: {
                    banner: '<%= banner %>'
                }
            }
        },

        ngTemplateCache: {
            views: {
                files: {
                    'src/scripts/rx-data-table.tpls.js': 'src/templates/**/*.html'
                },
                options: {
                    trim: '',
                    module: 'rxDataTable'
                }
            },
            demoViews: {
                files: {
                    'docs/src/scripts/templates.js': 'docs/templates/**/*.html'
                },
                options: {
                    trim: '',
                    module: 'demo'
                }
            }
        },

        karma: {
            options: {
                configFile: 'karma.conf.js',
            },
            dev: {
                singleRun: false
            },
            single: {
                singleRun: true
            },
            full: {
                singleRun: true,
                browsers: ['PhantomJS', 'Chrome', 'ChromeCanary', 'Firefox', 'Safari']
            }
        },

        shell: {
            protractor: {
                options: {
                    stdout: true
                },
                command: function (file) {
                    var localConfigFile = 'test/protractor.conf.local.js';
                    var defaultConfigFile = 'test/protractor.conf.js';
                    var configFile =  grunt.file.isFile(localConfigFile) ? localConfigFile : defaultConfigFile;
                    var cmd = 'protractor ' + configFile;

                    if (typeof file !== 'undefined' && file.length > 0) {
                        cmd += ' --specs ' + file;
                    }

                    return cmd;
                }
            },
            commitPush: {
                options: {
                    stdout: true
                },
                command: [
                    'git checkout master',
                    'git pull',
                    'git add .',
                    'git commit -m "Build: Committing auto-generated reports"',
                    'git push origin master'
                ].join('&&')
            },
            hooks: {
                command: [
                    'rm -f ./.git/hooks/pre-commit',
                    'cp git-hooks/pre-commit ./.git/hooks/',
                    'chmod u+x ./.git/hooks/pre-commit'
                ].join(' && ')
            },
            linkBower: {
                command: [
                    'cd ./docs/',
                    'ln -s ../bower_components .',
                    'cd ../'
                ].join(' && ')
            }
        },

        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            scripts: [
                'src/scripts/*.src.js',
                'src/scripts/**/*.src.js',
            ],
            specs: [
                'src/scripts/*.spec.js',
                'src/scripts/**/*.spec.js'
            ],
            misc: [ 'Gruntfile.js',
                    'test/mock-app/src/*.js',
                    'test/mock-app/src/**/*.js' ]
        },

        coveralls: {
            options: {
                debug: true,
                coverage_dir: 'coverage/'
            }
        },

        ngdocs: {
            options: {
                'dest': 'docs/ngdocs',
                'title': 'rxDataTable Developer Documentation',
                'html5Mode': false
            },
            guides: {
                src: ['guides/**/*.ngdoc'],
                title: 'rxDataTable Developer Guides'
            },
            all: ['src/scripts/**/*.js']
        },

        stubby: {
            stubsServer: {
                files: [{
                    src: [ 'test/api-mocks/requests/*.yaml',
                           'test/api-mocks/requests/**/*.yaml' ]
                }]
            }
        },

        watch: {
            scripts: {
                files: ['Gruntfile.js', 'src/scripts/**/*.js', '!src/scripts/**/*.spec.js'],
                tasks: ['jshint:scripts', 'karma:single', 'dev'],
                options: {
                    livereload: 35730
                }
            },
            specs: {
                files: ['app/scripts/**/*.spec.js'],
                tasks: ['jshint:specs', 'karma:single'],
                options: {
                    livereload: false
                }
            },
            css: {
                files: ['app/styles/**/*.less'],
                tasks: ['less', 'dev'],
                options: {
                    livereload: 35730
                }
            },
            html: {
                files: ['app/index.html', 'app/views/{,*/}*.html'],
                tasks: ['dev'],
                options: {
                    livereload: 35730
                }
            }
        },

        connect: {
            options: {
                port: 9000,
                hostname: 'localhost'
            },
            proxies: [
                {
                    context: '/api',
                    host: 'localhost',
                    port: 8882,
                    https: false,
                    changeOrigin: false,
                    rewrite: {
                        '/api': '/api',
                        '/ngdocs': '/ngdocs'
                    }
                }
            ],
            livereload: {
                options: {
                    middleware: function(cnct) {
                        var config = gruntConnectConfig;
                        return [
                            config.proxyRequest,
                            config.modRewrite([ '^/ngdocs/$ /ngdocs/index.html', '!\\.\\w+$ /' ]),
                            config.liveReloadPage,
                            config.mountFolder(cnct, '.tmp'),
                            config.mountFolder(cnct, config.app)
                        ];
                    }
                }
            },
            test: {
                options: {
                    middleware: function(cnct) {
                        var config = gruntConnectConfig;
                        return [
                            config.proxyRequest,
                            config.modRewrite(['!\\.html|\\.js|\\.css|\\.png$ /index.html [L]']),
                            config.liveReloadPage,
                            config.mountFolder(cnct, '.tmp'),
                            config.mountFolder(cnct, config.app)
                        ];
                    }
                }
            },
            dist: {
                options: {
                    middleware: function(cnct) {
                        var config = gruntConnectConfig;
                        return [
                            config.mountFolder(cnct, config.dist)
                        ];
                    }
                }
            },
            docs: {
                options: {
                    middleware: function (cnct) {
                        var config = gruntConnectConfig;
                        return [
                            config.mountFolder(cnct, config.ngdocs)
                        ];
                    }
                }
            }
        },
        bump: {
            options: {
                files: ['package.json', 'bower.json'],
                commit: true,
                commitMessage: 'Release v%VERSION%',
                commitFiles: ['-a'], // '-a' for all files
                createTag: true,
                tagName: 'v%VERSION%',
                tagMessage: 'Version %VERSION%',
                push: true,
                pushTo: 'origin',
                gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d' // options to use with '$ git describe'
            }
        },
        'gh-pages': {
            options: {
                base: './docs/'
            },
            src: ['./**/*', './bower_components', './dist', './api-mocks']
        },
        markdown: {
            all: {
                files: {
                    'docs/templates/main.html': 'README.md'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-hustler');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-karma-coveralls');
    grunt.loadNpmTasks('grunt-shell');
    grunt.loadNpmTasks('grunt-ngdocs');
    grunt.loadNpmTasks('grunt-stubby');
    grunt.loadNpmTasks('grunt-bump');
    grunt.loadNpmTasks('grunt-gh-pages');
    grunt.loadNpmTasks('grunt-markdown');

    grunt.registerTask('dev', [
        'clean',
        'ngTemplateCache',
        'concat',
        'less',
        'copy'
    ]);

    grunt.registerTask('docs', [
        'ngdocs',
        'markdown',
        'ngTemplateCache:demoViews'
    ]);

    grunt.registerTask('default', [
        'dev',
        'uglify',
        'cssmin',
        'docs'
    ]);

    grunt.registerTask('serve', [
        'shell:linkBower',
        'connect:livereload',
        'stubby',
        'watch'
    ]);

    grunt.registerTask('release', [
        'default',
        'bump',
        'gh-pages'
    ]);

    // TODO: Testing/page objects
    // grunt.registerTask('test', [
    //     // Note: This tasks requires a stubbed server already running
    //     'karma',
    //     'shell:protractor'
    // ]);

};
