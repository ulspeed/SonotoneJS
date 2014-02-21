// This Gruntfile defines the list of automation tasks that can be launched when developping, testing or producing new version of SonotoneJS
module.exports = function(grunt) {
   "use strict";
    grunt.initConfig({

        //### Get Configuration data
        cfg: grunt.file.readJSON('package.json'),

        license: grunt.file.read('LICENSE'),

        jshint: {
            dist: {
                options: {
                    jshintrc: '.jshintrc'
                },
                src: [
                    'src/**/*.js',
                    './GruntFile.js',
                    './package.json'
                ]
            },
        },

        concat: {
            options: {
                separator: '',
                banner: '(function(){',
                footer: '}).call(this);',
            },
           
            dist: {
                src: [
                    'src/main.js', 
                    'src/io.js',
                    'src/peer/capabilities.js',
                    'src/webrtc/adapter.js',
                    'src/stream/localMedia.js',
                    'src/stream/remoteMedia.js', 
                    'src/transport/remote.js',
                    'src/transport/websocket.js',
                    'src/transport/socketio.js',
                    'src/transport/sip.js',
                    'src/webrtc/peerconnection.js',
                    'src/webrtc/datachannel.js',
                    'src/event/events.js'
                ],
                dest: 'dist/sonotone.js',
            },
        },

        watch: {
            src: {
                files: 'src/**/*.js',
                tasks: ['jshint', 'concat', 'uglify', 'usebanner', 'test'],
                options: {
                    livereload: true
                }
            }
        },

        usebanner: {
            dist: {
                options: {
                    position: 'top',
                    banner: '/* \n\n' +
                            '<%= cfg.name %> - v<%= cfg.version %>' + '\n<%= cfg.description %>' + '\nBuild date <%= grunt.template.today("yyyy-mm-dd") %>\n' +
                            '<%= license %>' +
                            '\n\n*/\n'
                },
                files: {
                    src: [ 'dist/sonotone.js', 'dist/sonotone-min.js' ]
                }
            }
        },

        uglify: {
            options: {
                sourceMap: 'dist/sonotone-map.js',
                beautify: false,
                compress: true,
                report: 'gzip'
            },
            dist: {
                files: {
                    'dist/sonotone-min.js': ['dist/sonotone.js']
                }
            }
        },

        blanket_qunit: {
            all: {
                options: {
                    urls: ['test/run.html?coverage=true&gruntReport'],
                    threshold: 10
                }
            }
        }


    });

    //### Load Grunt plugins
    //These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-clean');      // Clean directories
    grunt.loadNpmTasks('grunt-contrib-jshint');     // Code source Linter
    grunt.loadNpmTasks('grunt-contrib-watch');      // Code source Watcher
    grunt.loadNpmTasks('grunt-contrib-concat');     // Code source concat
    grunt.loadNpmTasks('grunt-notify');             // Notify 
    grunt.loadNpmTasks('grunt-banner');             // License
    grunt.loadNpmTasks('grunt-contrib-uglify');     // Code source uglification
    grunt.loadNpmTasks('grunt-contrib-qunit');      // For Qunit/SinonJS tests
    grunt.loadNpmTasks('grunt-blanket-qunit');      // For Code coverage

    //### Main Tasks
    //Execute <code>grunt</code> to launch the default task: <code>watch</code>
    grunt.registerTask('default', ['watch']);

    //Execute all tasks for building the Sonotone.js library
    grunt.registerTask('build', ['jshint', 'concat', 'uglify', 'usebanner']);

    grunt.registerTask('test', ['blanket_qunit']);

 };