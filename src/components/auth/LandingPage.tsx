import React from 'react';
import { BookOpen, Zap, Mic, BarChart3 } from 'lucide-react';

interface LandingPageProps {
  onSignInClick: () => void;
  onSignUpClick: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSignInClick, onSignUpClick }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden md:flex">
        {/* Left Section: Marketing Content */}
        <div className="md:w-1/2 p-8 flex flex-col justify-center text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start mb-4">
            <BookOpen className="h-10 w-10 text-blue-600 mr-3" />
            <h1 className="text-4xl font-extrabold text-gray-900">DSA FlashMem</h1>
          </div>
          <p className="text-gray-700 text-lg mb-6 leading-relaxed">
            Master Data Structures and Algorithms with AI-powered flashcards, spaced repetition, and
            voice interaction. Your ultimate tool for interview preparation.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="flex items-center text-gray-700">
              <Zap className="h-5 w-5 text-purple-500 mr-2" />
              <span>AI-Powered Evaluation</span>
            </div>
            <div className="flex items-center text-gray-700">
              <BarChart3 className="h-5 w-5 text-green-500 mr-2" />
              <span>Spaced Repetition</span>
            </div>
            <div className="flex items-center text-gray-700">
              <Mic className="h-5 w-5 text-red-500 mr-2" />
              <span>Voice Input</span>
            </div>
            <div className="flex items-center text-gray-700">
              <BookOpen className="h-5 w-5 text-blue-500 mr-2" />
              <span>Comprehensive Solutions</span>
            </div>
          </div>

          <p className="text-gray-600 text-sm">
            Ready to ace your technical interviews? Join DSA FlashMem today!
          </p>
        </div>

        {/* Right Section: Auth Call to Action */}
        <div className="md:w-1/2 bg-gray-50 p-8 flex flex-col justify-center items-center text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Get Started</h2>
          <button
            onClick={onSignUpClick}
            className="w-full max-w-xs bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-colors mb-4"
          >
            Sign Up for Free
          </button>
          <p className="text-gray-600 mb-4">Already have an account?</p>
          <button
            onClick={onSignInClick}
            className="w-full max-w-xs bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg shadow-md transition-colors"
          >
            Log In
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
