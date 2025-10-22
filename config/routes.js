module.exports.routes = {
  // Auth routes
  'GET /login': { view: 'pages/login' },
  'POST /api/auth/login': 'AuthController.login',
  'GET /logout': 'AuthController.logout',
  
  // Page routes
  'GET /': { view: 'pages/dashboard' },
  'GET /domains': 'ViewController.domains',
  'GET /domains/new': 'ViewController.newDomain',
  'GET /domains/:id': 'ViewController.domainDetail',
  'GET /domains/:id/edit': 'ViewController.editDomain',
  
  // User management (admin only)
  'GET /users': 'ViewController.users',
  'GET /users/new': 'ViewController.newUser',
  'GET /users/:id/edit': 'ViewController.editUser',
  
  // Web API routes for CRUD operations (form submissions)
  'POST /api/domains': 'DomainController.create',
  'PUT /api/domains/:id': 'DomainController.update',
  'DELETE /api/domains/:id': 'DomainController.destroy',
  
  'POST /api/domains/:domainId/clients': 'ClientController.create',
  'PUT /api/clients/:id': 'ClientController.update',
  'DELETE /api/clients/:id': 'ClientController.destroy',
  
  'POST /api/domains/:domainId/trunks': 'TrunkController.create',
  'PUT /api/trunks/:id': 'TrunkController.update',
  'DELETE /api/trunks/:id': 'TrunkController.destroy',
  
  // User API routes
  'POST /api/users': 'UserController.create',
  'PUT /api/users/:id': 'UserController.update',
  'DELETE /api/users/:id': 'UserController.destroy',
  
  // User-Domain assignment
  'POST /api/users/:userId/domains/:domainId': 'UserController.assignDomain',
  'DELETE /api/users/:userId/domains/:domainId': 'UserController.unassignDomain',
  
  // ===== REST API v1 (Bearer Token Authentication) =====
  'GET /api/v1/domains': 'DomainApiController.getAll',
  'GET /api/v1/domains/:id': 'DomainApiController.getOne',
};