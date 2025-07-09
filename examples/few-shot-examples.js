const {
  FewShotTemplate,
  createFewShot,
  createExamplesFromData,
  estimateTokens
} = require('../dist/index.js');

console.log('🎯 Few-Shot Learning Prompt Engineering Examples\n');

// Example 1: Text Classification
console.log('=== Example 1: Email Classification ===');

const emailClassifier = new FewShotTemplate({
  task: 'Classify emails as spam, important, or normal',
  instructions: 'Analyze the email content and classify it based on urgency and legitimacy.',
  examples: [
    {
      input: 'Subject: Urgent: Your account will be suspended\nFrom: security@bank-alert.com\nContent: Click here immediately to verify your account or it will be suspended within 24 hours!',
      output: 'spam',
      explanation: 'Suspicious sender, urgent language, and suspicious links indicate spam'
    },
    {
      input: 'Subject: Board Meeting Tomorrow\nFrom: ceo@company.com\nContent: Please review the quarterly reports before tomorrow\'s board meeting at 9 AM.',
      output: 'important',
      explanation: 'From CEO, mentions board meeting, requires action'
    },
    {
      input: 'Subject: Weekly Newsletter\nFrom: newsletter@techblog.com\nContent: Here are this week\'s top tech articles and industry updates.',
      output: 'normal',
      explanation: 'Regular newsletter content, informational only'
    }
  ],
  inputFormat: 'Email with subject, sender, and content',
  outputFormat: 'Classification: spam, important, or normal'
});

const emailResult = emailClassifier.generate(
  'Subject: Meeting Rescheduled\nFrom: manager@company.com\nContent: The team meeting has been moved to Friday at 2 PM due to a scheduling conflict.'
);

console.log('Email Classification Prompt:');
console.log(emailResult.prompt.substring(0, 500) + '...');
console.log(`\nExamples used: ${emailResult.exampleCount}`);
console.log(`Estimated tokens: ${emailResult.estimatedTokens}\n`);

// Example 2: Data Extraction
console.log('=== Example 2: Contact Information Extraction ===');

const contactExtractor = FewShotTemplate.createPattern('extraction', 'contact information');

// Add specific examples
const enhancedExtractor = contactExtractor
  .addExample({
    input: 'Hi, I\'m John Smith from ABC Corp. You can reach me at john.smith@abccorp.com or call (555) 123-4567.',
    output: '{"name": "John Smith", "company": "ABC Corp", "email": "john.smith@abccorp.com", "phone": "(555) 123-4567"}',
    explanation: 'Extracted all available contact details in structured format'
  })
  .addExample({
    input: 'Contact Sarah Johnson at sarah.j@techstart.io for more information about our services.',
    output: '{"name": "Sarah Johnson", "company": null, "email": "sarah.j@techstart.io", "phone": null}',
    explanation: 'Only name and email available, other fields marked as null'
  });

const extractionResult = enhancedExtractor.generate(
  'Please get in touch with Mike Chen from DataFlow Solutions. His email is m.chen@dataflow.com and office number is (555) 987-6543.'
);

console.log('Contact Extraction Prompt:');
console.log(extractionResult.prompt.substring(0, 400) + '...');
console.log(`\nExamples: ${extractionResult.exampleCount}\n`);

// Example 3: Code Generation
console.log('=== Example 3: SQL Query Generation ===');

const sqlGenerator = new FewShotTemplate({
  task: 'Generate SQL queries based on natural language requests',
  instructions: 'Convert the natural language request into a valid SQL query.',
  examples: [
    {
      input: 'Find all customers who made purchases over $1000 in the last month',
      output: 'SELECT c.* FROM customers c JOIN orders o ON c.id = o.customer_id WHERE o.amount > 1000 AND o.order_date >= DATE_SUB(NOW(), INTERVAL 1 MONTH);',
      explanation: 'Uses JOIN to connect customers and orders, filters by amount and date'
    },
    {
      input: 'Get the top 5 products by sales volume',
      output: 'SELECT p.name, SUM(oi.quantity) as total_sold FROM products p JOIN order_items oi ON p.id = oi.product_id GROUP BY p.id ORDER BY total_sold DESC LIMIT 5;',
      explanation: 'Aggregates quantities, groups by product, orders by total, limits to 5'
    },
    {
      input: 'Count how many orders each customer has made',
      output: 'SELECT c.name, COUNT(o.id) as order_count FROM customers c LEFT JOIN orders o ON c.id = o.customer_id GROUP BY c.id;',
      explanation: 'Uses LEFT JOIN to include customers with zero orders, counts orders per customer'
    }
  ]
});

