/**
 * DomainController.js
 */
module.exports = {
  create: async function(req, res) {
    try {
      const domain = await Domain.create({ domain: req.body.domain }).fetch();
      
      // Assign users if provided
      if (req.body.userIds && Array.isArray(req.body.userIds)) {
        await Domain.addToCollection(domain.id, 'users', req.body.userIds);
      }
      
      return res.redirect('/domains/' + domain.id);
    } catch (err) {
      req.session.flash = { err: err };
      return res.redirect('/domains/new');
    }
  },
  
  update: async function(req, res) {
    try {
      const domain = await Domain.updateOne({ id: req.params.id })
        .set({ domain: req.body.domain });
      
      if (!domain) {
        return res.notFound();
      }
      
      // Update user assignments if provided
      if (req.body.userIds !== undefined) {
        // Remove all current users
        await Domain.replaceCollection(req.params.id, 'users')
          .members(req.body.userIds || []);
      }
      
      return res.redirect('/domains/' + domain.id);
    } catch (err) {
      return res.serverError(err);
    }
  },
  
  destroy: async function(req, res) {
    try {
      await Domain.destroyOne({ id: req.params.id });
      return res.redirect('/domains');
    } catch (err) {
      return res.serverError(err);
    }
  }
};