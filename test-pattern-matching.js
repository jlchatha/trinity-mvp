const message = "No the one you just wrote for yusef";
console.log('Query:', message);
console.log('');

console.log('Pattern tests:');
console.log('isJustWroteQuery:', /\b(just\s+wrote|recently\s+wrote|you\s+wrote|you\s+just\s+wrote)\b/i.test(message));
console.log('isContentTypeQuery:', /\b(poem|code|function|explanation)\b/i.test(message));
console.log('isTheOneQuery:', /\b(the\s+one|that\s+one)\s+you\s+(wrote|created|made)\b/i.test(message));
console.log('alternative:', /the\s+one\s+you\s+just\s+wrote/i.test(message));
console.log('simple match:', /you\s+just\s+wrote/i.test(message));