var docsApp = {
  controller: {},
  directive: {},
  serviceFactory: {}
};


docsApp.directive.ngHtmlWrapLoaded = function(reindentCode, templateMerge, loadedUrls) {
  function escape(text) {
    return text.
      replace(/\&/g, '&amp;').
      replace(/\</g, '&lt;').
      replace(/\>/g, '&gt;').
      replace(/"/g, '&quot;');
  }

  function setHtmlIe8SafeWay(element, html) {
    var newElement = angular.element('<pre>' + html + '</pre>');

    element.html('');
    element.append(newElement.contents());
    return element;
  }

  return {
    compile: function(element, attr) {
      var properties = {
            head: '',
            module: '',
            body: element.text()
          },
        html = "<!doctype html>\n<html ng-app{{module}}>\n  <head>\n{{head:4}}  </head>\n  <body>\n{{body:4}}  </body>\n</html>";

      angular.forEach(loadedUrls.base, function(dep) {
        properties.head += '<script src="' + dep + '"></script>\n';
      });

      angular.forEach((attr.ngHtmlWrapLoaded || '').split(' '), function(dep) {
        if (!dep) return;
        var ext = dep.split(/\./).pop();

        if (ext == 'css') {
          properties.head += '<link rel="stylesheet" href="' + dep + '" type="text/css">\n';
        } else if(ext == 'js' && dep !== 'angular.js') {
          properties.head += '<script src="' + (loadedUrls[dep] || dep) + '"></script>\n';
        } else if (dep !== 'angular.js') {
          properties.module = '="' + dep + '"';
        }
      });

      setHtmlIe8SafeWay(element, escape(templateMerge(html, properties)));
    }
  };
};


docsApp.directive.focused = function($timeout) {
  return function(scope, element, attrs) {
    element[0].focus();
    element.on('focus', function() {
      scope.$apply(attrs.focused + '=true');
    });
    element.on('blur', function() {
      // have to use $timeout, so that we close the drop-down after the user clicks,
      // otherwise when the user clicks we process the closing before we process the click.
      $timeout(function() {
        scope.$eval(attrs.focused + '=false');
      });
    });
    scope.$eval(attrs.focused + '=true');
  };
};


docsApp.directive.code = function() {
  return { restrict:'E', terminal: true };
};


docsApp.directive.sourceEdit = function(getEmbeddedTemplate) {
  return NG_DOCS.editExample ? {
    template: '<a class="edit-example pull-right" ng-click="plunkr($event)" href>' +
      '<i class="icon-edit"></i> Edit in Plunkr</a>',
    scope: true,
    controller: function($scope, $attrs, openPlunkr) {
      var sources = {
        module: $attrs.sourceEdit,
        deps: read($attrs.sourceEditDeps),
        html: read($attrs.sourceEditHtml),
        css: read($attrs.sourceEditCss),
        js: read($attrs.sourceEditJs),
        unit: read($attrs.sourceEditUnit),
        scenario: read($attrs.sourceEditScenario)
      };
      $scope.plunkr = function(e) {
        e.stopPropagation();
        openPlunkr(sources);
      };
    }
  } : {};

  function read(text) {
    var files = [];
    angular.forEach(text ? text.split(' ') : [], function(refId) {
      // refId is index.html-343, so we need to strip the unique ID when exporting the name
      files.push({name: refId.replace(/-\d+$/, ''), content: getEmbeddedTemplate(refId)});
    });
    return files;
  }
};


docsApp.serviceFactory.loadedUrls = function($document) {
  var urls = {};

  angular.forEach($document.find('script'), function(script) {
    var match = script.src.match(/^.*\/([^\/]*\.js)$/);
    if (match) {
      urls[match[1].replace(/(\-\d.*)?(\.min)?\.js$/, '.js')] = match[0];
    }
  });

  urls.base = [];
  angular.forEach(NG_DOCS.scripts, function(script) {
    var match = urls[script.replace(/(\-\d.*)?(\.min)?\.js$/, '.js')];
    if (match) {
      urls.base.push(match);
    }
  });

  return urls;
};


docsApp.serviceFactory.formPostData = function($document) {
  return function(url, fields) {
    var form = angular.element('<form style="display: none;" method="post" action="' + url + '" target="_blank"></form>');
    angular.forEach(fields, function(value, name) {
      var input = angular.element('<input type="hidden" name="' +  name + '">');
      input.attr('value', value);
      form.append(input);
    });
    $document.find('body').append(form);
    form[0].submit();
    form.remove();
  };
};

docsApp.serviceFactory.openPlunkr = function(templateMerge, formPostData, loadedUrls) {
  return function(content) {
    var allFiles = [].concat(content.js, content.css, content.html);
    var indexHtmlContent = '<!doctype html>\n' +
        '<html ng-app="{{module}}">\n' +
        '  <head>\n' +
        '{{scriptDeps}}' +
        '  </head>\n' +
        '  <body>\n\n' +
        '{{indexContents}}\n\n' +
        '  </body>\n' +
        '</html>\n';
    var scriptDeps = '';
    angular.forEach(loadedUrls.base, function(url) {
        scriptDeps += '    <script src="' + url + '"></script>\n';
    });
    angular.forEach(allFiles, function(file) {
      var ext = file.name.split(/\./).pop();
        if (ext == 'css') {
          scriptDeps += '    <link rel="stylesheet" href="' + file.name + '" type="text/css">\n';
        } else if (ext == 'js' && file.name !== 'angular.js') {
        scriptDeps += '    <script src="' + file.name + '"></script>\n';
      }
    });
    indexProp = {
      module: content.module,
      scriptDeps: scriptDeps,
      indexContents: content.html[0].content
    };

    var postData = {};
    angular.forEach(allFiles, function(file, index) {
      if (file.content && file.name != 'index.html') {
        postData['files[' + file.name + ']'] = file.content;
      }
    });

    postData['files[index.html]'] = templateMerge(indexHtmlContent, indexProp);
    postData['tags[]'] = "angularjs";

    postData.private = true;
    postData.description = 'AngularJS Example Plunkr';

    formPostData('http://plnkr.co/edit/?p=preview', postData);
  };
};


docsApp.serviceFactory.sections = function serviceFactory() {
  var sections = {
    getPage: function(sectionId, partialId) {
      var pages = sections[sectionId];

      partialId = partialId || 'index';

      for (var i = 0, ii = pages.length; i < ii; i++) {
        if (pages[i].id == partialId) {
          return pages[i];
        }
      }
      return null;
    }
  };

  angular.forEach(NG_DOCS.pages, function(page) {
    var url = page.section + '/' +  page.id;
    if (page.id == 'angular.Module') {
      page.partialUrl = 'partials/api/angular.IModule.html';
    } else {
      page.partialUrl = 'partials/' + url.replace(':', '.') + '.html';
    }
    page.url = (NG_DOCS.html5Mode ? '' : '#/') + url;
    if (!sections[page.section]) { sections[page.section] = []; }
    sections[page.section].push(page);
  });

  return sections;
};


docsApp.controller.DocsController = function($scope, $location, $window, sections) {
  var INDEX_PATH = /^(\/|\/index[^\.]*.html)$/,
      GLOBALS = /^angular\.([^\.]+)$/,
      MODULE = /^([^\.]+)$/,
      MODULE_MOCK = /^angular\.mock\.([^\.]+)$/,
      MODULE_CONTROLLER = /^(.+)\.controllers?:([^\.]+)$/,
      MODULE_DIRECTIVE = /^(.+)\.directives?:([^\.]+)$/,
      MODULE_DIRECTIVE_INPUT = /^(.+)\.directives?:input\.([^\.]+)$/,
      MODULE_FILTER = /^(.+)\.filters?:([^\.]+)$/,
      MODULE_CUSTOM = /^(.+)\.([^\.]+):([^\.]+)$/,
      MODULE_SERVICE = /^(.+)\.([^\.]+?)(Provider)?$/,
      MODULE_TYPE = /^([^\.]+)\..+\.([A-Z][^\.]+)$/;


  /**********************************
   Publish methods
   ***********************************/

  $scope.navClass = function(page1, page2) {
    return {
      first: this.$first,
      last: this.$last,
      active: page1 && this.currentPage == page1 || page2 && this.currentPage == page2,
      match: this.focused && this.currentPage != page1 &&
             this.bestMatch.rank > 0 && this.bestMatch.page == page1

    };
  };

  $scope.isActivePath = function(url) {
    if (url.charAt(0) == '#') {
      url = url.substring(1, url.length);
    }
    return $location.path().indexOf(url) > -1;
  };

  $scope.submitForm = function() {
    if ($scope.bestMatch) {
      var url =  $scope.bestMatch.page.url;
      $location.path(NG_DOCS.html5Mode ? url : url.substring(1));
    }
  };

  $scope.afterPartialLoaded = function() {
    var currentPageId = $location.path();
    $scope.partialTitle = $scope.currentPage.shortName;
    $window._gaq && $window._gaq.push(['_trackPageview', currentPageId]);
    loadDisqus(currentPageId);
  };


  /**********************************
   Watches
   ***********************************/

  $scope.sections = {};
  angular.forEach(NG_DOCS.sections, function(section, url) {
    $scope.sections[(NG_DOCS.html5Mode ? '' : '#/') + url] = section;
  });
  $scope.$watch(function docsPathWatch() {return $location.path(); }, function docsPathWatchAction(path) {
    var parts = path.split('/'),
      sectionId = parts[1],
      partialId = parts[2],
      page, sectionName = $scope.sections[(NG_DOCS.html5Mode ? '' : '#/') + sectionId];

    if (!sectionName) { return; }

    $scope.currentPage = page = sections.getPage(sectionId, partialId);

    if (!$scope.currentPage) {
      $scope.partialTitle = 'Error: Page Not Found!';
      page = {};
    }

    updateSearch();


    // Update breadcrumbs
    var breadcrumb = $scope.breadcrumb = [],
      match, sectionPath = (NG_DOCS.html5Mode ? '' : '#/') +  sectionId;

    if (partialId) {
      breadcrumb.push({ name: sectionName, url: sectionPath });
      if (partialId == 'angular.Module') {
        breadcrumb.push({ name: 'angular.Module' });
      } else if (match = partialId.match(GLOBALS)) {
        breadcrumb.push({ name: partialId });
      } else if (match = partialId.match(MODULE)) {
        match[1] = page.moduleName || match[1];
        breadcrumb.push({ name: match[1] });
      } else if (match = partialId.match(MODULE_FILTER)) {
        match[1] = page.moduleName || match[1];
        breadcrumb.push({ name: match[1], url: sectionPath + '/' + match[1] });
        breadcrumb.push({ name: match[2] });
      } else if (match = partialId.match(MODULE_CONTROLLER)) {
        breadcrumb.push({ name: match[1], url: sectionPath + '/' + match[1] });
        breadcrumb.push({ name: match[2] });
      } else if (match = partialId.match(MODULE_DIRECTIVE)) {
        breadcrumb.push({ name: match[1], url: sectionPath + '/' + match[1] });
        breadcrumb.push({ name: match[2] });
      } else if (match = partialId.match(MODULE_DIRECTIVE_INPUT)) {
        breadcrumb.push({ name: match[1], url: sectionPath + '/' + match[1] });
        breadcrumb.push({ name: 'input' });
        breadcrumb.push({ name: match[2] });
      } else if (match = partialId.match(MODULE_CUSTOM)) {
        match[1] = page.moduleName || match[1];
        breadcrumb.push({ name: match[1], url: sectionPath + '/' + match[1] });
        breadcrumb.push({ name: match[3] });
      } else if (match = partialId.match(MODULE_TYPE)) {
        match[1] = page.moduleName || match[1];
        breadcrumb.push({ name: match[1], url: sectionPath + '/' + match[1] });
        breadcrumb.push({ name: match[2] });
      }  else if (match = partialId.match(MODULE_SERVICE)) {
        if ( page.type === 'overview') {
          // module name with dots looks like a service
          breadcrumb.push({ name: partialId });
        } else {
          match[1] = page.moduleName || match[1];
          breadcrumb.push({ name: match[1], url: sectionPath + '/' + match[1] });
          breadcrumb.push({ name: match[2] + (match[3] || '') });
        }
      } else if (match = partialId.match(MODULE_MOCK)) {
        breadcrumb.push({ name: 'angular.mock.' + match[1] });
      } else {
        breadcrumb.push({ name: page.shortName });
      }
    } else {
      breadcrumb.push({ name: sectionName });
    }
  });

  $scope.$watch('search', updateSearch);



  /**********************************
   Initialize
   ***********************************/

  $scope.versionNumber = angular.version.full;
  $scope.version = angular.version.full + "  " + angular.version.codeName;
  $scope.futurePartialTitle = null;
  $scope.loading = 0;

  if (!$location.path() || INDEX_PATH.test($location.path())) {
    $location.path(NG_DOCS.startPage).replace();
  }

  /**********************************
   Private methods
   ***********************************/

  function updateSearch() {
    var cache = {},
        pages = sections[$location.path().split('/')[1]],
        modules = $scope.modules = [],
        otherPages = $scope.pages = [],
        search = $scope.search,
        bestMatch = {page: null, rank:0};

    angular.forEach(pages, function(page) {
      var match,
        id = page.id,
        section = page.section;

      if (!(match = rank(page, search))) return;

      if (match.rank > bestMatch.rank) {
        bestMatch = match;
      }

      if (page.id == 'index') {
        //skip
      } else if (!NG_DOCS.apis[section]) {
        otherPages.push(page);
      } else if (id == 'angular.Module') {
        module('ng', section).types.push(page);
      } else if (match = id.match(GLOBALS)) {
        module('ng', section).globals.push(page);
      } else if (match = id.match(MODULE)) {
        module(page.moduleName || match[1], section);
      } else if (match = id.match(MODULE_FILTER)) {
        module(page.moduleName || match[1], section).filters.push(page);
      } else if (match = id.match(MODULE_CONTROLLER) && page.type === 'controller') {
        module(page.moduleName || match[1], section).controllers.push(page);
      } else if (match = id.match(MODULE_DIRECTIVE)) {
        module(page.moduleName || match[1], section).directives.push(page);
      } else if (match = id.match(MODULE_DIRECTIVE_INPUT)) {
        module(page.moduleName || match[1], section).directives.push(page);
      } else if (match = id.match(MODULE_CUSTOM)) {
        if (page.type === 'service') {
          module(page.moduleName || match[1], section).service(match[3])[page.id.match(/^.+Provider$/) ? 'provider' : 'instance'] = page;
        } else {
          var m = module(page.moduleName || match[1], section),
            listName = page.type + 's';

          if (m[listName]) {
            m[listName].push(page);
          } else {
            m.others.push(page);
          }
        }
      } else if (match = id.match(MODULE_TYPE) && page.type === 'type') {
        module(page.moduleName || match[1], section).types.push(page);
      } else if (match = id.match(MODULE_SERVICE)) {
        if (page.type === 'overview') {
          module(id, section);
        } else {
          module(page.moduleName || match[1], section).service(match[2])[match[3] ? 'provider' : 'instance'] = page;
        }
      } else if (match = id.match(MODULE_MOCK)) {
        module('ngMock', section).globals.push(page);
      }

    });

    $scope.bestMatch = bestMatch;

    /*************/

    function module(name, section) {
      var module = cache[name];
      if (!module) {
        module = cache[name] = {
          name: name,
          url: (NG_DOCS.html5Mode ? '' : '#/') + section + '/' + name,
          globals: [],
          controllers: [],
          directives: [],
          services: [],
          others: [],
          service: function(name) {
            var service =  cache[this.name + ':' + name];
            if (!service) {
              service = {name: name};
              cache[this.name + ':' + name] = service;
              this.services.push(service);
            }
            return service;
          },
          types: [],
          filters: []
        };
        modules.push(module);
      }
      return module;
    }

    function rank(page, terms) {
      var ranking = {page: page, rank:0},
        keywords = page.keywords,
        title = page.shortName.toLowerCase();

      terms && angular.forEach(terms.toLowerCase().split(' '), function(term) {
        var index;

        if (ranking) {
          if (keywords.indexOf(term) == -1) {
            ranking = null;
          } else {
            ranking.rank ++; // one point for each term found
            if ((index = title.indexOf(term)) != -1) {
              ranking.rank += 20 - index; // ten points if you match title
            }
          }
        }
      });
      return ranking;
    }
  }


  function loadDisqus(currentPageId) {
    if (!NG_DOCS.discussions) { return; }
    // http://docs.disqus.com/help/2/
    window.disqus_shortname = NG_DOCS.discussions.shortName;
    window.disqus_identifier = currentPageId;
    window.disqus_url = NG_DOCS.discussions.url + currentPageId;
    window.disqus_developer = NG_DOCS.discussions.dev;

    // http://docs.disqus.com/developers/universal/
    (function() {
      var dsq = document.createElement('script'); dsq.type = 'text/javascript'; dsq.async = true;
      dsq.src = '//angularjs.disqus.com/embed.js';
      (document.getElementsByTagName('head')[0] ||
        document.getElementsByTagName('body')[0]).appendChild(dsq);
    })();

    angular.element(document.getElementById('disqus_thread')).html('');
  }
};

function module(name, modules, optional) {
  if (optional) {
    angular.forEach(optional, function(name) {
      try {
        angular.module(name);
        modules.push(name);
      } catch(e) {}
    });
  }
  return angular.module(name, modules);
}

module('docsApp', ['bootstrap', 'bootstrapPrettify'], ['ngAnimate']).
  config(function($locationProvider) {
    if (NG_DOCS.html5Mode) {
      $locationProvider.html5Mode(true).hashPrefix('!');
    }
  }).
  factory(docsApp.serviceFactory).
  directive(docsApp.directive).
  controller(docsApp.controller);
