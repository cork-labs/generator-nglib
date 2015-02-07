(function (angular) {
    'use strict';

    var module = angular.module('<%= config['angular.module'] %>', [<% if (config['has.tpl']) { %>'<%= config['angular.module'] %>.templates'<% } %>]);

    /**
     * @ngdoc object
     * @name <%= config['angular.module'] %>.myServiceProvider
     *
     * @description
     * Allows the {@link <%= config['angular.module'] %>.myService} service to be configured.
     */
    module.provider('myService', [

        function myServiceProvider() {

            /**
             * @type {Object} provider configuration.
             */
            var serviceConfig = {};

            /**
             * @ngdoc function
             * @name configure
             * @methodOf <%= config['angular.module'] %>.myServiceProvider
             *
             * @description
             * Configures the {@link <%= config['angular.module'] %>.myService} service.
             *
             * @param {Object} config Object with configuration options, extends base configuration.
             * - someProperty {number}
             */
            this.configure = function (config) {
                angular.extend(serviceConfig, config);
            };

            /**
             * @ngdoc object
             * @name <%= config['angular.module'] %>.myService
             *
             * @description
             * An example service.
             *
             * @property {number} someProperty **Number** *Read-only* Some property.
             */
            this.$get = [
                '$q',
                function myService($q) {

                    var serviceApi = {

                        /**
                         * @ngdoc function
                         * @name someMethod
                         * @methodOf <%= config['angular.module'] %>.myService
                         *
                         * @description
                         * Performs something.
                         *
                         * @param {number} value Some number.
                         * @returns {boolean} Some result.
                         */
                        someMethod: function (value) {
                          return true;
                        }
                    };

                    Object.defineProperty(serviceApi, 'someProperty', {
                        get: function () {
                            return serviceConfig.someProperty;
                        }
                    });

                    return serviceApi;
                }
            ];
        }
    ]);

})(angular);
