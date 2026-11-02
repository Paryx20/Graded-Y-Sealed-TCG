const str = "Lt. Surge's Raichu";
const decodedAttrValue = "SearchResultsView.openQuoteModal('" + str + "', 'Gym', 75)";
console.log('Decoded code:', decodedAttrValue);
try {
  new Function(decodedAttrValue);
  console.log('Syntax OK');
} catch (err) {
  console.log('Caught SyntaxError:', err.message);
}
