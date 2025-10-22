module.exports.policies = {
  '*': 'isLoggedIn',
  
  // Auth routes don't require login
  'AuthController': {
    'login': true
  },
  
  // User management requires admin
  'UserController': {
    '*': ['isLoggedIn', 'isAdmin']
  },
  
  'ViewController': {
    'users': ['isLoggedIn', 'isAdmin'],
    'newUser': ['isLoggedIn', 'isAdmin'],
    'editUser': ['isLoggedIn', 'isAdmin']
  },
  
  // REST API v1 - Uses bearer token authentication
  'DomainApiController': {
    '*': 'hasBearerToken'
  }
};