'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var async = require('async');
var fs = require('fs');
var path = require('path');

module.exports = yeoman.generators.Base.extend({
  initializing: function () {
    var generator = this;
    var done = this.async();

    generator.pkg = require('../package.json');

    function fetchSeed(seed, cb) {

      var destination = generator.destinationRoot() + '/.yo-rc.json';

      if (fs.existsSync(destination)) {
        generator.log('Settings file ".yo-rc.json" already exists.'.red);
        process.exit(1);
      }

      if (seed.match('http')) {
        generator.fetch(seed, generator.destinationRoot(), function (err) {
          if (err) {
            generator.log('Could not download seed! ' + err.red);
            process.exit(1);
          }
          var source = generator.destinationRoot() + '/' + path.basename(seed);
          fs.renameSync(source, destination);
          cb();
        });
      }
      else if (fs.existsSync(seed)) {
        fs.createReadStream(seed).pipe(fs.createWriteStream(destination));
        cb();
      }
      else {
        generator.log('Seed must be a URL or a local file!'.red);
        process.exit(1);
      }
    }

    if (generator.options.seed) {
      fetchSeed(generator.options.seed, function (){
        done();
      })
    }
    else {
      done();
    }
  },

  prompting: function () {
    var generator = this;
    var done = this.async();

    generator.data = {};

    var prompts = {
      'name': {
        type: 'input',
        message: 'Name of the project?',
        getValue: function () {
          return generator.config.get('name') || generator.appname;
        }
      },
      'angular.module': {
        type: 'input',
        message: 'Name of the main AngularJS module?',
        getValue: function () {
          return generator.config.get('angular.module') || generator._.slugify(prompts['name'].getValue().replace(/\./g, '-'));
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
      'has.css': {
        type: 'confirm',
        message: 'Will the library contain CSS?',
        getLabel: function (value) {
          return !value ? 'no css' : 'distribution contains one or more css files';
        },
        getValue: function () {
          return 'undefined' !== typeof generator.config.get('has.css') ? !!generator.config.get('has.css') : true;
        }
      },
      'keep.docs': {
        type: 'confirm',
        message: 'Preserve boilerplate documentation?',
        getLabel: function (value) {
          return !value ? 'docs from scratch' : 'keep the boilerplate docs';
        },
        getValue: function () {
          return 'undefined' !== typeof generator.config.get('keep.docs') ? !!generator.config.get('keep.docs') : true;
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
          return generator.config.get('github.reponame') || generator._.slugify(prompts['name'].getValue().replace(/\./g, '-'));
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
            return generator.config.get('repo.url') || ['git://github.com/', repoAccount, '/', repoId, '.git'].join('');
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
            return generator.config.get('homepage.url') ||null;
          }
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
      series.push(makeAsyncInput('name'));
      series.push(makeAsyncInput('angular.module'));

      series.push(makeAsyncInput('has.tpl'));
      series.push(makeAsyncInput('has.css'));
      series.push(makeAsyncInput('keep.docs'));

      series.push(makeAsyncInput('use.git'));
      series.push(makeAsyncInput('github.username'));
      series.push(makeAsyncInput('github.reponame'));
      series.push(makeAsyncInput('repo.url'));
      series.push(makeAsyncInput('homepage.url'));
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

    function review(done) {
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
          done();
        }
      });
    }

    review(function () {
      var value;
      for (var key in prompts) {
        value = generator.config.get(key);
        if ('undefined' === typeof value) {
          value = prompts[key].getValue();
          generator.config.set(key, value);
        }
        generator.data[key] = value;
      }
      done();
    });
  },

  writing: {
    app: function () {
      var generator = this;

      generator.log(yosay('Generating...'));

      // this.fs.copy(
      //   this.templatePath('_package.json'),
      //   this.destinationPath('package.json')
      // );
      // this.fs.copy(
      //   this.templatePath('_bower.json'),
      //   this.destinationPath('bower.json')
      // );
    },

    projectfiles: function () {
      // this.fs.copy(
      //   this.templatePath('editorconfig'),
      //   this.destinationPath('.editorconfig')
      // );
      // this.fs.copy(
      //   this.templatePath('jshintrc'),
      //   this.destinationPath('.jshintrc')
      // );
    }
  },

  install: function () {
    this.installDependencies({
      skipInstall: this.options['skip-install']
    });
  }
});
