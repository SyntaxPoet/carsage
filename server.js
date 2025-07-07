const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Main post generation endpoint
app.post('/api/generate-post', async (req, res) => {
  try {
    const { topic, audience, style } = req.body;
    
    // Create the prompt based on our research
    const prompt = createPostPrompt(topic, audience, style);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert LinkedIn content creator who specializes in creating engaging, research-backed posts for professionals. You understand behavioral psychology, current management challenges, and how to translate complex research into actionable insights."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    });

    const postContent = completion.choices[0].message.content;
    
    res.json({
      success: true,
      content: postContent,
      metadata: {
        topic,
        audience,
        optimal_time: getOptimalPostingTime(audience),
        hashtags: generateHashtags(topic, audience)
      }
    });

  } catch (error) {
    console.error('Error generating post:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate post. Please try again.'
    });
  }
});

function createPostPrompt(topic, audience, style) {
  const prompts = {
    'behavioral-psychology': {
      'middle-managers': `Create a LinkedIn post about recent behavioral psychology insights that help middle managers solve everyday challenges. 

Structure:
- Start with a relatable problem middle managers face (being caught between senior leadership and frontline teams)
- Present 2-3 practical applications from behavioral psychology research (like dual-process theory for decision making, nudge techniques for team behavior, positive psychology for performance)
- Include specific, actionable advice they can use this week
- End with an engaging question to drive comments

Style: Professional but conversational, include emojis for readability, focus on immediate practical value.

Length: 300-400 words maximum.

Make it feel like advice from a peer who understands their challenges.`,

      'hr-professionals': `Create a LinkedIn post about behavioral psychology applications for HR professionals.

Focus on:
- Employee engagement and motivation
- Behavioral interventions for workplace culture
- Evidence-based approaches to performance management
- Practical tools they can implement immediately

Style: Professional, research-backed, actionable.`,

      'executives': `Create a LinkedIn post about behavioral psychology insights for executive decision-making.

Focus on:
- Strategic decision-making frameworks
- Leading organizational behavior change
- Research-backed leadership approaches
- Balancing intuition with systematic thinking

Style: Thought leadership, strategic perspective.`
    },

    'leadership-trends': {
      'middle-managers': `Create a LinkedIn post about current leadership trends that middle managers should know about.

Focus on trends that bridge the gap between senior leadership strategy and frontline execution.

Include practical implementation tips and end with a question that encourages engagement.

Style: Practical, forward-looking, peer-to-peer advice.`,

      'hr-professionals': `Create a LinkedIn post about leadership development trends affecting HR.

Focus on:
- New approaches to leadership development
- Skills gaps and training needs
- Technology's role in leadership
- Measuring leadership effectiveness

Style: Professional, data-driven, actionable.`
    },

    'workplace-innovation': {
      'middle-managers': `Create a LinkedIn post about workplace innovation that middle managers can champion.

Focus on:
- Small innovations with big impact
- Getting buy-in for new approaches
- Balancing innovation with operational needs
- Tools and techniques they can try

Style: Practical, encouraging, realistic about constraints.`
    },

    'management-insights': {
      'middle-managers': `Create a LinkedIn post sharing practical management insights for middle managers.

Focus on:
- Real challenges they face daily
- Proven techniques that work
- Lessons learned from experience
- Building better teams

Style: Experienced, practical, supportive.`
    }
  };

  const basePrompt = prompts[topic]?.[audience];
  
  if (!basePrompt) {
    return `Create a professional LinkedIn post about ${topic} for ${audience}. Make it practical, engaging, and include actionable advice. End with a question to encourage engagement.`;
  }

  return basePrompt;
}

function getOptimalPostingTime(audience) {
  const times = {
    'middle-managers': 'Tuesday 8:30 AM EST',
    'hr-professionals': 'Wednesday 9:00 AM EST',
    'executives': 'Tuesday 7:00 AM EST',
    'entrepreneurs': 'Thursday 9:00 AM EST'
  };
  return times[audience] || 'Tuesday 8:30 AM EST';
}

function generateHashtags(topic, audience) {
  const topicTags = {
    'behavioral-psychology': ['#BehavioralScience', '#Psychology', '#Leadership', '#Management'],
    'leadership-trends': ['#Leadership', '#Management', '#WorkplaceTrends', '#ProfessionalDevelopment'],
    'workplace-innovation': ['#Innovation', '#WorkplaceChange', '#Management', '#Leadership'],
    'management-insights': ['#Management', '#Leadership', '#TeamLeadership', '#ProfessionalGrowth']
  };
  
  const audienceTags = {
    'middle-managers': ['#MiddleManagement', '#TeamLeadership'],
    'hr-professionals': ['#HR', '#PeopleOperations', '#HumanResources'],
    'executives': ['#ExecutiveLeadership', '#Strategy'],
    'entrepreneurs': ['#Entrepreneurship', '#StartupLife']
  };

  return [...(topicTags[topic] || []), ...(audienceTags[audience] || [])];
}

app.listen(port, () => {
  console.log(`LinkedIn Post Generator running on port ${port}`);
});