/**
 * HTTP Server Settings
 */

const methodOverride = require('method-override');

module.exports.http = {
  middleware: {
    order: [
      'cookieParser',
      'session',
      'bodyParser',
      'methodOverride',
      'compress',
      'router',
      'www',
      'favicon'
    ],
    
    methodOverride: (function() {
      return methodOverride('_method');
    })()
  }
};