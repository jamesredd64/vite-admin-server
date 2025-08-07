const { auth } = require('express-oauth2-jwt-bearer');
const User = require('../models/user');

// Configure Auth0 middleware
const validateAuth0Token = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
  tokenSigningAlg: 'RS256'
});

// Middleware to require authentication
const requireAuth = async (req, res, next) => {
  try {
    // Log incoming request headers for debugging
    console.log('Auth Headers:', {
      authorization: req.headers.authorization ? 'Present' : 'Missing',
      contentType: req.headers['content-type']
    });

    await validateAuth0Token(req, res, (err) => {
      if (err) {
        console.error('Token validation error:', err);
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired token',
          error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      }
      next();
    });
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Middleware to require admin role
const requireAdmin = async (req, res, next) => {
  try {
    // Log auth payload for debugging
    console.log('Auth payload:', req.auth?.payload);

    const rolesClaim = 'https://dev-rq8rokyotwtjem12.jr.com/roles';
    const roles = req.auth?.payload?.[rolesClaim];

      console.log("🔍 Roles (raw):", JSON.stringify(roles, null, 2));
      console.log("🔍 Type of roles:", typeof roles);
      console.log("🔍 Is array:", Array.isArray(roles));
    
    console.log('🔍 Roles:', roles);
    
    const isAdmin = Array.isArray(roles)
      ? roles.includes('showcase_admin')
      : roles === 'showcase_admin';
      
      
    
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden – Admin access required'
      });
    }
    
    // if (!roles || !Array.isArray(roles) || (!roles.includes('showcase_admin') && !roles.includes('super-admin'))) {
      // if (!roles || !Array.isArray(roles) || (!roles.includes('showcase_admin') )) {
      // console.log('Forbidden - Admin access required. Roles:', roles);
      // return res.status(403).json({
      //   success: false,
      //   message: 'Forbidden - Admin access required'
      // });
    //}

    console.log('Admin access granted. Roles:', roles);
    next();
  } catch (error) {
    console.error('Admin verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  requireAuth,
  requireAdmin,
  validateAuth0Token
};


