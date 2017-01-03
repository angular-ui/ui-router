import * as angular from "angular";

declare let inject;

let module = angular['mock'].module;

describe('templateFactory', function () {
  beforeEach(module('ui.router'));

  it('exists', inject(function ($templateFactory) {
    expect($templateFactory).toBeDefined();
  }));

  if (angular.version.minor >= 3) {
    // Post 1.2, there is a $templateRequest and a $sce service
    describe('should follow $sce policy and', function() {
      it('accepts relative URLs', inject(function($templateFactory, $httpBackend, $sce) {
        $httpBackend.expectGET('views/view.html').respond(200, 'template!');
        $templateFactory.fromUrl('views/view.html');
        $httpBackend.flush();
      }));

      it('rejects untrusted URLs',
          inject(function($templateFactory, $httpBackend, $sce) {
            let error = 'No error thrown';
            try {
              $templateFactory.fromUrl('http://evil.com/views/view.html');
            } catch (e) {
              error = e.message;
            }
            expect(error).toMatch(/sce:insecurl/);
          }));

      it('accepts explicitly trusted URLs',
          inject(function($templateFactory, $httpBackend, $sce) {
            $httpBackend.expectGET('http://evil.com/views/view.html').respond(200, 'template!');
            $templateFactory.fromUrl(
                $sce.trustAsResourceUrl('http://evil.com/views/view.html'));
            $httpBackend.flush();
          }));
    });
  }

  if (angular.version.minor <= 2) {  // 1.2 and before will use directly $http
    it('does not restrict URL loading', inject(function($templateFactory, $httpBackend) {
      $httpBackend.expectGET('http://evil.com/views/view.html').respond(200,  'template!');
      $templateFactory.fromUrl('http://evil.com/views/view.html');
      $httpBackend.flush();

      $httpBackend.expectGET('data:text/html,foo').respond(200,  'template!');
      $templateFactory.fromUrl('data:text/html,foo');
      $httpBackend.flush();
    }));

    // Behavior not kept in >1.2 with $templateRequest
    it('should request templates as text/html', inject(function($templateFactory, $httpBackend) {
      $httpBackend.expectGET('views/view.html', function(headers) {
        return headers.Accept === 'text/html';
      }).respond(200);
      $templateFactory.fromUrl('views/view.html');
      $httpBackend.flush();
    }));
  }

  describe('templateFactory with forced use of $http service', function () {
    beforeEach(function() {
      angular
          .module('forceHttpInTemplateFactory', [])
          .config(function($templateFactoryProvider) {
            $templateFactoryProvider.useHttpService(true);
          });
      module('ui.router');
      module('forceHttpInTemplateFactory');
    });

    it('does not restrict URL loading', inject(function($templateFactory, $httpBackend) {
      $httpBackend.expectGET('http://evil.com/views/view.html').respond(200,  'template!');
      $templateFactory.fromUrl('http://evil.com/views/view.html');
      $httpBackend.flush();

      $httpBackend.expectGET('data:text/html,foo').respond(200,  'template!');
      $templateFactory.fromUrl('data:text/html,foo');
      $httpBackend.flush();
    }));
  });
});