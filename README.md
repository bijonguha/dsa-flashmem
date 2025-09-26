<div align="center">

# 🚀 DSA FlashMem

**AI-Powered Spaced Repetition Flashcards for Data Structures & Algorithms**

[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.58.0-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3.6-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-5.0.8-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)

</div>

## ✨ Features

- 🎯 **AI-Powered Evaluation** - OpenAI & Google Gemini integration for intelligent answer assessment
- 🧠 **Spaced Repetition System** - Scientifically proven learning algorithm
- 🎤 **Voice Recognition** - Practice with voice input for better retention
- 📊 **Progress Analytics** - Detailed dashboard with learning insights
- 🔄 **Smart Import** - Support for JSON/CSV flashcard imports
- 🎨 **Modern UI** - Beautiful, responsive design with dark/light themes
- ⚡ **Real-time Sync** - Cloud-based progress synchronization

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dsa-flashmem
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```

   Add your API keys to `.env.local`:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_OPENAI_API_KEY=your_openai_api_key
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 📱 Screenshots

<div align="center">
  <img src="https://via.placeholder.com/800x400/6366f1/ffffff?text=Dashboard+Preview" alt="Dashboard" width="100%"/>
  <p><em>Interactive dashboard with progress tracking and analytics</em></p>
</div>

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Build Tool**: Vite
- **Database**: Supabase (PostgreSQL)
- **AI Services**: OpenAI GPT-4, Google Gemini Pro
- **State Management**: React Hooks + Context API
- **Routing**: React Router v7
- **Icons**: Lucide React

## 📚 Key Components

- **FlashcardReview** - Interactive review sessions with AI evaluation
- **ProgressChart** - Visual learning progress analytics
- **VoiceRecorder** - Speech recognition for hands-free practice
- **SupabaseDataService** - Database operations and real-time sync
- **SRS Algorithm** - Spaced repetition system implementation

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Supabase](https://supabase.com/) for backend services
- AI evaluation powered by [OpenAI](https://openai.com/) and [Google Gemini](https://ai.google.dev/)
- UI components styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons from [Lucide React](https://lucide.dev/)

---

<div align="center">
  <p><strong>Master DSA with AI-powered flashcards! 🚀</strong></p>
  <p>Made with ❤️ for developers who love to learn</p>
</div>