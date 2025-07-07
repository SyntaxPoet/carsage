const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const OpenAI = require('openai');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Import security middleware
const {
  generalLimiter,
  postGenerationLimiter,
  speedLimiter,
  validatePostGeneration,
  securityConfig,
  usageTracker
} = require('./middleware/security');

const app = express();
const port = process.env.PORT || 3000;

// Security Configuration
app.set('trust proxy', 1); // Trust first proxy (important for Railway/Heroku)

// Apply Helmet for security headers
app.use(helmet(securityConfig));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com', 'https://your-app.railway.app'] 
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing with size limits
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Add request ID for tracking
    req.id = uuidv4();
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting
app.use(speedLimiter);
app.use(generalLimiter);

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip} - ID: ${req.id}`);
  
  // Track usage for future billing
  usageTracker.trackUsage(req);
  
  next();
});

// Serve static files
app.use(express.static('public'));

// Initialize OpenAI with error handling
let openai;
try {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }
  
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 30000, // 30 second timeout
    maxRetries: 2
  });
} catch (error) {
  console.error('Failed to initialize OpenAI:', error.message);
  process.exit(1);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'operational',
    limits: {
      general: '100 requests per 15 minutes',
      postGeneration: '10 posts per hour',
      upgradeMessage: 'Contact for higher limits'
    },
    timestamp: new Date().toISOString()
  });
});

// Main post generation endpoint with security
app.post('/api/generate-post', 
  postGenerationLimiter,
  validatePostGeneration,
  async (req, res) => {
    const startTime = Date.now();
    
    try {
      const { topic, audience, style } = req.body;
      
      // Additional security check
      if (!usageTracker.checkFreeTierLimits(req)) {
        return res.status(429).json({
          success: false,
          error: 'Free tier limit exceeded. Please upgrade for unlimited access.',
          upgradeUrl: '/upgrade' // Future Stripe integration
        });
      }
      
      // Log generation attempt
      console.log(`[${req.id}] Generating post: ${topic} for ${audience}`);
      
      // Create the prompt based on our research
      const prompt = createPostPrompt(topic, audience, style);
      
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are an expert LinkedIn content creator who specializes in creating engaging, research-backed posts for professionals. You understand behavioral psychology, current workplace trends, and how to create content that drives engagement.
            
            Important guidelines:
            - Keep posts between 300-400 words maximum
            - Include relevant emojis for readability
            - End with an engaging question
            - Focus on practical, actionable advice
            - Use current research insights
            - Maintain professional but conversational tone`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
        frequency_penalty: 0.1,
        presence_penalty: 0.1
      });

      const postContent = completion.choices[0].message.content;
      const processingTime = Date.now() - startTime;
      
      // Log successful generation
      console.log(`[${req.id}] Post generated successfully in ${processingTime}ms`);
      
      res.json({
        success: true,
        content: postContent,
        metadata: {
          topic,
          audience,
          style,
          optimal_time: getOptimalPostingTime(audience),
          hashtags: generateHashtags(topic, audience),
          processingTime,
          requestId: req.id
        }
      });

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(`[${req.id}] Post generation failed in ${processingTime}ms:`, error);
      
      // Handle specific OpenAI errors
      if (error.code === 'rate_limit_exceeded') {
        return res.status(429).json({
          success: false,
          error: 'OpenAI rate limit exceeded. Please try again in a moment.'
        });
      }
      
      if (error.code === 'insufficient_quota') {
        return res.status(503).json({
          success: false,
          error: 'Service temporarily unavailable. Please try again later.'
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Failed to generate post. Please try again.',
        requestId: req.id
      });
    }
  }
);

