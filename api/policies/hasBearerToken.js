/**
 * api/policies/hasBearerToken.js
 * 
 * Policy to authenticate API requests using bearer tokens
 */

module.exports = async function(req, res, proceed) {
  // Get the Authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authorization header required'
    });
  }
  
  // Check if it's a Bearer token
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid authorization format. Use: Bearer <token>'
    });
  }
  
  const token = parts[1];
  
  // Look up the token
  const tokens = sails.config.tokens;
  const userId = tokens[token];
  
  if (!userId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token'
    });
  }
  
  // Load the user
  const user = await User.findOne({ id: userId }).populate('domains');
  
  if (!user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'User not found'
    });
  }
  
  // Attach user to request for use in controllers
  req.apiUser = user;
  
  return proceed();
};