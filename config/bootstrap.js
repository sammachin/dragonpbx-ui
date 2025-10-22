/**
 * Bootstrap
 * Create default admin user if none exists
 */
module.exports.bootstrap = async function() {
  // Check if admin exists
  const adminExists = await User.findOne({ email: 'admin@example.com' });
  
  if (!adminExists) {
    await User.create({
      email: 'admin@example.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin'
    });
    
    sails.log.info('Default admin user created: admin@example.com / admin123');
  }
};