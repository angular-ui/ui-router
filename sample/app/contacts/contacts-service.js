angular.module('uiRouterSample.contacts.service', [

])

// A RESTful factory for retreiving contacts from 'contacts.json'
.factory('contacts', ['$http', function ($http, utils) {
  var path = 'assets/contacts.json';
  var contacts = $http.get(path).then(function (resp) {
    return resp.data.contacts;
  });

  var factory = {};
  factory.all = function () {
    return contacts;
  };
  factory.get = function (id) {
    return contacts.then(function(){
      return utils.findById(contacts, id);
    })
  };
  return factory;
}]);