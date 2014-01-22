/* jshint node:true */
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
                    'rm -f ../.git/hooks/pre-commit',
                    'cp tasks/git-hooks/pre-commit ../.git/hooks/',
                    'chmod u+x ../.git/hooks/pre-commit'
                ].join(' && ')
            }
        },
        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            all: [
                'Gruntfile.js',
                'src/scripts/paginate.js',
                'src/scripts/paginate.spec.js',
                'src/scripts/rx-data-table.src.js',
                'src/scripts/rx-data-table.spec.js',
                'test/**/*.js'
            ],
            scripts: [
                'src/scripts/paginate.js',
                'src/scripts/rx-data-table.src.js',
                '!app/scripts/**/*.spec.js'
            ],
            specs: [
                'app/scripts/**/*.spec.js'
            ]
        },
        ngdocs: {
            options: {
                'dest': 'dist/ngdocs',
                'title': 'rxDataTable Developer Documentation',
                'html5Mode': false
            },
            guides: {
                src: ['guides/**/*.ngdoc'],
                title: 'rxDataTable Developer Guides'
            },
            all: ['src/scripts/**/*.js']
        }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-hustler');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-shell');
    grunt.loadNpmTasks('grunt-ngdocs');

    grunt.registerTask('dev', [
        'clean',
        'ngTemplateCache',
        'concat',
        'less',
        'copy'
    ]);

    grunt.registerTask('default', [
        'dev',
        'uglify',
        'cssmin',
        'ngdocs'
    ]);

    grunt.registerTask('test', [
        'karma'
    ]);
};
