/**
 * AuthController.js
 */
const bcrypt = require('bcrypt');

module.exports = {
  login: async function(req, res) {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        req.session.flash = { error: 'Email and password required' };
        return res.redirect('/login');
      }
      
      const user = await User.findOne({ email });
      
      if (!user) {
        req.session.flash = { error: 'Invalid email or password' };
        return res.redirect('/login');
      }
      
      const validPassword = await bcrypt.compare(password, user.password);
      
      if (!validPassword) {
        req.session.flash = { error: 'Invalid email or password' };
        return res.redirect('/login');
      }
      
      // Store user in session
      req.session.userId = user.id;
      req.session.userRole = user.role;
      
      return res.redirect('/domains');
    } catch (err) {
      return res.serverError(err);
    }
  },
  
  logout: function(req, res) {
    req.session.destroy();
    return res.redirect('/login');
  }
};