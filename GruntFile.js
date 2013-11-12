//This Gruntfile defines the list of automation tasks that can be launched when developping, testing or producing new version of **OTC for Browsers**
//
//To install all the Grunt plugins needed:
//1. Go to the </code>coco</code> directory
//2. Launch <code>npm install</code>
module.exports = function(grunt) {
   "use strict";
    grunt.initConfig({

        //### Get Configuration data
        cfg: grunt.file.readJSON('package.json'),

        license: grunt.file.read('LICENSE'),

        jshint: {
            all: {
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
                    'src/stream/localMedia.js',
                    'src/stream/remoteMedia.js', 
                    'src/transport/remote.js',
                    'src/transport/websocket.js',
                    'src/transport/socketio.js',
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
                tasks: ['jshint', 'concat', 'uglify', 'usebanner']
            }
        },

        usebanner: {
            taskName: {
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
            production: {
                files: {
                    'dist/sonotone-min.js': ['dist/sonotone.js']
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

    //### Main Tasks
    //Execute <code>grunt</code> to launch the default task: <code>watch</code>
    grunt.registerTask('default', ['watch']);

    //Execute all tasks for building the Sonotone.js library
    grunt.registerTask('build', ['jshint', 'concat', 'uglify', 'usebanner']);

 };