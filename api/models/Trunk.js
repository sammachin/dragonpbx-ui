/**
 * Trunk.js
 */
module.exports = {
  attributes: {
    inbound: {
      type: 'json',
      defaultsTo: [],
      description: 'Array of IP addresses with netmasks (e.g., ["1.2.3.4/24"])',
      custom: function(value) {
        if (!Array.isArray(value)) return false;
        const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
        return value.every(ip => cidrRegex.test(ip));
      }
    },
    
    outbound: {
      type: 'json',
      defaultsTo: {},
      description: 'Outbound configuration with host, username (optional), password (optional)',
      custom: function(value) {
        if (typeof value !== 'object') return false;
        if (!value.host || typeof value.host !== 'string') return false;
        return true;
      }
    },
    
    dialplan: {
      type: 'json',
      defaultsTo: {},
      description: 'Key-value pairs for dialplan configuration'
    },
    
    domain: {
      model: 'domain',
      required: true
    }
  }
};