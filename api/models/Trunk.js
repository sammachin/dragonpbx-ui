/**
 * Trunk.js
 */
module.exports = {
  attributes: {
    label: {
      type: 'string',
      required: true,
      unique: false,
      description: 'label'
    },
    authType: {
      type: 'string',
      isIn: ['ip', 'registration', 'authentication'],
      defaultsTo: 'ip',
      description: 'Authentication type: ip-based, registration-based, or authentication-based'
    },
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
    registrationUsername: {
      type: 'string',
      allowNull: true,
      description: 'Username for registration-based authentication'
    },
    registrationPassword: {
      type: 'string',
      allowNull: true,
      description: 'Password for registration-based authentication'
    },
    registrationServer: {
      type: 'string',
      allowNull: true,
      description: 'Server for registration-based authentication'
    },
    authenticationUsername: {
      type: 'string',
      allowNull: true,
      description: 'Username for authentication-based inbound'
    },
    authenticationPassword: {
      type: 'string',
      allowNull: true,
      description: 'Password for authentication-based inbound'
    },
    
    outbound: {
      type: 'json',
      defaultsTo: {},
      description: 'Outbound configuration with host, username (optional), password (optional)',
      custom: function(value) {
        if (typeof value !== 'object') return false;
        //if (!value.host || typeof value.host !== 'string') return false;
        return true;
      }
    },
    
    dialplan: {
      type: 'json',
      defaultsTo: {},
      description: 'Key-value pairs for dialplan configuration'
    },
    
    codecs: {
    type: 'json',
    defaultsTo: [],
    description: 'Array of allowed codecs',
    custom: function(value) {
        if (!Array.isArray(value)) return false;
        return value.every(codec => sails.config.custom.allowedCodecs.includes(codec));
    }
    },
        
    domain: {
      model: 'domain',
      required: true
    }
  }
};