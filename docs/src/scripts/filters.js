angular.module('demo')
.filter('JSONPrint', function () {
    return function (obj) {
        return angular.toJson(obj, true);
    };
});
