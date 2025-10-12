/**
 * Client.js
 * Supports two authentication types:
 * 1. Standard auth: username + password + codecs + dialplan
 * 2. RegHook auth: username + reghook URL
 */
module.exports = {
  attributes: {
    username: {
      type: 'string',
      required: true
    },
    
    authType: {
      type: 'string',
      isIn: ['standard', 'reghook'],
      defaultsTo: 'standard',
      description: 'Authentication type: standard (password-based) or reghook (URL-based)'
    },
    
    // Standard auth fields
    password: {
      type: 'string',
      allowNull: true,
      description: 'Required for standard auth'
    },
    
    dialplan: {
      type: 'json',
      defaultsTo: {},
      description: 'Key-value pairs for dialplan configuration (standard auth only)'
    },
    
    codecs: {
      type: 'json',
      defaultsTo: [],
      description: 'Array of allowed codecs (standard auth only)',
      custom: function(value) {
        const allowedCodecs = [
          'PCMU', 'PCMA', 'G722', 'G729', 
          'opus', 'GSM', 'iLBC', 'speex'
        ];
        if (!Array.isArray(value)) return false;
        return value.every(codec => allowedCodecs.includes(codec));
      }
    },
    
    // RegHook auth field
    reghook: {
      type: 'string',
      allowNull: true,
      description: 'Registration hook URL (required for reghook auth)'
    },
    
    domain: {
      model: 'domain',
      required: true
    }
  },
  
  // Custom validation to ensure correct fields based on authType
  customToJSON: function() {
    return this;
  },
  
  beforeCreate: function(values, proceed) {
    if (values.authType === 'standard' && !values.password) {
      return proceed(new Error('Password is required for standard authentication'));
    }
    if (values.authType === 'reghook' && !values.reghook) {
      return proceed(new Error('RegHook URL is required for reghook authentication'));
    }
    return proceed();
  },
  
  beforeUpdate: function(values, proceed) {
    if (values.authType === 'standard' && values.password === undefined) {
      return proceed(new Error('Password is required for standard authentication'));
    }
    if (values.authType === 'reghook' && values.reghook === undefined) {
      return proceed(new Error('RegHook URL is required for reghook authentication'));
    }
    return proceed();
  }
};