/**
 * isLoggedIn
 * Check if user is authenticated
 */
module.exports = async function(req, res, proceed) {
  if (req.session.userId) {
    return proceed();
  }
  
  return res.redirect('/login');
};