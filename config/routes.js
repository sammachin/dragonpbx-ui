module.exports.routes = {
  // Page routes
  'GET /': { view: 'pages/dashboard' },
  'GET /domains': 'ViewController.domains',
  'GET /domains/new': { view: 'pages/domain-form' },
  'GET /domains/:id': 'ViewController.domainDetail',
  'GET /domains/:id/edit': 'ViewController.editDomain',
  
  // API routes for CRUD operations
  'POST /api/domains': 'DomainController.create',
  'PUT /api/domains/:id': 'DomainController.update',
  'DELETE /api/domains/:id': 'DomainController.destroy',
  
  'POST /api/domains/:domainId/clients': 'ClientController.create',
  'PUT /api/clients/:id': 'ClientController.update',
  'DELETE /api/clients/:id': 'ClientController.destroy',
  
  'POST /api/domains/:domainId/trunks': 'TrunkController.create',
  'PUT /api/trunks/:id': 'TrunkController.update',
  'DELETE /api/trunks/:id': 'TrunkController.destroy'
};