/**
 * ViewController.js
 * Handles rendering views with data
 */
module.exports = {
  domains: async function(req, res) {
    try {
      let domains;
      
      if (req.session.userRole === 'admin') {
        // Admin sees all domains
        domains = await Domain.find()
          .populate('clients')
          .populate('trunks')
          .populate('users');
      } else {
        // Regular users see only their assigned domains
        const user = await User.findOne({ id: req.session.userId })
          .populate('domains');
        
        if (!user) {
          return res.redirect('/login');
        }
        
        // Get full domain data with populations
        const domainIds = user.domains.map(d => d.id);
        domains = await Domain.find({ id: domainIds })
          .populate('clients')
          .populate('trunks')
          .populate('users');
      }
      
      return res.view('pages/domains', { 
        domains,
        currentUser: { role: req.session.userRole },
        layout: 'layouts/layout'
      });
    } catch (err) {
      return res.serverError(err);
    }
  },
  
  newDomain: async function(req, res) {
    try {
      const users = await User.find({ role: 'user' });
      
      return res.view('pages/domain-form', {
        users,
        currentUser: { role: req.session.userRole },
        layout: 'layouts/layout'
      });
    } catch (err) {
      return res.serverError(err);
    }
  },
  
  domainDetail: async function(req, res) {
    try {
      const domain = await Domain.findOne({ id: req.params.id })
        .populate('clients')
        .populate('trunks')
        .populate('users');
      
      if (!domain) {
        return res.notFound();
      }
      
      // Check access
      if (req.session.userRole !== 'admin') {
        const userHasAccess = domain.users.some(u => u.id === req.session.userId);
        if (!userHasAccess) {
          return res.forbidden();
        }
      }
      
      const allowedCodecs = ['PCMU', 'PCMA', 'G722', 'opus', 'GSM'];
      
      return res.view('pages/domain-detail', { 
        domain,
        allowedCodecs,
        currentUser: { role: req.session.userRole },
        layout: 'layouts/layout'
      });
    } catch (err) {
      return res.serverError(err);
    }
  },
  
  editDomain: async function(req, res) {
    try {
      const domain = await Domain.findOne({ id: req.params.id })
        .populate('users');
      
      if (!domain) {
        return res.notFound();
      }
      
      // Check access
      if (req.session.userRole !== 'admin') {
        const userHasAccess = domain.users.some(u => u.id === req.session.userId);
        if (!userHasAccess) {
          return res.forbidden();
        }
      }
      
      const users = await User.find({ role: 'user' });
      
      return res.view('pages/domain-form', { 
        domain,
        users,
        currentUser: { role: req.session.userRole },
        layout: 'layouts/layout'
      });
    } catch (err) {
      return res.serverError(err);
    }
  },
  
  users: async function(req, res) {
    try {
      const users = await User.find().populate('domains');
      
      return res.view('pages/users', {
        users,
        currentUser: { role: req.session.userRole },
        layout: 'layouts/layout'
      });
    } catch (err) {
      return res.serverError(err);
    }
  },
  
  newUser: async function(req, res) {
    try {
      const domains = await Domain.find();
      
      return res.view('pages/user-form', {
        domains,
        currentUser: { role: req.session.userRole },
        layout: 'layouts/layout'
      });
    } catch (err) {
      return res.serverError(err);
    }
  },
  
  tokens: async function(req, res) {
    try {
      const tokens = await ApiToken.find().populate('domains');
      const domains = await Domain.find();

      return res.view('pages/tokens', {
        tokens,
        domains,
        currentUser: { role: req.session.userRole },
        layout: 'layouts/layout'
      });
    } catch (err) {
      return res.serverError(err);
    }
  },

  editUser: async function(req, res) {
    try {
      const user = await User.findOne({ id: req.params.id })
        .populate('domains');
      
      if (!user) {
        return res.notFound();
      }
      
      const domains = await Domain.find();
      
      return res.view('pages/user-form', {
        editUser: user,
        domains,
        currentUser: { role: req.session.userRole },
        layout: 'layouts/layout'
      });
    } catch (err) {
      return res.serverError(err);
    }
  }
};