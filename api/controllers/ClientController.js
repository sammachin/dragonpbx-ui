/**
 * ClientController.js
 */
module.exports = {
  create: async function(req, res) {
    try {
      const authType = req.body.authType || 'standard';
      
      const clientData = {
        username: req.body.username,
        authType: authType,
        domain: req.params.domainId
      };
      
      if (authType === 'standard') {
        clientData.password = req.body.password;
        clientData.codecs = req.body.codecs ? JSON.parse(req.body.codecs) : [];
        clientData.dialplan = req.body.dialplan ? JSON.parse(req.body.dialplan) : {};
      } else if (authType === 'reghook') {
        clientData.reghook = req.body.reghook;
      }
      
      const client = await Client.create(clientData).fetch();
      return res.redirect('/domains/' + req.params.domainId);
    } catch (err) {
      return res.serverError(err);
    }
  },
  
  update: async function(req, res) {
    try {
      const client = await Client.findOne({ id: req.params.id });
      if (!client) {
        return res.notFound();
      }
      
      const authType = req.body.authType || client.authType;
      
      const updateData = {
        username: req.body.username,
        authType: authType
      };
      
      if (authType === 'standard') {
        updateData.password = req.body.password;
        updateData.codecs = req.body.codecs ? JSON.parse(req.body.codecs) : [];
        updateData.dialplan = req.body.dialplan ? JSON.parse(req.body.dialplan) : {};
        updateData.reghook = null;
      } else if (authType === 'reghook') {
        updateData.reghook = req.body.reghook;
        updateData.password = null;
        updateData.codecs = [];
        updateData.dialplan = {};
      }
      
      await Client.updateOne({ id: req.params.id }).set(updateData);
      return res.redirect('/domains/' + client.domain);
    } catch (err) {
      return res.serverError(err);
    }
  },
  
  destroy: async function(req, res) {
    try {
      const client = await Client.findOne({ id: req.params.id });
      if (!client) {
        return res.notFound();
      }
      
      const domainId = client.domain;
      await Client.destroyOne({ id: req.params.id });
      return res.redirect('/domains/' + domainId);
    } catch (err) {
      return res.serverError(err);
    }
  }
};