/**
 * TrunkController.js
 */
module.exports = {
  create: async function(req, res) {
    console.log(req.body.codecs)
    try {
      const trunkData = {
        label: req.body.label,
        domain: req.params.domainId,
        inbound: req.body.inbound ? JSON.parse(req.body.inbound) : [],
        outbound: req.body.outbound ? JSON.parse(req.body.outbound) : { host: '' },
        codecs: req.body.codecs ? JSON.parse(req.body.codecs) : [],
        dialplan: req.body.dialplan ? JSON.parse(req.body.dialplan) : {}
      };
      
      const trunk = await Trunk.create(trunkData).fetch();
      return res.redirect('/domains/' + req.params.domainId);
    } catch (err) {
      sails.log.error('Error creating trunk:', err);
      return res.serverError(err);
    }
  },
  
  update: async function(req, res) {
    try {
      const trunk = await Trunk.findOne({ id: req.params.id });
      if (!trunk) {
        return res.notFound();
      }
      
      const updateData = {
        label: req.body.label,
        inbound: req.body.inbound ? JSON.parse(req.body.inbound) : [],
        outbound: req.body.outbound ? JSON.parse(req.body.outbound) : {},
        codecs: req.body.codecs ? JSON.parse(req.body.codecs) : [],
        dialplan: req.body.dialplan ? JSON.parse(req.body.dialplan) : {}
      };
      
      await Trunk.updateOne({ id: req.params.id }).set(updateData);
      return res.redirect('/domains/' + trunk.domain);
    } catch (err) {
      sails.log.error('Error updating trunk:', err);
      return res.serverError(err);
    }
  },
  
  destroy: async function(req, res) {
    try {
      const trunk = await Trunk.findOne({ id: req.params.id });
      if (!trunk) {
        return res.notFound();
      }
      
      const domainId = trunk.domain;
      await Trunk.destroyOne({ id: req.params.id });
      return res.redirect('/domains/' + domainId);
    } catch (err) {
      return res.serverError(err);
    }
  }
};