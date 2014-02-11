angular.module('demo', ['ngRoute', 'ngResource', 'rxDataTable'])
.factory('TableInfo', ['$resource', function ($resource) {
    return $resource('http://127.0.0.1:8882/api/mocks/:type/:level', {}, {
        // Type could be "config" or "data"
        // Level could be "simple", "typical", or "full-featured"
        retrieve: {method: 'GET', isArray: true, interceptor: {
                response: function () {
                    $('pre').each(function(i, e) {
                        /* global hljs */
                        hljs.highlightBlock(e);
                    });
                }
            }
        }
        });
}])
.config(function ($routeProvider, $locationProvider) {
    $routeProvider
    .when('/examples/simple', {
        templateUrl: '/templates/simple.html',
        controller: 'simpleCtrl'
    })
    .when('/examples/basic', {
        templateUrl: '/templates/basic.html',
        controller: 'basicCtrl'
    })
    .when('/examples/typical', {
        templateUrl: '/templates/typical.html',
        controller: 'typicalCtrl'
    })
    .when('/examples/complex', {
        templateUrl: '/templates/complex.html',
        controller: 'complexCtrl'
    })
    .when('/examples/full-featured', {
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
    $locationProvider.html5Mode(false);
}).run(function ($rootScope, $location) {
    $rootScope.isActive = function (type) {
        return ($location.path().indexOf(type) >= 0) ? 'active' : undefined;
    };
});
