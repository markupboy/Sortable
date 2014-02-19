module.exports = (grunt) ->

  # Project configuration
  grunt.initConfig

    pkg: grunt.file.readJSON('package.json')
    version: src: ['<%= pkg.exportName %>.js', 'bower.json']

    coffee:
      compile:
        files:
          'dist/Sortable.js': 'Sortable.coffee'

    uglify:
      options:
        banner: '/*! <%= pkg.exportName %> <%= pkg.version %> - <%= pkg.license %> | <%= pkg.repository.url %> */\n'
      dist:
        files:
          'dist/<%= pkg.exportName %>.min.js': ['dist/<%= pkg.exportName %>.js']

    watch:
      app:
        files: ['*.coffee', '*.js', '*.html']
        tasks: ['default']



  # Load the plugins
  tasks = [
    'grunt-version'
    'grunt-contrib-coffee',
    'grunt-contrib-watch',
    'grunt-contrib-uglify',
  ]
  grunt.loadNpmTasks task for task in tasks


  # Default task.
  grunt.registerTask 'default', ['coffee', 'version', 'uglify']
