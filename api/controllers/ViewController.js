/**
 * ViewController.js
 * Handles rendering views with data
 */
module.exports = {
  domains: async function(req, res) {
    try {
      const domains = await Domain.find()
        .populate('clients')
        .populate('trunks');
      
      return res.view('pages/domains', { 
        domains,
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
        .populate('trunks');
      
      if (!domain) {
        return res.notFound();
      }
      
      const allowedCodecs = ['PCMU', 'PCMA', 'G722', 'G729', 'opus', 'GSM', 'iLBC', 'speex'];
      
      return res.view('pages/domain-detail', { 
        domain,
        allowedCodecs,
        layout: 'layouts/layout'
      });
    } catch (err) {
      return res.serverError(err);
    }
  },
  
  editDomain: async function(req, res) {
    try {
      const domain = await Domain.findOne({ id: req.params.id });
      
      if (!domain) {
        return res.notFound();
      }
      
      return res.view('pages/domain-form', { 
        domain,
        layout: 'layouts/layout'
      });
    } catch (err) {
      return res.serverError(err);
    }
  }
};