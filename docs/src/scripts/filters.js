angular.module('demo')
.filter('CodeHighlight', function () {
    return function (code, language) {
        /* global hljs */
        return (language) ? hljs.highlight(language, code).value : hljs.highlightAuto(code).value;
    };
})
.filter('JSONPrint', function ($filter) {
    return function (obj, highlight) {
        var codeString = angular.toJson(obj, true);
        if (highlight) {
            codeString = $filter('CodeHighlight')(codeString, 'json');
        }

        return codeString;
    };
});
