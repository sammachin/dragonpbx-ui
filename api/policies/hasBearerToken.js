/**
 * api/policies/hasBearerToken.js
 *
 * Policy to authenticate API requests using bearer tokens.
 * Checks master token (env var) first, then database-stored scoped tokens.
 */

module.exports = async function(req, res, proceed) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authorization header required'
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid authorization format. Use: Bearer <token>'
    });
  }

  const token = parts[1];

  // 1. Check master token (env var)
  const masterToken = process.env.MASTER_API_TOKEN;
  if (masterToken && token === masterToken) {
    req.apiUser = { role: 'admin', domains: [] };
    return proceed();
  }

  // 2. Check database-stored scoped tokens
  const apiToken = await ApiToken.findOne({ token }).populate('domains');

  if (!apiToken) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token'
    });
  }

  req.apiToken = apiToken;

  return proceed();
};
