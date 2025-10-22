/**
 * UserController.js
 */
module.exports = {
  create: async function(req, res) {
    try {
      const userData = {
        email: req.body.email,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        role: req.body.role || 'user'
      };
      
      const user = await User.create(userData).fetch();
      
      // Assign domains if provided
      if (req.body.domainIds && Array.isArray(req.body.domainIds)) {
        await User.addToCollection(user.id, 'domains', req.body.domainIds);
      }
      
      return res.redirect('/users');
    } catch (err) {
      req.session.flash = { error: 'Error creating user' };
      return res.redirect('/users/new');
    }
  },
  
  update: async function(req, res) {
    try {
      const updateData = {
        email: req.body.email,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        role: req.body.role
      };
      
      // Only update password if provided
      if (req.body.password) {
        updateData.password = req.body.password;
      }
      
      const user = await User.updateOne({ id: req.params.id }).set(updateData);
      
      if (!user) {
        return res.notFound();
      }
      
      // Update domain assignments
      if (req.body.domainIds !== undefined) {
        await User.replaceCollection(req.params.id, 'domains')
          .members(req.body.domainIds || []);
      }
      
      return res.redirect('/users');
    } catch (err) {
      return res.serverError(err);
    }
  },
  
  destroy: async function(req, res) {
    try {
      // Don't allow deleting yourself
      if (req.params.id == req.session.userId) {
        req.session.flash = { error: 'Cannot delete your own account' };
        return res.redirect('/users');
      }
      
      await User.destroyOne({ id: req.params.id });
      return res.redirect('/users');
    } catch (err) {
      return res.serverError(err);
    }
  },
  
  assignDomain: async function(req, res) {
    try {
      await User.addToCollection(req.params.userId, 'domains', req.params.domainId);
      return res.ok();
    } catch (err) {
      return res.serverError(err);
    }
  },
  
  unassignDomain: async function(req, res) {
    try {
      await User.removeFromCollection(req.params.userId, 'domains', req.params.domainId);
      return res.ok();
    } catch (err) {
      return res.serverError(err);
    }
  }
};