function createPostPrompt(topic, audience, style) {
  const prompts = {
    'behavioral-psychology': {
      'middle-managers': `Create a LinkedIn post about recent behavioral psychology insights that help middle managers solve everyday challenges. 

Based on current research including dual-process theory, nudge theory, and positive psychology findings:

Structure:
- Start with a relatable problem middle managers face (being caught between leadership and frontline, decision fatigue, team motivation challenges)
- Present 2-3 practical applications from behavioral psychology research (e.g., System 1 vs System 2 thinking, choice architecture, positive psychology interventions)
- Include specific, actionable advice they can implement this week
- End with an engaging question to drive comments

Style: Professional but conversational, include relevant emojis for readability, focus on immediate practical value.
Tone: Authoritative but approachable, evidence-based but not academic.

Length: 300-400 words maximum.
Include: Real examples, quick wins, and connection to current research trends.`,

      'hr-professionals': `Create a LinkedIn post about behavioral psychology applications for HR professionals.

Focus on recent research in employee behavior, motivation, and organizational psychology.
Include practical HR applications and policy implications.
Length: 300-400 words maximum.`,

      'executives': `Create a LinkedIn post about behavioral economics insights for executive decision-making.

Focus on strategic applications, organizational behavior, and leadership psychology.
Include high-level insights and business impact.
Length: 300-400 words maximum.`,

      'entrepreneurs': `Create a LinkedIn post about behavioral psychology insights for entrepreneurs.

Focus on customer behavior, decision-making, and startup applications.
Include practical business applications and growth insights.
Length: 300-400 words maximum.`
    },
    
    'leadership-trends': {
      'middle-managers': `Create a LinkedIn post about current leadership trends that middle managers should know about.

Focus on trends that bridge the gap between senior leadership strategy and frontline execution.
Include practical implementation tips and end with a question that encourages engagement.
Length: 300-400 words maximum.`,

      'hr-professionals': `Create a LinkedIn post about leadership development trends affecting HR strategy.

Focus on emerging leadership competencies and development approaches.
Length: 300-400 words maximum.`,

      'executives': `Create a LinkedIn post about strategic leadership trends shaping organizational success.

Focus on high-level leadership evolution and competitive advantage.
Length: 300-400 words maximum.`,

      'entrepreneurs': `Create a LinkedIn post about leadership trends for startup founders and entrepreneurs.

Focus on scaling teams, culture building, and adaptive leadership.
Length: 300-400 words maximum.`
    },

    'workplace-innovation': {
      'middle-managers': `Create a LinkedIn post about workplace innovation trends that middle managers can leverage.

Focus on practical innovations in team management, process improvement, and employee engagement.
Include actionable insights and real-world applications.
Length: 300-400 words maximum.`,

      'hr-professionals': `Create a LinkedIn post about HR innovation and technology trends.

Focus on emerging HR technologies and their impact on people operations.
Length: 300-400 words maximum.`,

      'executives': `Create a LinkedIn post about strategic workplace innovation trends.

Focus on organizational transformation and competitive advantage through innovation.
Length: 300-400 words maximum.`,

      'entrepreneurs': `Create a LinkedIn post about workplace innovation for startups and growing companies.

Focus on cost-effective innovations and scaling culture.
Length: 300-400 words maximum.`
    },

    'management-insights': {
      'middle-managers': `Create a LinkedIn post sharing key management insights for middle managers.

Focus on practical management challenges and evidence-based solutions.
Include specific tips and actionable advice.
Length: 300-400 words maximum.`,

      'hr-professionals': `Create a LinkedIn post about management insights relevant to HR professionals.

Focus on manager development and HR's role in management effectiveness.
Length: 300-400 words maximum.`,

      'executives': `Create a LinkedIn post about strategic management insights for senior leaders.

Focus on organizational management and strategic leadership perspectives.
Length: 300-400 words maximum.`,

      'entrepreneurs': `Create a LinkedIn post about management insights for entrepreneurs and startup founders.

Focus on scaling teams, operational efficiency, and growth management.
Length: 300-400 words maximum.`
    }
  };

  const basePrompt = prompts[topic]?.[audience];
  
  if (!basePrompt) {
    return `Create a professional LinkedIn post about ${topic} for ${audience}. 
    
    Make it engaging, practical, and include actionable insights. 
    Length: 300-400 words maximum.
    Include relevant emojis and end with a question to encourage engagement.`;
  }

  return basePrompt;
}

function getOptimalPostingTime(audience) {
  const times = {
    'middle-managers': 'Tuesday 8:30 AM EST',
    'hr-professionals': 'Wednesday 9:00 AM EST',
    'executives': 'Tuesday 7:00 AM EST',
    'entrepreneurs': 'Monday 7:30 AM EST'
  };
  return times[audience] || 'Tuesday 8:30 AM EST';
}

function generateHashtags(topic, audience) {
  const topicTags = {
    'behavioral-psychology': ['#BehavioralScience', '#Psychology', '#WorkplacePsychology', '#HumanBehavior'],
    'leadership-trends': ['#Leadership', '#Management', '#WorkplaceTrends', '#ProfessionalDevelopment'],
    'workplace-innovation': ['#WorkplaceInnovation', '#FutureOfWork', '#Innovation', '#DigitalTransformation'],
    'management-insights': ['#Management', '#Leadership', '#TeamManagement', '#ProfessionalGrowth']
  };
  
  const audienceTags = {
    'middle-managers': ['#MiddleManagement', '#TeamLeadership', '#ManagementTips'],
    'hr-professionals': ['#HR', '#PeopleOperations', '#HumanResources', '#TalentManagement'],
    'executives': ['#ExecutiveLeadership', '#Strategy', '#BusinessLeadership', '#CLevel'],
    'entrepreneurs': ['#Entrepreneurship', '#StartupLife', '#BusinessDevelopment', '#SmallBusiness']
  };

  return [...(topicTags[topic] || []), ...(audienceTags[audience] || [])];
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error(`[${req.id || 'unknown'}] Unhandled error:`, error);
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    requestId: req.id
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: ['/health', '/api/status', '/api/generate-post']
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

app.listen(port, () => {
  console.log(`LinkedIn Post Generator running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Security: Rate limiting enabled`);
});