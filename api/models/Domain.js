/**
 * Domain.js
 */
module.exports = {
  attributes: {
    domain: {
      type: 'string',
      required: true,
      unique: true,
      description: 'Domain name (e.g., foo.example.com) or IPv4 address'
    },
    
    clients: {
      collection: 'client',
      via: 'domain'
    },
    
    trunks: {
      collection: 'trunk',
      via: 'domain'
    },
    
    users: {
      collection: 'user',
      via: 'domains'
    }
  }
};