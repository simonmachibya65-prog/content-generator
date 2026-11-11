import { useState } from 'react';
import { Search, Book, MessageCircle, Video, FileText, ExternalLink, ChevronRight, Mail, Phone } from 'lucide-react';

export default function Help() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Topics', icon: Book },
    { id: 'getting-started', name: 'Getting Started', icon: FileText },
    { id: 'content', name: 'Content Creation', icon: FileText },
    { id: 'publishing', name: 'Publishing & Scheduling', icon: FileText },
    { id: 'analytics', name: 'Analytics & Insights', icon: FileText },
    { id: 'advertising', name: 'Advertising', icon: FileText },
    { id: 'ai', name: 'AI Intelligence', icon: FileText },
    { id: 'billing', name: 'Billing & Plans', icon: FileText },
  ];

  const articles = [
    {
      id: 1,
      category: 'getting-started',
      title: 'How to connect your social media accounts',
      description: 'Step-by-step guide to linking Facebook, Instagram, LinkedIn, TikTok, X, and YouTube',
      readTime: '3 min read',
    },
    {
      id: 2,
      category: 'getting-started',
      title: 'Understanding your dashboard',
      description: 'Navigate your SpyRex dashboard and understand key metrics',
      readTime: '5 min read',
    },
    {
      id: 3,
      category: 'content',
      title: 'Creating your first post',
      description: 'Learn how to create, schedule, and publish content across platforms',
      readTime: '4 min read',
    },
    {
      id: 4,
      category: 'content',
      title: 'Using AI to generate content ideas',
      description: 'Leverage AI Intelligence to create engaging content',
      readTime: '6 min read',
    },
    {
      id: 5,
      category: 'publishing',
      title: 'Scheduling posts for optimal engagement',
      description: 'Best practices for timing your posts',
      readTime: '4 min read',
    },
    {
      id: 6,
      category: 'publishing',
      title: 'Managing your content calendar',
      description: 'Organize and plan your content strategy',
      readTime: '5 min read',
    },
    {
      id: 7,
      category: 'analytics',
      title: 'Understanding your analytics dashboard',
      description: 'Track performance metrics and audience insights',
      readTime: '7 min read',
    },
    {
      id: 8,
      category: 'analytics',
      title: 'Measuring ROI on social media',
      description: 'Calculate and improve your social media return on investment',
      readTime: '8 min read',
    },
    {
      id: 9,
      category: 'advertising',
      title: 'Creating your first ad campaign',
      description: 'Launch effective advertising campaigns',
      readTime: '6 min read',
    },
    {
      id: 10,
      category: 'advertising',
      title: 'Ad budget optimization',
      description: 'Get the most out of your advertising budget',
      readTime: '5 min read',
    },
    {
      id: 11,
      category: 'ai',
      title: 'AI-powered content recommendations',
      description: 'Let AI suggest the best content for your audience',
      readTime: '4 min read',
    },
    {
      id: 12,
      category: 'ai',
      title: 'Competitor analysis with AI',
      description: 'Track and analyze your competitors strategies',
      readTime: '6 min read',
    },
    {
      id: 13,
      category: 'billing',
      title: 'Upgrading your plan',
      description: 'Choose the right plan for your business',
      readTime: '3 min read',
    },
    {
      id: 14,
      category: 'billing',
      title: 'Managing billing and invoices',
      description: 'View and download your billing history',
      readTime: '2 min read',
    },
  ];

  const videos = [
    {
      id: 1,
      title: 'Getting Started with SpyRex',
      duration: '8:42',
      thumbnail: 'https://via.placeholder.com/320x180/4F46E5/ffffff?text=Getting+Started',
    },
    {
      id: 2,
      title: 'Creating Your First Campaign',
      duration: '12:15',
      thumbnail: 'https://via.placeholder.com/320x180/4F46E5/ffffff?text=First+Campaign',
    },
    {
      id: 3,
      title: 'AI Content Generation Tutorial',
      duration: '10:30',
      thumbnail: 'https://via.placeholder.com/320x180/4F46E5/ffffff?text=AI+Content',
    },
  ];

  const filteredArticles = articles.filter(article => {
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Help Center</h1>
          <p className="text-gray-600">Find answers and learn how to get the most out of SpyRex</p>
          
          {/* Search */}
          <div className="mt-6 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Categories */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-4">
              <h2 className="font-semibold text-gray-900 mb-3">Categories</h2>
              <nav className="space-y-1">
                {categories.map(category => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-indigo-50 text-indigo-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {category.name}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a
                href="mailto:support@spyrex.io"
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <Mail className="w-8 h-8 text-indigo-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">Email Support</h3>
                <p className="text-sm text-gray-600 mb-2">Get help via email</p>
                <span className="text-sm text-indigo-600 flex items-center gap-1">
                  Contact us <ExternalLink className="w-3 h-3" />
                </span>
              </a>

              <a
                href="#"
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <MessageCircle className="w-8 h-8 text-indigo-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">Live Chat</h3>
                <p className="text-sm text-gray-600 mb-2">Chat with our team</p>
                <span className="text-sm text-indigo-600 flex items-center gap-1">
                  Start chat <ChevronRight className="w-3 h-3" />
                </span>
              </a>

              <a
                href="tel:+1234567890"
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <Phone className="w-8 h-8 text-indigo-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">Phone Support</h3>
                <p className="text-sm text-gray-600 mb-2">Mon-Fri 9am-5pm EST</p>
                <span className="text-sm text-indigo-600 flex items-center gap-1">
                  Call now <ExternalLink className="w-3 h-3" />
                </span>
              </a>
            </div>

            {/* Video Tutorials */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Video className="w-5 h-5 text-indigo-600" />
                <h2 className="text-xl font-semibold text-gray-900">Video Tutorials</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {videos.map(video => (
                  <a
                    key={video.id}
                    href="#"
                    className="group block rounded-lg overflow-hidden border border-gray-200 hover:border-indigo-500 transition-colors"
                  >
                    <div className="relative">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-auto"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                          <div className="w-0 h-0 border-l-8 border-l-indigo-600 border-t-4 border-t-transparent border-b-4 border-b-transparent ml-1"></div>
                        </div>
                      </div>
                      <span className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                        {video.duration}
                      </span>
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-gray-900 text-sm">{video.title}</h3>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Help Articles */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {selectedCategory === 'all' ? 'All Articles' : categories.find(c => c.id === selectedCategory)?.name}
              </h2>
              <div className="space-y-3">
                {filteredArticles.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No articles found matching your search.</p>
                  </div>
                ) : (
                  filteredArticles.map(article => (
                    <a
                      key={article.id}
                      href="#"
                      className="block p-4 rounded-lg border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 group-hover:text-indigo-600 mb-1">
                            {article.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">{article.description}</p>
                          <span className="text-xs text-gray-500">{article.readTime}</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 flex-shrink-0 ml-4" />
                      </div>
                    </a>
                  ))
                )}
              </div>
            </div>

            {/* Contact Section */}
            <div className="bg-indigo-50 rounded-lg p-6 border border-indigo-100">
              <h3 className="font-semibold text-gray-900 mb-2">Still need help?</h3>
              <p className="text-sm text-gray-600 mb-4">
                Can't find what you're looking for? Our support team is here to help.
              </p>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
