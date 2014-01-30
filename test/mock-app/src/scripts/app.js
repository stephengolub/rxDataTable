angular.module('demo', ['ngRoute', 'ngResource', 'rxDataTable'])
.factory('TableInfo', ['$resource', function ($resource) {
    return $resource('http://127.0.0.1:8882/api/mocks/:type/:level', {}, {
        // Type could be "config" or "data"
        // Level could be "simple", "typical", or "full-featured"
        retrieve: {method: 'GET', isArray: true}
    });
}])
.config(function ($routeProvider, $locationProvider) {
    $routeProvider
    .when('/simple', {
        templateUrl: '/templates/simple.html',
        controller: 'simpleCtrl'
    })
    .when('/basic', {
        templateUrl: '/templates/basic.html',
        controller: 'basicCtrl'
    })
    .when('/typical', {
        templateUrl: '/templates/typical.html',
        controller: 'typicalCtrl'
    })
    .when('/complex', {
        templateUrl: '/templates/complex.html',
        controller: 'complexCtrl'
    })
    .when('/full-featured', {
        templateUrl: '/templates/full-featured.html',
        controller: 'fullFeaturedCtrl'
    })
    .when('/', {
        controller: 'mainCtrl',
        templateUrl: '/templates/main.html'
    })
    .otherwise({
        redirectTo: '/',
        controller: 'mainCtrl'
    });
    $locationProvider.html5Mode(true);
});
