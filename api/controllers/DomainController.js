/**
 * DomainController.js
 */
module.exports = {
  create: async function(req, res) {
    try {
      const domain = await Domain.create(req.body).fetch();
      return res.redirect('/domains/' + domain.id);
    } catch (err) {
      req.session.flash = { err: err };
      return res.redirect('/domains/new');
    }
  },
  
  update: async function(req, res) {
    try {
      const domain = await Domain.updateOne({ id: req.params.id })
        .set(req.body);
      
      if (!domain) {
        return res.notFound();
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