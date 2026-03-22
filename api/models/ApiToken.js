/**
 * ApiToken.js
 *
 * API bearer tokens scoped to specific domains.
 */
module.exports = {
  attributes: {
    token: {
      type: 'string',
      required: true,
      unique: true,
      description: 'The bearer token value'
    },

    label: {
      type: 'string',
      required: true,
      description: 'Human-readable name for this token'
    },

    domains: {
      collection: 'domain',
      via: 'apiTokens'
    }
  }
};
