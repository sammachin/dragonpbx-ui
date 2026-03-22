/**
 * api/controllers/ApiTokenController.js
 *
 * CRUD for API tokens (admin only).
 */

const crypto = require('crypto');

module.exports = {
  create: async function(req, res) {
    try {
      const { label, domains } = req.body;

      if (!label || !label.trim()) {
        return res.status(400).json({ error: 'Label is required' });
      }

      const token = crypto.randomBytes(32).toString('hex');

      const apiToken = await ApiToken.create({
        token,
        label: label.trim()
      }).fetch();

      // Assign domains
      if (domains && domains.length) {
        const domainIds = Array.isArray(domains) ? domains : [domains];
        for (const domainId of domainIds) {
          await ApiToken.addToCollection(apiToken.id, 'domains', domainId);
        }
      }

      // Return the token value so the admin can copy it (only shown once)
      return res.json({ token: apiToken.token, id: apiToken.id });

    } catch (err) {
      sails.log.error('Error creating API token:', err);
      return res.status(500).json({ error: 'Failed to create token' });
    }
  },

  update: async function(req, res) {
    try {
      const { label, domains } = req.body;
      const tokenId = req.params.id;

      const apiToken = await ApiToken.findOne({ id: tokenId });
      if (!apiToken) {
        return res.status(404).json({ error: 'Token not found' });
      }

      if (label && label.trim()) {
        await ApiToken.updateOne({ id: tokenId }).set({ label: label.trim() });
      }

      // Replace domain assignments
      if (domains !== undefined) {
        await ApiToken.replaceCollection(tokenId, 'domains')
          .members(Array.isArray(domains) ? domains : domains ? [domains] : []);
      }

      return res.redirect('/tokens');

    } catch (err) {
      sails.log.error('Error updating API token:', err);
      return res.status(500).json({ error: 'Failed to update token' });
    }
  },

  destroy: async function(req, res) {
    try {
      const tokenId = req.params.id;

      await ApiToken.destroyOne({ id: tokenId });

      return res.redirect('/tokens');

    } catch (err) {
      sails.log.error('Error deleting API token:', err);
      return res.status(500).json({ error: 'Failed to delete token' });
    }
  }
};
