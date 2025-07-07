const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const { body, validationResult } = require('express-validator');

// Rate limiting configuration
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    // Use memory store for simplicity, consider Redis for production scaling
    handler: (req, res) => {
      res.status(429).json({
        error: message,
        retryAfter: Math.round(windowMs / 1000)
      });
    }
  });
};

// General API rate limiting - 100 requests per 15 minutes
const generalLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100,
  'Too many requests from this IP, please try again in 15 minutes.'
);

// Strict rate limiting for post generation - 10 posts per hour
const postGenerationLimiter = createRateLimit(
  60 * 60 * 1000, // 1 hour
  10,
  'Post generation limit exceeded. You can generate 10 posts per hour. Consider upgrading for higher limits.'
);

// Very strict rate limiting for potential abuse - 3 requests per minute
const strictLimiter = createRateLimit(
  60 * 1000, // 1 minute
  3,
  'Too many requests. Please slow down.'
);

// Slow down repeated requests
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 5, // Allow 5 requests per windowMs without delay
  delayMs: 500, // Add 500ms delay per request after delayAfter
  maxDelayMs: 20000, // Maximum delay of 20 seconds
});

// Input validation for post generation
const validatePostGeneration = [
  body('topic')
    .isIn(['behavioral-psychology', 'leadership-trends', 'workplace-innovation', 'management-insights'])
    .withMessage('Invalid topic selected'),
  body('audience')
    .isIn(['middle-managers', 'hr-professionals', 'executives', 'entrepreneurs'])
    .withMessage('Invalid audience selected'),
  body('style')
    .optional()
    .isIn(['professional', 'casual', 'thought-leadership'])
    .withMessage('Invalid style selected'),
  
  // Custom validation middleware
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input parameters',
        details: errors.array()
      });
    }
    next();
  }
];

// Security headers configuration
const securityConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable if causing issues with external resources
};

// Usage tracking for future Stripe integration
const usageTracker = {
  // Track usage by IP for free tier
  trackUsage: (req) => {
    const ip = req.ip;
    const now = Date.now();
    
    // This would be stored in database in production
    // For now, we'll add it to request for logging
    req.usage = {
      ip,
      timestamp: now,
      endpoint: req.path,
      userAgent: req.get('User-Agent')
    };
  },
  
  // Check if user has exceeded free tier limits
  checkFreeTierLimits: (req) => {
    // This would check against database in production
    // For now, we rely on rate limiting middleware
    return true;
  }
};

module.exports = {
  generalLimiter,
  postGenerationLimiter,
  strictLimiter,
  speedLimiter,
  validatePostGeneration,
  securityConfig,
  usageTracker
};