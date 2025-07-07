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
          content: "You are an expert LinkedIn content creator who specializes in creating engaging, research-backed posts for professionals. You understand behavioral psychology, current workplace trends, and how to create content that drives engagement."
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
Include practical HR applications and policy implications.`,

      'executives': `Create a LinkedIn post about behavioral economics insights for executive decision-making.

Focus on strategic applications, organizational behavior, and leadership psychology.
Include high-level insights and business impact.`
    },
    
    'leadership-trends': {
      'middle-managers': `Create a LinkedIn post about current leadership trends that middle managers should know about.

Focus on trends that bridge the gap between senior leadership strategy and frontline execution.
Include practical implementation tips and end with a question that encourages engagement.

Length: 300-400 words maximum.`,

      'hr-professionals': `Create a LinkedIn post about leadership development trends affecting HR strategy.

Focus on emerging leadership competencies and development approaches.`,

      'executives': `Create a LinkedIn post about strategic leadership trends shaping organizational success.

Focus on high-level leadership evolution and competitive advantage.`
    },

    'workplace-innovation': {
      'middle-managers': `Create a LinkedIn post about workplace innovation trends that middle managers can leverage.

Focus on practical innovations in team management, process improvement, and employee engagement.
Include actionable insights and real-world applications.`,

      'hr-professionals': `Create a LinkedIn post about HR innovation and technology trends.

Focus on emerging HR technologies and their impact on people operations.`,

      'executives': `Create a LinkedIn post about strategic workplace innovation trends.

Focus on organizational transformation and competitive advantage through innovation.`
    },

    'management-insights': {
      'middle-managers': `Create a LinkedIn post sharing key management insights for middle managers.

Focus on practical management challenges and evidence-based solutions.
Include specific tips and actionable advice.`,

      'hr-professionals': `Create a LinkedIn post about management insights relevant to HR professionals.

Focus on manager development and HR's role in management effectiveness.`,

      'executives': `Create a LinkedIn post about strategic management insights for senior leaders.

Focus on organizational management and strategic leadership perspectives.`
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

app.listen(port, () => {
  console.log(`LinkedIn Post Generator running on port ${port}`);
});