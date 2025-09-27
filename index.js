(async () => {
  const { default: textToxicityDetector } = await import('text-toxicity-detector');

  const result = textToxicityDetector('You are a motherfucker piece of shit asshole bastard cunt.');
  console.log(result);
})();
