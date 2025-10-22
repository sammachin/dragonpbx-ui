/**
 * config/tokens.js
 * 
 * Bearer tokens for API authentication
 * Format: { 'token': userId }
 */

module.exports.tokens = {
  // Example tokens - replace with your own secure random tokens
  'dev-admin-token-123': 4, // Maps to admin user with ID 1
  'dev-user-token-456': 2,  // Maps to regular user with ID 2
  
  // Generate secure tokens with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  // Then map them to user IDs:
  // 'a3f5e8c9d2b1a7f4e6c8d9b2a1f3e5c7': 3,
  // 'b4f6e9c0d3b2a8f5e7c9d0b3a2f4e6c8': 4,
};

/**
 * To add a new API token:
 * 
 * 1. Generate a secure token:
 *    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 * 
 * 2. Find the user ID you want to associate it with:
 *    In Sails console: await User.find()
 * 
 * 3. Add the mapping above:
 *    'your-generated-token': userId
 * 
 * 4. Restart Sails
 * 
 * Usage in API calls:
 *    curl -H "Authorization: Bearer your-generated-token" http://localhost:1337/api/v1/domains/1
 */