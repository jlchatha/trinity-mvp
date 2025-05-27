/**
 * Sample Test Queries
 * Predefined queries for consistent testing across test suites
 */

module.exports = {
  simple: [
    'What is 2+2?',
    'Define artificial intelligence',
    'Capital of Japan?',
    'How do you spell "receive"?',
    'What year was JavaScript created?',
  ],

  complex: [
    'Analyze the pros and cons of microservices architecture versus monolithic architecture for a fintech startup with plans to scale to 1 million users',
    'Compare React, Vue, and Angular frameworks considering performance, learning curve, ecosystem, and suitability for enterprise applications',
    'Design a comprehensive machine learning pipeline for real-time fraud detection in credit card transactions, including data preprocessing, model selection, and deployment strategies',
    'Evaluate different database architectures (SQL vs NoSQL) for a social media platform handling 100k concurrent users with complex relationship data',
    'Create a detailed security assessment framework for cloud-native applications including container security, API protection, and compliance considerations',
  ],

  memory: [
    'Remember that I prefer Python for backend development',
    'I am working on an e-commerce platform using React and Node.js',
    'My favorite database is PostgreSQL because of its reliability',
    'I usually deploy applications on AWS using Docker containers',
    'My team follows agile methodology with two-week sprints',
  ],

  memoryReferences: [
    'What did we discuss about databases earlier?',
    'Based on my preferences, which framework should I use?',
    'Given my tech stack, how should I handle authentication?',
    'Considering my deployment setup, what monitoring should I add?',
    'With my team\'s agile process, how should we plan this feature?',
  ],

  technical: [
    'Explain OAuth 2.0 authentication flow',
    'How does garbage collection work in JavaScript?',
    'What are the SOLID principles in software design?',
    'Describe the differences between REST and GraphQL APIs',
    'How does Docker containerization improve deployment?',
  ],

  creative: [
    'Write a professional email introducing a new software feature',
    'Create a project proposal for a mobile app development',
    'Draft a technical blog post about API security best practices',
    'Design a user onboarding flow for a productivity application',
    'Outline a presentation about cloud migration strategies',
  ],

  edge: [
    '', // Empty query
    'a', // Single character
    'What is the meaning of life, the universe, and everything in it, considering philosophical, scientific, and existential perspectives while also analyzing historical interpretations and modern understanding?', // Very long query
    '🤖 Can you process emojis and special characters? #hashtag @mention',
    'Query with\nnewlines\nand\ttabs',
  ],

  // Expected response patterns for validation
  expectedPatterns: {
    simple: {
      maxLength: 500,
      maxTime: 5000,
      shouldContain: ['concise', 'direct'],
    },
    complex: {
      minLength: 200,
      maxTime: 30000,
      shouldContain: ['analysis', 'consider', 'recommend'],
    },
    memory: {
      shouldStore: true,
      confirmationWords: ['remember', 'noted', 'stored'],
    },
    memoryReferences: {
      shouldUseMemory: true,
      referenceWords: ['earlier', 'previously', 'based on'],
    },
  },

  // Performance benchmarks
  benchmarks: {
    simpleQueryTime: 5000,
    complexQueryTime: 30000,
    memoryStorageTime: 1000,
    memoryRetrievalTime: 2000,
  },

  // Error scenarios
  errorScenarios: [
    {
      name: 'API timeout',
      query: 'Test query for timeout',
      expectedError: 'timeout',
    },
    {
      name: 'Network error',
      query: 'Test query for network failure',
      expectedError: 'network',
    },
    {
      name: 'Invalid input',
      query: null,
      expectedError: 'validation',
    },
  ],
};