# 🚀 LinkedIn Post Generator

AI-powered LinkedIn post generator based on current behavioral psychology and economics research. Generate engaging, research-backed posts with a single click!

## ✨ Features

- **AI-Powered Content**: Uses OpenAI GPT to generate engaging LinkedIn posts
- **Research-Based**: Incorporates current trends in behavioral psychology and economics
- **Multiple Topics**: Behavioral psychology, leadership trends, workplace innovation, management insights
- **Audience Targeting**: Tailored content for middle managers, HR professionals, executives, and entrepreneurs
- **Optimal Timing**: Suggests best posting times for maximum engagement
- **Hashtag Generation**: Automatically generates relevant hashtags
- **Copy-to-Clipboard**: Easy copying of generated posts
- **Professional Design**: Clean, responsive interface
- **One-Click Generation**: Simple form-based interface

## 🔧 Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: Vanilla HTML, CSS, JavaScript
- **AI**: OpenAI GPT-3.5-turbo
- **Hosting**: Railway

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+ installed
- OpenAI API key ([get one here](https://platform.openai.com/api-keys))
- Railway account ([sign up here](https://railway.app))

### 2. Local Development

```bash
# Clone the repository
git clone https://github.com/SyntaxPoet/carsage.git
cd carsage/linkedin-generator

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your OpenAI API key

# Start the development server
npm start
```

Open http://localhost:3000 in your browser.

### 3. Deploy to Railway

1. **Connect Repository**:
   - Go to [Railway](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your forked repository
   - Choose the `linkedin-generator` folder as root

2. **Set Environment Variables**:
   - In Railway dashboard, go to "Variables"
   - Add: `OPENAI_API_KEY` = your OpenAI API key

3. **Deploy**:
   - Railway automatically deploys on every git push
   - Your app will be live at: `your-app-name.railway.app`

## 💡 Usage

1. **Select Topic**: Choose from behavioral psychology, leadership trends, workplace innovation, or management insights
2. **Choose Audience**: Target middle managers, HR professionals, executives, or entrepreneurs
3. **Pick Style**: Professional, casual, or thought leadership tone
4. **Generate**: Click the button and wait for AI magic!
5. **Copy & Post**: Use the copy button to grab your post with hashtags

## 🎯 Example Generated Post

**Topic**: Behavioral Psychology  
**Audience**: Middle Managers  
**Style**: Professional

> Middle managers face a unique challenge: you're constantly switching between quick decisions and deep analysis without realizing which mode you're in.
> 
> Recent behavioral psychology research reveals the power of "decision triggers." Here's how to apply this:
> 
> 🧠 **The Dual-Process Challenge**: Before important choices, ask yourself: "Is this a fast decision or a slow decision?"
> 
> ⚡ **Quick wins**: Trust your experience for operational issues
> 🎯 **Strategic thinking**: Force yourself to slow down for planning and team conflicts
> 
> **Real example**: When a team member requests time off during a critical project, your gut might say "no." A simple pause could reveal creative solutions like task redistribution.
> 
> What decision-making challenges are you facing with your team?
> 
> #BehavioralScience #MiddleManagement #TeamLeadership #Psychology #WorkplacePsychology

## 🔧 Configuration

### Environment Variables

```bash
OPENAI_API_KEY=your_openai_api_key_here  # Required
PORT=3000                                # Optional (Railway sets automatically)
```

### Customization

Want to add more topics or audiences? Edit the prompts in `server.js`:

```javascript
// Add new topic in createPostPrompt function
'your-new-topic': {
  'middle-managers': `Your custom prompt here...`
}
```

## 📂 Project Structure

```
linkedin-generator/
├── package.json          # Dependencies and scripts
├── server.js             # Express server with OpenAI integration
├── .env.example          # Environment variable template
├── public/               # Frontend files
│   ├── index.html        # Main HTML page
│   ├── style.css         # Styling and animations
│   └── script.js         # JavaScript functionality
└── README.md             # This file
```

## 🎨 Features in Detail

### AI Post Generation
- Uses GPT-3.5-turbo for cost-effective, high-quality content
- Custom prompts based on behavioral psychology research
- Structured output with engaging hooks and CTAs

### Smart Timing
- Audience-specific optimal posting times
- Based on LinkedIn engagement research
- Tuesday 8:30 AM EST for middle managers (highest engagement)

### Responsive Design
- Mobile-friendly interface
- Professional LinkedIn-blue color scheme
- Smooth animations and loading states

### Error Handling
- Network error recovery
- Input validation
- Fallback clipboard functionality for older browsers

## 🚀 Deployment Options

### Railway (Recommended - $5/month)
✅ Automatic deployments  
✅ Custom domains  
✅ Environment variables  
✅ Built-in monitoring  

### Alternative Options
- **Vercel**: Free tier available, great for static sites
- **Netlify**: Excellent for JAMstack applications
- **Heroku**: Classic PaaS option
- **DigitalOcean App Platform**: Simple container deployment

## 💰 Cost Breakdown

**Monthly Costs**:
- Railway hosting: $5
- OpenAI API usage: $5-20 (varies by usage)
- Domain (optional): $1-2
- **Total**: $11-27/month

**Estimated API Usage**:
- ~$0.002 per post generation
- 1000 posts = ~$2
- Very cost-effective for regular use

## 🛠️ Development

### Local Setup
```bash
# Install dependencies
npm install

# Start with auto-reload
npm run dev

# Health check
curl http://localhost:3000/health
```

### Adding Features
1. **New Topics**: Edit prompts in `server.js`
2. **New Audiences**: Add to audience arrays
3. **Styling**: Modify `public/style.css`
4. **Functionality**: Update `public/script.js`

### API Endpoints
- `GET /health` - Health check
- `POST /api/generate-post` - Generate LinkedIn post
- `GET /` - Serve frontend (static files)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b new-feature`
3. Commit changes: `git commit -m 'Add new feature'`
4. Push to branch: `git push origin new-feature`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⭐ Support

If you find this helpful:
- ⭐ Star the repository
- 🍴 Fork and customize for your needs
- 🐛 Report issues
- 💡 Suggest improvements

## 🔗 Links

- **Live Demo**: [Coming Soon]
- **Railway Deployment**: [Your Railway URL]
- **OpenAI API**: https://platform.openai.com
- **Railway**: https://railway.app

---

Built with ❤️ by [SyntaxPoet](https://github.com/SyntaxPoet)

*Powered by OpenAI and current behavioral psychology research*