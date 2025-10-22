/**
 * isAdmin
 * Check if user is an admin
 */
module.exports = async function(req, res, proceed) {
  if (req.session.userRole === 'admin') {
    return proceed();
  }
  
  return res.forbidden('You must be an admin to access this resource');
};