const sqlResult = sqlGenerator.generate(
  'Show me all products that are out of stock and their suppliers'
);

console.log('SQL Generation Prompt:');
console.log(sqlResult.prompt.substring(0, 500) + '...');
console.log(`\nToken estimate: ${sqlResult.estimatedTokens}\n`);

// Example 4: Quick Few-Shot Creation
console.log('=== Example 4: Quick Sentiment Analysis ===');

const sentimentExamples = [
  { input: 'I love this product! It works perfectly and exceeded my expectations.', output: 'positive' },
  { input: 'The service was terrible and the staff was rude. Very disappointed.', output: 'negative' },
  { input: 'The product is okay, nothing special but it does what it\'s supposed to do.', output: 'neutral' }
];

const sentimentResult = createFewShot(
  'Analyze the sentiment of customer reviews',
  sentimentExamples,
  'The delivery was fast but the packaging was damaged. Mixed feelings about this purchase.',
  { instructions: 'Classify the overall sentiment as positive, negative, or neutral' }
);

console.log('Quick Sentiment Analysis:');
console.log(sentimentResult.prompt.substring(0, 400) + '...');
console.log(`\nExamples: ${sentimentResult.exampleCount}\n`);

// Example 5: Creating Examples from Data
console.log('=== Example 5: Examples from Dataset ===');

const customerData = [
  { input: { age: 25, income: 50000, purchases: 12 }, output: 'regular' },
  { input: { age: 45, income: 120000, purchases: 45 }, output: 'premium' },
  { input: { age: 22, income: 30000, purchases: 3 }, output: 'occasional' },
  { input: { age: 55, income: 200000, purchases: 78 }, output: 'vip' },
  { input: { age: 35, income: 75000, purchases: 23 }, output: 'regular' }
];

const dataExamples = createExamplesFromData(customerData, 3);
const customerClassifier = new FewShotTemplate({
  task: 'Classify customer segments based on demographics and purchase history',
  examples: dataExamples,
  instructions: 'Analyze the customer data and assign them to the appropriate segment.'
});

const customerResult = customerClassifier.generate(
  '{"age": 28, "income": 65000, "purchases": 18}'
);

console.log('Customer Segmentation from Data:');
console.log(customerResult.prompt.substring(0, 400) + '...');
console.log(`\nData examples used: ${customerResult.exampleCount}\n`);

// Example 6: Balanced Few-Shot Template
console.log('=== Example 6: Balanced Template Creation ===');

const unbalancedExamples = [
  { input: 'Great product!', output: 'positive' },
  { input: 'Amazing quality!', output: 'positive' },
  { input: 'Love it!', output: 'positive' },
  { input: 'Terrible experience', output: 'negative' },
  { input: 'It\'s okay', output: 'neutral' }
];

const balancedTemplate = FewShotTemplate.createBalanced(
  'Sentiment analysis with balanced examples',
  unbalancedExamples,
  { maxExamples: 4 }
);

const balancedResult = balancedTemplate.generate('The product met my expectations');
console.log('Balanced Template Result:');
console.log(`Examples used: ${balancedResult.exampleCount}`);
console.log(balancedResult.prompt.substring(0, 300) + '...\n');

// Example 7: Template Modification
console.log('=== Example 7: Template Modification ===');

const baseTemplate = FewShotTemplate.createPattern('classification', 'document types');

// Add domain-specific examples
const documentClassifier = baseTemplate
  .addExample({
    input: 'INVOICE #12345\nDate: 2024-01-15\nBill To: ABC Company\nAmount Due: $1,250.00',
    output: 'invoice',
    explanation: 'Contains invoice number, billing information, and amount due'
  })
  .addExample({
    input: 'PURCHASE ORDER\nPO Number: PO-2024-001\nVendor: XYZ Supplies\nItems: Office supplies, quantity 50',
    output: 'purchase_order',
    explanation: 'Contains PO number, vendor info, and item details'
  })
  .setMaxExamples(3);

const docResult = documentClassifier.generate(
  'CONTRACT AGREEMENT\nParties: Company A and Company B\nTerm: 12 months\nEffective Date: 2024-02-01'
);

console.log('Document Classification:');
console.log(`Max examples set to: 3, Using: ${docResult.exampleCount}`);
console.log(docResult.prompt.substring(0, 350) + '...\n');

console.log('🎯 Few-shot learning enables AI models to learn patterns from examples and apply them to new inputs!');
