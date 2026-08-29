'use client'

import Link from 'next/link'
import { ArrowLeft, Brain, Target, Shield, TrendingUp, Users } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center">
          <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-800">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </Link>
          <h1 className="text-2xl font-bold text-blue-600 ml-6">About Apex Analytics</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">AI-Powered Sports Predictions</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Apex Analytics combines cutting-edge artificial intelligence with comprehensive sports data 
            to deliver accurate predictions across multiple sports and leagues worldwide.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center space-x-3 mb-4">
              <Brain className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold">5 AI Models</h3>
            </div>
            <p className="text-gray-600">
              We use five advanced AI models: QuantVantage Alpha, Stratagem Neural-X, 
              MetricPulse Engine, Stochastic Core-R1, and NexusOdds Vector. Each model 
              analyzes data differently, providing a comprehensive prediction.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center space-x-3 mb-4">
              <Target className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold">Consensus Predictions</h3>
            </div>
            <p className="text-gray-600">
              Our system aggregates predictions from all five AI models to identify 
              consensus picks with the highest confidence levels, giving you the best 
              possible betting recommendations.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center space-x-3 mb-4">
              <TrendingUp className="w-6 h-6 text-purple-600" />
              <h3 className="text-lg font-semibold">Live Tracking</h3>
            </div>
            <p className="text-gray-600">
              Track the performance of each AI model in real-time with our leaderboard. 
              See which model is winning and make informed decisions based on historical accuracy.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="w-6 h-6 text-orange-600" />
              <h3 className="text-lg font-semibold">Secure & Transparent</h3>
            </div>
            <p className="text-gray-600">
              We maintain complete transparency in our predictions. All AI models 
              are independently tracked, and we provide clear reasoning for every 
              recommendation.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white mb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold">159+</p>
              <p className="text-sm opacity-90">Leagues Covered</p>
            </div>
            <div>
              <p className="text-3xl font-bold">5</p>
              <p className="text-sm opacity-90">AI Models</p>
            </div>
            <div>
              <p className="text-3xl font-bold">40+</p>
              <p className="text-sm opacity-90">Daily Predictions</p>
            </div>
            <div>
              <p className="text-3xl font-bold">100%</p>
              <p className="text-sm opacity-90">Free to Use</p>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Mission</h2>
          <p className="text-gray-600 max-w-3xl mx-auto">
            We believe that data-driven insights should be accessible to everyone. 
            By combining the power of artificial intelligence with real-time sports data, 
            we empower sports enthusiasts and bettors to make smarter, more informed decisions.
          </p>
        </div>
      </main>
    </div>
  )
}