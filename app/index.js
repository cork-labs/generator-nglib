'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var async = require('async');
var fs = require('fs');
var path = require('path');

module.exports = yeoman.generators.Base.extend({

  constructor: function () {
    var generator = this;

    yeoman.generators.Base.apply(this, arguments);

    generator.option('config', {
      type: String,
      required: false,
      desc: 'Seed .yo-rc.json with your data. Ex: --config http://example.com/mylib.yo-rc.json'
    });
    generator.option('tpl', {
      type: String,
      required: false,
      desc: 'Override generator templates. Provide a path "/to/templates" or a Github repository URL. Ex: --tpl git:github.com:user/repo.git'
    });
    generator.option('tpl-branch', {
      type: String,
      required: false,
      desc: 'If "--tpl" points to a Github repo, use this branch/tag. Ex: --tpl-branch v1.0.0',
      defaults: 'master'
    });
    generator.option('tpl-path', {
      type: String,
      required: false,
      desc: 'If "--tpl" points to a Github. repo, read overrides from this path.  Ex: --tpl-path path/to/templates',
      defaults: './'
    });
    generator.option('tpl-refresh', {
      type: Boolean,
      required: false,
      desc: 'Refresh remote cache.',
      defaults: false
    });
    generator.option('skip-interactive', {
      type: Boolean,
      required: false,
      desc: 'Skip all prompts and use only config from seeded .yo-rc.json. Requires --config to be set.',
      defaults: false
    });
    generator.option('skip-install', {
      type: Boolean,
      required: false,
      desc: 'Skip install steps (bower, npm, git and setup).',
      defaults: false
    });
  },

  initializing: function () {
    var generator = this;
    var done = this.async();

    generator.pkg = require('../package.json');
    generator.sourceRoot(path.join(__dirname, '../templates'));

    function rereadConfig(data) {
      if ('object' !== typeof data['generator-nglib']) {
        return;
      }
      for (var key in data['generator-nglib']) {
        generator.config.set(key, data['generator-nglib'][key]);
      }
    }

    function fetchConfig(source, cb) {

      if (!source) {
        return cb();
      }

      var destination = generator.destinationRoot() + '/.yo-rc.json';

      if (fs.existsSync(destination)) {
        generator.log('Settings file ".yo-rc.json" already exists.'.red);
        process.exit(1);
      }

      if (source.match('http')) {
        generator.fetch(source, generator.destinationRoot(), function (err) {
          if (err) {
            generator.log('Could not download config! ' + err.red);
            process.exit(1);
          }
          source = generator.destinationRoot() + '/' + path.basename(source);
          fs.renameSync(source, destination);
          var data = require(destination);
          rereadConfig(data);
          cb();
        });
      }
      else if (fs.existsSync(source)) {
        var data = require(source);
        var fd = fs.openSync(destination, 'w');
        fs.writeSync(fd, JSON.stringify(data));
        rereadConfig(data);
        cb();
      }
      else {
        generator.log('Parameter --config must be a URL or a local file!'.red);
        process.exit(1);
      }
    }

    fetchConfig(generator.options['config'], function () {
      return done();
    });
  },

  prompting: function () {
    var generator = this;
    var done = this.async();

    generator.data = {};

    function slugify(name) {
      name = name.replace(/\./g, '-');
      name = generator._.slugify(name);
      return name.replace(/-/g, '.');
    }

    var prompts = {
      'project.name': {
        type: 'input',
        message: 'Name of the project (human-readable)?',
        getValue: function () {
          return generator.config.get('project.name') || generator.appname;
        }
      },
      'project.description': {
        type: 'input',
        message: 'Project description (single line for docs and pkg managers)?',
        getValue: function () {
          return generator.config.get('project.description') || null;
        }
      },

      'bower.id': {
        type: 'input',
        message: 'Bower package name?',
        getValue: function () {
          return generator.config.get('bower.id') || slugify(prompts['project.name'].getValue());
        }
      },
      'npm.id': {
        type: 'input',
        message: 'Npm package name?',
        getValue: function () {
          return generator.config.get('npm.id') || prompts['bower.id'].getValue();
        }
      },

      'angular.module': {
        type: 'input',
        message: 'Name of the main AngularJS module?',
        getValue: function () {
          return generator.config.get('angular.module') || slugify(prompts['project.name'].getValue());
        }
      },
      'has.tpl': {
        type: 'confirm',
        message: 'Will the library contain template modules?',
        getLabel: function (value) {
          return !value ? 'no templates' : 'one or more template modules generated and distributed';
        },
        getValue: function () {
          return 'undefined' !== typeof generator.config.get('has.tpl') ? !!generator.config.get('has.tpl') : true;
        }
      },
      'has.less': {
        type: 'confirm',
        message: 'Will the library distribute CSS generated from LESS?',
        getLabel: function (value) {
          return !value ? 'no LESS' : 'distribution contains CSS generated from LESS files';
        },
        getValue: function () {
          return 'undefined' !== typeof generator.config.get('has.less') ? !!generator.config.get('has.less') : true;
        }
      },
      'has.sass': {
        type: 'confirm',
        message: 'Will the library distribute CSS generated from SASS/SCSS?',
        getLabel: function (value) {
          return !value ? 'no sass' : 'distribution contains CSS generated from SASS/SCSS files';
        },
        getValue: function () {
          return 'undefined' !== typeof generator.config.get('has.sass') ? !!generator.config.get('has.sass') : true;
        }
      },
      'has.css': {
        type: 'confirm',
        message: 'Will the library distribute CSS compiled from raw CSS files?',
        getLabel: function (value) {
          return !value ? 'no css' : 'distribution contains CSS generated from raw CSS files';
        },
        getValue: function () {
          return 'undefined' !== typeof generator.config.get('has.css') ? !!generator.config.get('has.css') : true;
        }
      },
      'has.docs': {
        type: 'confirm',
        message: 'Will library be documented?',
        getLabel: function (value) {
          return !value ? 'no docs' : 'documentation generated on build';
        },
        getValue: function () {
          return 'undefined' !== typeof generator.config.get('has.docs') ? !!generator.config.get('has.docs') : true;
        }
      },

      'use.git': {
        type: 'confirm',
        message: 'Are you using a Github repository?',
        getLabel: function (value) {
          return !value ? 'no' : 'other urls are relative to github.com, github.username & github.reponame';
        },
        getValue: function () {
          return 'undefined' !== typeof generator.config.get('use.git') ? !!generator.config.get('use.git') : true;
        }
      },
      'github.username': {
        type: 'input',
        message: 'Your Github account/organization?',
        skip: function () {
          return !prompts['use.git'].getValue();
        },
        getValue: function () {
          return generator.config.get('github.username') || null; // || generator.git.username();
        }
      },
      'github.reponame': {
        type: 'input',
        message: 'Github repository name (as in "http://github.com/user/<REPO>") for this library?',
        skip: function () {
          return !prompts['use.git'].getValue();
        },
        getValue: function () {
          return generator.config.get('github.reponame') || slugify(prompts['project.name'].getValue());
        }
      },
      'repo.url': {
        type: 'input',
        message: 'Repository url?',
        skip: function () {
          return !!prompts['use.git'].getValue();
        },
        getLabel: function (value) {
          return 'as in "git://githost/path/to.git"';
        },
        getValue: function () {
          if (prompts['use.git'].getValue()) {
            var repoAccount = prompts['github.username'].getValue();
            var repoId = prompts['github.reponame'].getValue();
            return generator.config.get('repo.url') || ['git@github.com:', repoAccount, '/', repoId, '.git'].join('');
          }
          else {
            return generator.config.get('repo.url') || null;
          }
        }
      },

      'homepage.url': {
        type: 'input',
        message: 'Homepage URL?',
        getValue: function () {
          if (prompts['use.git'].getValue()) {
            var repoAccount = prompts['github.username'].getValue();
            var repoId = prompts['github.reponame'].getValue();
            return generator.config.get('homepage.url') || ['https://github.com/', repoAccount, '/', repoId].join('');
          }
          else {
            return generator.config.get('homepage.url') || null;
          }
        }
      },
      'docs.url': {
        type: 'input',
        message: 'Documentation URL?',
        getValue: function () {
          return generator.config.get('docs.url') || prompts['homepage.url'].getValue() || null;
        }
      },
      'bugs.url': {
        type: 'input',
        message: 'Bugs URL?',
        getValue: function () {
          if (prompts['use.git'].getValue()) {
            var repoAccount = prompts['github.username'].getValue();
            var repoId = prompts['github.reponame'].getValue();
            return generator.config.get('bugs.url') || ['https://github.com/', repoAccount, '/', repoId, '/issues'].join('');
          }
          else {
            return generator.config.get('bugs.url') || null;
          }
        }
      },

      'license.name': {
        type: 'input',
        message: 'license name?',
        getValue: function () {
          return generator.config.get('license.name') || 'MIT';
        }
      },
      'license.url': {
        type: 'input',
        message: 'License URL?',
        getValue: function () {
          return generator.config.get('license.url') || null;
        }
      },

      'author.name': {
        type: 'input',
        message: 'Author name?',
        getValue: function () {
          return generator.config.get('author.name') || null; // || generator.git.name();
        }
      },
      'author.email': {
        type: 'input',
        message: 'Author email?',
        getValue: function () {
          return generator.config.get('author.email') || null; // || generator.git.email();
        }
      },
      'author.url': {
        type: 'input',
        message: 'Author URL?',
        getValue: function () {
          return generator.config.get('author.url') || null;
        }
      },

      'use.travis': {
        type: 'confirm',
        message: 'Are you going to use Travis CI?',
        getLabel: function (value) {
          return !value ? 'travis links will be removed from docs' : 'docs will link to travis';
        },
        getValue: function () {
          return 'undefined' !== typeof generator.config.get('use.travis') ? !!generator.config.get('use.travis') : true;
        }
      },
      'travis.id': {
        type: 'input',
        message: 'Travis ID?',
        skip: function () {
          return !prompts['use.travis'].getValue();
        },
        getValue: function () {
          if (prompts['use.git'].getValue()) {
            var repoAccount = prompts['github.username'].getValue();
            var repoId = prompts['github.reponame'].getValue();
            return generator.config.get('travis.id') || [repoAccount, '/', repoId].join('');
          }
          else {
            return null;
          }
        }
      },
    };

    function input(key, prompt, next) {
      prompt.name = key;
      prompt.default = prompt.getValue();
      generator.prompt(prompt, function (answers) {
        if (prompt.process) {
          prompt.process(answers[key], function (error) {
            if (error) {
              input(key, prompt, next);
            }
            else {
              generator.config.set(key, answers[key]);
              next();
            }
          });
        }
        else {
          generator.config.set(key, answers[key]);
          next();
        }
      });
    }

    function makeAsyncInput(key) {
      return function (next) {
        if (prompts[key].skip && prompts[key].skip()) {
          next();
        }
        else {
          input(key, prompts[key], next);
        }
      };
    }

    function interview(review) {

      var series = [];
      series.push(makeAsyncInput('project.name'));
      series.push(makeAsyncInput('project.description'));

      series.push(makeAsyncInput('bower.id'));
      series.push(makeAsyncInput('npm.id'));

      series.push(makeAsyncInput('angular.module'));
      series.push(makeAsyncInput('has.tpl'));
      series.push(makeAsyncInput('has.css'));
      series.push(makeAsyncInput('has.less'));
      series.push(makeAsyncInput('has.sass'));
      series.push(makeAsyncInput('has.docs'));

      series.push(makeAsyncInput('use.git'));
      series.push(makeAsyncInput('github.username'));
      series.push(makeAsyncInput('github.reponame'));
      series.push(makeAsyncInput('repo.url'));

      series.push(makeAsyncInput('homepage.url'));
      series.push(makeAsyncInput('docs.url'));
      series.push(makeAsyncInput('bugs.url'));

      series.push(makeAsyncInput('license.name'));
      series.push(makeAsyncInput('license.url'));

      series.push(makeAsyncInput('author.name'));
      series.push(makeAsyncInput('author.email'));
      series.push(makeAsyncInput('author.url'));

      series.push(makeAsyncInput('use.travis'));
      series.push(makeAsyncInput('travis.id'));

      async.series(series, review);
    }

    function printConfig() {
      var config = generator.config.getAll();
      var label;
      var value;
      var dump = '';
      for (var key in prompts) {
        if (prompts[key].skip && prompts[key].skip()) {
          continue;
        }
        value = config[key];
        if ('undefined' === typeof value) {
          value = prompts[key].getValue();
        }
        if (value === null) {
          value = '';
        }
        label = (prompts[key].getLabel) ? prompts[key].getLabel(value) : prompts[key].message;
        dump += key.red + ': ' + value + (' # ' + label).green + '\n';
      }
      generator.log(yosay(chalk.red('nglib:') + ' review settings'));
      generator.log(dump);
    }

    function review(done) {
      printConfig();
      var prompt = {
        type: 'confirm',
        name: 'interview',
        message: 'Customize?',
        default: true
      };
      generator.prompt(prompt, function (answers) {
        if (answers['interview']) {
          interview(function () {
            review(done);
          });
        }
        else {
          return done();
        }
      });
    }

    if (generator.options['skip-interactive']) {
      printConfig();
      return done();
    }
    else {
      review(function () {
        var value;
        for (var key in prompts) {
          value = generator.config.get(key);
          if ('undefined' === typeof value) {
            value = prompts[key].getValue();
            generator.config.set(key, value);
          }
        }
        return done();
      });
    }
  },

  writing: {

    app: function () {
      var generator = this;
      var done = this.async();

      generator.log(yosay('Generating app scaffold...'));

      var data = {
        config: generator.config.getAll()
      };

      function processSource(src, subpath, cb) {
        src.recurse(subpath || '.', function (fullpath, basepath, dirname, filename) {
          var destination;
          var matches;
          var body;
          if (matches = filename.match(/^_\.(.*)$/)) {
            destination = dirname ? path.join(dirname, matches[1]) : matches[1];
            if (!generator.fs.exists(destination)) {
              body = generator.fs.read(fullpath);
              body = generator.engine(body, data);
              generator.fs.write(destination, body);
            }
          }
          else {
            destination = dirname ? path.join(dirname, filename) : filename;
            if (!generator.fs.exists(destination)) {
              generator.fs.copy(fullpath, destination);
            }
          }
        });
        cb();
      }

      function fetchGithubTemplate(username, repo, branch, path, cb) {
        generator.remote(username, repo, branch, function (err, remote) {
          cb(remote);
        }, !!generator.options['tpl-refresh']);
      }

      function fetchFromPath(path, cb) {
        generator.remoteDir(path, function (err, remote) {
          cb(remote);
        }, !!generator.options['no-cache']);
      }

      function fetchTemplate(tpl, branch, path, cb) {
        if (tpl) {
          var matches;
          if (matches = tpl.match(/^git@github\.com:([^/]+)\/(.+)\.git/)) {
            branch = branch || 'master';
            fetchGithubTemplate(matches[1], matches[2], branch, path, function (remote, err) {
              if (!remote) {
                generator.log(('Failed to clone from "' + tpl + '" branch "' + branch + '".').red);
                process.exit(1);
              }
              processSource(remote.src, path, cb);
            });
          }
          else if (fs.existsSync(tpl)) {
            fetchFromPath(tpl, function (remote) {
              processSource(remote.src, null, cb);
            });
          }
          else {
            generator.log('Option --tpl must be a Github repository (git@github.com:account/repo.git) or a local path!'.red);
            process.exit(1);
          }
        }
        else {
          cb();
        }
      }

      fetchTemplate(generator.options['tpl'], generator.options['tpl-branch'], generator.options['tpl-path'], function () {
        processSource(generator.src, 'app', function () {
          return done();
        });
      });

    },

    main: function () {
      var generator = this;
      var done = this.async();

      generator.log(yosay('Generating angular module...'));

      var data = {
        config: generator.config.getAll()
      };

      function writeModuleFile(source, destination) {
        var body;

        if (!generator.fs.exists(destination)) {
          body = generator.engine(generator.read(source), data);
          generator.fs.write(destination, body);
        }
      }

      function generateModule(moduleName, cb) {
        var destination;

        destination = path.join('src/lib', moduleName, moduleName + '.js');
        writeModuleFile('main/src/lib/my.module/my.module.js', destination);

        destination = path.join('src/lib', moduleName, moduleName + '.spec.js');
        writeModuleFile('main/src/lib/my.module/my.module.spec.js', destination);

        if (generator.config.get('has.docs')) {
          destination = path.join('src/lib', moduleName, moduleName + '.ngdoc');
          writeModuleFile('main/src/lib/my.module/my.module.ngdoc', destination);
        }

        if (generator.config.get('has.tpl')) {
          destination = path.join('src/lib', moduleName, 'my.directive.tpl.html');
          writeModuleFile('main/src/lib/my.module/my.directive.tpl.html', destination);
        }

        if (generator.config.get('has.css')) {
          writeModuleFile('main/src/css/extra.css', 'src/css/extra.css');
        }

        if (generator.config.get('has.less')) {
          destination = path.join('src/less/', moduleName + '.less');
          writeModuleFile('main/src/less/my.module.less', destination);
          destination = path.join('src/lib', moduleName, moduleName + '.less');
          writeModuleFile('main/src/lib/my.module/my.directive.less', destination);
        }

        if (generator.config.get('has.sass')) {
          destination = path.join('src/sass/', moduleName + '.scss');
          writeModuleFile('main/src/sass/my.module.scss', destination);
        }

        cb();
      }

      generateModule(generator.config.get('angular.module'), function () {
        return done();
      });

    }
  },

  install: {

    deps: function () {
      var generator = this;

      if (!generator.options['skip-install']) {
        generator.installDependencies();
      }
    },

    git: function () {
      var generator = this;

      if (!generator.options['skip-install'] && !fs.existsSync('.git')) {
        generator.spawnCommand('git', ['init']);
        generator.spawnCommand('git', ['remote', 'add', 'origin', generator.config.get('repo.url')]);
      }
    }
  }

});
