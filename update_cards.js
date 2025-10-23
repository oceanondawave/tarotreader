const fs = require('fs');

// Read the current file
let content = fs.readFileSync('src/data/tarotCards.js', 'utf8');

// List of all card objects to add images to (id, name pairs)
const cards = [
  [2, "The Magician"], [3, "The High Priestess"], [4, "The Empress"], [5, "The Emperor"],
  [6, "The Hierophant"], [7, "The Lovers"], [8, "The Chariot"], [9, "Strength"],
  [10, "The Hermit"], [11, "Wheel of Fortune"], [12, "Justice"], [13, "The Hanged Man"],
  [14, "Death"], [15, "Temperance"], [16, "The Devil"], [17, "The Tower"],
  [18, "The Star"], [19, "The Moon"], [20, "The Sun"], [21, "Judgement"],
  [22, "The World"],
  // Wands
  [23, "Ace of Wands"], [24, "Two of Wands"], [25, "Three of Wands"], [26, "Four of Wands"],
  [27, "Five of Wands"], [28, "Six of Wands"], [29, "Seven of Wands"], [30, "Eight of Wands"],
  [31, "Nine of Wands"], [32, "Ten of Wands"], [33, "Page of Wands"], [34, "Knight of Wands"],
  [35, "Queen of Wands"], [36, "King of Wands"],
  // Cups
  [37, "Ace of Cups"], [38, "Two of Cups"], [39, "Three of Cups"], [40, "Four of Cups"],
  [41, "Five of Cups"], [42, "Six of Cups"], [43, "Seven of Cups"], [44, "Eight of Cups"],
  [45, "Nine of Cups"], [46, "Ten of Cups"], [47, "Page of Cups"], [48, "Knight of Cups"],
  [49, "Queen of Cups"], [50, "King of Cups"],
  // Swords
  [51, "Ace of Swords"], [52, "Two of Swords"], [53, "Three of Swords"], [54, "Four of Swords"],
  [55, "Five of Swords"], [56, "Six of Swords"], [57, "Seven of Swords"], [58, "Eight of Swords"],
  [59, "Nine of Swords"], [60, "Ten of Swords"], [61, "Page of Swords"], [62, "Knight of Swords"],
  [63, "Queen of Swords"], [64, "King of Swords"],
  // Pentacles
  [65, "Ace of Pentacles"], [66, "Two of Pentacles"], [67, "Three of Pentacles"], [68, "Four of Pentacles"],
  [69, "Five of Pentacles"], [70, "Six of Pentacles"], [71, "Seven of Pentacles"], [72, "Eight of Pentacles"],
  [73, "Nine of Pentacles"], [74, "Ten of Pentacles"], [75, "Page of Pentacles"], [76, "Knight of Pentacles"],
  [77, "Queen of Pentacles"], [78, "King of Pentacles"]
];

// Add image property before each closing brace of card objects
cards.forEach(([id, name]) => {
  const searchPattern = new RegExp(`(id: ${id},\\s+name: "${name}",\\s+.*?description: .*?),\\s+}`, 's');
  const urlName = name.replace(/ /g, '+');
  content = content.replace(searchPattern, `$1,\n    image: getCardImage(${id}, "${urlName}"),\n  }`);
});

fs.writeFileSync('src/data/tarotCards.js', content);
console.log('Updated all cards with images!');
