/**
 * api/controllers/DomainApiController.js
 *
 * REST API endpoints for domains.
 * Supports master token (all domains) and scoped tokens (specific domains).
 */

module.exports = {
  /**
   * Get a single domain with all its data (clients and trunks)
   * GET /api/v1/domains/:id
   */
  getOne: async function(req, res) {
    try {
      const domainId = parseInt(req.params.id, 10);

      const domain = await Domain.findOne({ id: domainId })
        .populate('clients')
        .populate('trunks')
        .populate('users');

      if (!domain) {
        return res.status(404).json({
          error: 'Not Found',
          message: `Domain with ID ${domainId} not found`
        });
      }

      // Access control: scoped tokens can only access their assigned domains
      if (req.apiToken) {
        const allowedIds = req.apiToken.domains.map(d => d.id);
        if (!allowedIds.includes(domain.id)) {
          return res.status(403).json({
            error: 'Forbidden',
            message: 'Token does not have access to this domain'
          });
        }
      }

      return res.json({
        domain: {
          id: domain.id,
          domain: domain.domain,
          createdAt: domain.createdAt,
          updatedAt: domain.updatedAt,
          clients: domain.clients.map(client => ({
            id: client.id,
            label: client.label,
            username: client.username,
            authType: client.authType,
            password: client.password,
            reghook: client.reghook,
            codecs: client.codecs,
            dialplan: client.dialplan,
            createdAt: client.createdAt,
            updatedAt: client.updatedAt
          })),
          trunks: domain.trunks.map(trunk => ({
            id: trunk.id,
            label: trunk.label,
            authType: trunk.authType,
            regUser: trunk.registrationUsername,
            regPass: trunk.registraitonPassword,
            regHost: trunk.registrationServer,
            authUser: trunk.authenticationUsername,
            authPass: trunk.authenticationPassword,
            inbound: trunk.inbound,
            outbound: trunk.outbound,
            codecs: trunk.codecs,
            dialplan: trunk.dialplan,
            createdAt: trunk.createdAt,
            updatedAt: trunk.updatedAt
          })),
          users: domain.users.map(u => ({
            id: u.id,
            email: u.email,
            firstName: u.firstName,
            lastName: u.lastName,
            role: u.role
          }))
        }
      });

    } catch (err) {
      sails.log.error('Error in DomainApiController.getOne:', err);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'An error occurred while fetching the domain'
      });
    }
  },

  /**
   * Get all domains accessible to the authenticated token
   * GET /api/v1/domains
   */
  getAll: async function(req, res) {
    try {
      let domains;

      if (req.apiToken) {
        // Scoped token: only assigned domains
        const domainIds = req.apiToken.domains.map(d => d.id);
        domains = await Domain.find({ id: domainIds })
          .populate('clients')
          .populate('trunks')
          .populate('users');
      } else {
        // Master token: all domains
        domains = await Domain.find()
          .populate('clients')
          .populate('trunks')
          .populate('users');
      }

      const formattedDomains = domains.map(domain => ({
        id: domain.id,
        domain: domain.domain,
        createdAt: domain.createdAt,
        updatedAt: domain.updatedAt,
        clientCount: domain.clients.length,
        trunkCount: domain.trunks.length,
        clients: domain.clients.map(client => ({
          id: client.id,
          label: client.label,
          username: client.username,
          authType: client.authType,
          password: client.password,
          reghook: client.reghook,
          codecs: client.codecs,
          dialplan: client.dialplan,
          createdAt: client.createdAt,
          updatedAt: client.updatedAt
        })),
        trunks: domain.trunks.map(trunk => {
          const trunkData = {
            id: trunk.id,
            label: trunk.label,
            authType: trunk.authType,
            inbound: trunk.inbound,
            outbound: trunk.outbound,
            codecs: trunk.codecs,
            dialplan: trunk.dialplan,
            createdAt: trunk.createdAt,
            updatedAt: trunk.updatedAt
          };

          if (trunk.authType === 'registration') {
            trunkData.regUser = trunk.registrationUsername;
            trunkData.regPass = trunk.registrationPassword;
            trunkData.regHost = trunk.registrationServer;
          }

          if (trunk.authType === 'authentication') {
            trunkData.authUser = trunk.authenticationUsername;
            trunkData.authPass = trunk.authenticationPassword;
          }

          return trunkData;
        }),
        users: domain.users.map(u => ({
          id: u.id,
          email: u.email,
          firstName: u.firstName,
          lastName: u.lastName,
          role: u.role
        }))
      }));

      return res.json({
        domains: formattedDomains,
        count: formattedDomains.length
      });

    } catch (err) {
      sails.log.error('Error in DomainApiController.getAll:', err);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'An error occurred while fetching domains'
      });
    }
  }
};
