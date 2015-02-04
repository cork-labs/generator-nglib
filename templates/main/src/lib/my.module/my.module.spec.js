describe('<%= config['angular.module'] %>', function () {
    'use strict';

    beforeEach(module('<%= config['angular.module'] %>'));<% if (config['has.tpl']) { %>
    beforeEach(module('<%= config['angular.module'] %>.templates'));<% } %>

    describe('myServiceProvider', function () {

        var myServiceProvider;
        beforeEach(module(function (_myServiceProvider_) {
            myServiceProvider = _myServiceProvider_;
        }));

        it('should store a configuration property.', inject(function (myService) {

            var someProperty = 5;

            myServiceProvider.configure({
                someProperty: someProperty
            });

            expect(myService.someProperty).toBe(someProperty);
        }));

    });

    describe('myService', function () {

        var myServiceProvider;
        beforeEach(function () {
            // capture myServiceProvider
            module(function (_myServiceProvider_) {
                myServiceProvider = _myServiceProvider_;
            });
        });

        describe('someMethod()', function () {

            it('should return true.', inject(function (myService)  {

                expect(myService.someMethod()).toEqual(true);
            }));

        });
    });
});

