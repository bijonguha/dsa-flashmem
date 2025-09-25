# DSA FlashMem

**AI-Powered Flashcard App for Technical Interview Preparation**

DSA FlashMem is a modern, intelligent flashcard application designed to help software engineers master data structures and algorithms through spaced repetition, voice interaction, and AI-powered evaluation. Perfect for technical interview preparation, coding bootcamp students, and anyone looking to strengthen their DSA fundamentals.

![DSA FlashMem Demo](https://via.placeholder.com/800x400/4F46E5/FFFFFF?text=DSA+FlashMem+Demo)

## 🎯 Key Features

### 🧠 **AI-Powered Evaluation**
- **GPT-4 Integration**: Get detailed feedback on your answers with scoring and suggestions
- **Intelligent Analysis**: AI evaluates your understanding of key concepts and identifies missing points
- **Structured Feedback**: Receive specific, actionable advice to improve your explanations

### 🔄 **Spaced Repetition System**
- **Modified Anki Algorithm**: Scientifically proven spaced repetition for optimal retention
- **Dynamic Scheduling**: Cards appear based on your performance and review history
- **Progress Tracking**: Monitor your mastery level and review frequency for each topic

### 🎤 **Voice-First Experience**
- **Web Speech API**: Native browser speech recognition for hands-free practice
- **Real-time Transcription**: See your speech converted to text as you speak
- **Dual Input**: Switch between voice and typing modes seamlessly

### 📊 **Comprehensive Analytics**
- **Progress Dashboard**: Visualize your learning journey with charts and statistics
- **Topic Mastery**: Track your progress across different DSA topics
- **Performance Insights**: Monitor accuracy, streaks, and session times

### 🔧 **Advanced Features**
- **Solution Modal**: View syntax-highlighted code with multiple approaches
- **Timer Integration**: Practice under realistic interview time pressure
- **Offline-First**: All data stored locally using IndexedDB
- **Import/Export**: Easy flashcard management with JSON and CSV support

## 🚀 Quick Start

### Prerequisites

- **Node.js** (version 16 or higher)
- **npm** or **yarn**
- Modern web browser with speech recognition support (Chrome/Edge recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/dsa-flashmem.git
   cd dsa-flashmem
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` to start using DSA FlashMem

### Troubleshooting Installation

If the app is not loading or you're experiencing issues, use these scripts for a complete clean restart:

**For macOS/Linux:**
```bash
./full-restart.sh
```

**For Windows:**
```cmd
restart-app.bat
```

These scripts will:
- Stop any running development servers
- Remove all build artifacts and caches
- Perform a fresh install of dependencies
- Build and start the application

### First Time Setup

1. **Import Sample Data**: Load the provided `sample-flashcards.json` to get started immediately
2. **Configure Settings**: Add your OpenAI API key for AI evaluation (optional but recommended)
3. **Start Reviewing**: Begin your first study session with the sample flashcards

## 📚 Using DSA FlashMem

### 1. Importing Flashcards

**JSON Format**
```json
[
  {
    "id": "two-sum",
    "topic": "Arrays",
    "title": "Two Sum",
    "question": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
    "hint": "Think about using a hash map to store complements.",
    "expected_points": [
      "Use a hash map to store number-to-index mappings",
      "For each number, check if target-number exists in the map",
      "Time complexity: O(n), Space complexity: O(n)"
    ],
    "solution": {
      "approaches": [{
        "name": "Hash Map Approach",
        "code": "def twoSum(nums, target):\n    hashmap = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in hashmap:\n            return [hashmap[complement], i]\n        hashmap[num] = i\n    return []",
        "time_complexity": "O(n)",
        "space_complexity": "O(n)",
        "explanation": "We iterate through the array once, using a hash map to store each number and its index..."
      }]
    },
    "difficulty": "Easy",
    "tags": ["Array", "Hash Table"]
  }
]
```

**CSV Format**
Download the CSV template from the import page for the correct column structure.

### 2. Review Sessions

**Starting a Session**
- Click "Start Review" from the home page
- Cards are automatically scheduled based on spaced repetition algorithm
- Use voice or typing to answer questions

**During Review**
- Read the question carefully
- Explain your solution approach
- Submit for AI evaluation (if API key configured)
- Rate your confidence level (Again/Hard/Good/Easy)
- View detailed solutions with multiple approaches

### 3. AI Evaluation Setup

1. **Get OpenAI API Key**
   - Visit [OpenAI Platform](https://platform.openai.com)
   - Create an account and generate an API key
   - Ensure you have GPT-4 access for best results

2. **Configure in Settings**
   - Navigate to Settings in the app
   - Enter your API key (stored locally only)
   - Customize timer duration and input preferences

## 📈 Dashboard & Analytics

### Key Metrics Tracked
- **Total Cards**: Number of flashcards in your collection
- **Due Today**: Cards scheduled for review today
- **Current Streak**: Consecutive days with reviews
- **Accuracy Rate**: Overall performance percentage

### Progress Visualization
- **Weekly Progress Chart**: Visual representation of daily reviews and accuracy
- **Topic Mastery**: Progress breakdown by DSA topic
- **Study Statistics**: Session times, efficiency metrics, and trends

## 🛠️ Technical Architecture

### Frontend Stack
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Vite** for fast development and building
- **Lucide React** for icons

### Data Management
- **IndexedDB** with Dexie.js for local storage
- **Offline-first** architecture
- **No backend required** - runs entirely in the browser

### AI Integration
- **OpenAI GPT-4** for answer evaluation
- **Structured prompting** for consistent feedback
- **Error handling** and fallback mechanisms

### Voice Recognition
- **Web Speech API** for native browser support
- **Real-time transcription** with confidence scoring
- **Cross-browser compatibility** (Chrome, Edge, Safari)

## 📁 Project Structure

```
dsa-flashmem/
├── public/
│   ├── index.html
│   └── sample-flashcards.json        # Sample dataset
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Timer.tsx             # Countdown timer
│   │   │   └── VoiceRecorder.tsx     # Speech recognition
│   │   ├── dashboard/
│   │   │   ├── Dashboard.tsx         # Analytics dashboard
│   │   │   └── ProgressChart.tsx     # Progress visualization
│   │   └── flashcards/
│   │       ├── FlashcardImport.tsx   # Import functionality
│   │       ├── FlashcardReview.tsx   # Review interface
│   │       └── SolutionModal.tsx     # Solution display
│   ├── hooks/
│   │   └── useSpeechRecognition.ts   # Voice recognition hook
│   ├── services/
│   │   ├── indexedDB.ts              # Database operations
│   │   ├── openai.ts                 # AI evaluation
│   │   ├── srs.ts                    # Spaced repetition
│   │   └── import.ts                 # File import logic
│   ├── types/
│   │   ├── index.ts                  # TypeScript definitions
│   │   └── speech.d.ts               # Web Speech API types
│   ├── App.tsx                       # Main application
│   └── main.tsx                      # Entry point
├── package.json
└── README.md
```

## 🤝 Contributing

We welcome contributions to DSA FlashMem! Here's how you can help:

### Development Setup

1. **Fork and clone** the repository
2. **Install dependencies**: `npm install`
3. **Start development server**: `npm run dev`
4. **Run tests**: `npm test` (when tests are added)
5. **Build for production**: `npm run build`

### Contributing Guidelines

- Follow the existing code style and conventions
- Write meaningful commit messages
- Test your changes thoroughly
- Update documentation as needed

### Areas for Contribution

- **Additional DSA Topics**: More flashcard content
- **Enhanced Analytics**: Additional charts and metrics
- **Mobile Experience**: React Native version
- **Accessibility**: Improved screen reader support
- **Internationalization**: Multi-language support

## 🐛 Troubleshooting

### Common Issues

**Voice Recognition Not Working**
- Ensure you're using Chrome or Edge browser
- Check microphone permissions in browser settings
- Try refreshing the page and allowing microphone access

**AI Evaluation Not Working**
- Verify your OpenAI API key is correct
- Check your OpenAI account has sufficient credits
- Ensure you have GPT-4 access (required for best results)

**Import Errors**
- Validate your JSON/CSV file format
- Check the sample files for correct structure
- Ensure all required fields are present

**Performance Issues**
- Clear browser cache and localStorage
- Check browser console for error messages
- Try using in an incognito/private browser window

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for providing the GPT-4 API
- **NeetCode** for DSA problem inspiration
- **Anki** for spaced repetition algorithm concepts
- **React Community** for excellent tooling and ecosystem

## 📞 Support

- **Issues**: Report bugs or request features on [GitHub Issues](https://github.com/yourusername/dsa-flashmem/issues)
- **Discussions**: Join community discussions on [GitHub Discussions](https://github.com/yourusername/dsa-flashmem/discussions)
- **Email**: Contact us at support@dsa-flashmem.com

---

**Happy Learning! 🚀**

Master your DSA skills with AI-powered spaced repetition and ace your next technical interview.