/* jshint node:true */
module.exports = function(grunt) {

    grunt.initConfig({
        cmpnt: grunt.file.readJSON('bower.json'),
        dist: "dist",
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
                    trim: 'src/templates/',
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
        }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-hustler');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-shell');

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
        'cssmin'
    ]);

    grunt.registerTask('test', [
        'karma'
    ]);
};
