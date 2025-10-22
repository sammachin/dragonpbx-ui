/**
 * User.js
 */
const bcrypt = require('bcrypt');

module.exports = {
  attributes: {
    email: {
      type: 'string',
      required: true,
      unique: true,
      isEmail: true
    },
    
    password: {
      type: 'string',
      required: true
    },
    
    firstName: {
      type: 'string',
      required: true
    },
    
    lastName: {
      type: 'string',
      required: true
    },
    
    role: {
      type: 'string',
      isIn: ['admin', 'user'],
      defaultsTo: 'user'
    },
    
    domains: {
      collection: 'domain',
      via: 'users'
    }
  },
  
  customToJSON: function() {
    // Don't send password to client
    return _.omit(this, ['password']);
  },
  
  beforeCreate: async function(values, proceed) {
    // Hash password before saving
    const hashedPassword = await bcrypt.hash(values.password, 10);
    values.password = hashedPassword;
    return proceed();
  },
  
  beforeUpdate: async function(values, proceed) {
    // Hash password if it's being updated
    if (values.password) {
      const hashedPassword = await bcrypt.hash(values.password, 10);
      values.password = hashedPassword;
    }
    return proceed();
  }
};