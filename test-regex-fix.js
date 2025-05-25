// Test basic question regex
const isBasicQuestion = (message) => {
  return /^(what'?s your (name|role)|what is your (name|role)|who are you|what do you do|help|hello|hi)\??$/i.test(message.trim());
};

const tests = [
  "What's your name?",
  "Whats your name?", 
  "What is your role?", 
  "Who are you?",
  "Hello",
  "Help",
  "What did you say about the ocean?"
];

console.log('Testing basic question detection:');
tests.forEach(test => {
  const result = isBasicQuestion(test);
  console.log(`"${test}": ${result ? 'BASIC ✅' : 'MEMORY'}`);
});