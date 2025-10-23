# Missing Tarot Card Images

## Summary

Your app has **35 duplicate card images** that need to be replaced with correct images.

## Cards Needing Replacement

### Swords Suite (10 cards)

- `s01.jpg` - Ace of Swords
- `s02.jpg` - Two of Swords
- `s03.jpg` - Three of Swords
- `s04.jpg` - Four of Swords
- `s05.jpg` - Five of Swords
- `s06.jpg` - Six of Swords
- `s08.jpg` - Eight of Swords
- `s09.jpg` - Nine of Swords
- `s11.jpg` - Page of Swords
- `s14.jpg` - King of Swords

### Pentacles Suite (12 cards)

- `p01.jpg` - Ace of Pentacles
- `p02.jpg` - Two of Pentacles
- `p03.jpg` - Three of Pentacles
- `p04.jpg` - Four of Pentacles
- `p05.jpg` - Five of Pentacles
- `p06.jpg` - Six of Pentacles
- `p07.jpg` - Seven of Pentacles
- `p09.jpg` - Nine of Pentacles
- `p10.jpg` - Ten of Pentacles
- `p11.jpg` - Page of Pentacles
- `p12.jpg` - Knight of Pentacles
- `p13.jpg` - Queen of Pentacles

### Wands Suite (8 cards)

- `w01.jpg` - Ace of Wands
- `w02.jpg` - Two of Wands
- `w03.jpg` - Three of Wands
- `w05.jpg` - Five of Wands
- `w06.jpg` - Six of Wands
- `w10.jpg` - Ten of Wands
- `w11.jpg` - Page of Wands
- `w14.jpg` - King of Wands

### Cups Suite (5 cards)

- `c01.jpg` - Ace of Cups
- `c04.jpg` - Four of Cups
- `c11.jpg` - Page of Cups
- `c12.jpg` - Knight of Cups
- `c14.jpg` - King of Cups

## How to Fix

### Option 1: Use Free Online Sources

1. Visit [Labyrinthos Academy](https://labyrinthos.co/blogs/tarot-card-meanings-list) - offers free Rider-Waite-Smith images
2. Or use [Sacred Texts](https://www.sacred-texts.com/tarot/pkt/index.htm) - classic RWS scans
3. Download each card image matching the names above
4. Rename them to match the file names (s01.jpg, p01.jpg, etc.)
5. Replace the files in `public/cards/`

### Option 2: Purchase High-Quality Deck

1. Buy a Rider-Waite-Smith tarot deck image pack
2. Rename files to match your naming convention
3. Place in `public/cards/`

### Option 3: Use AI to Generate

Since automated downloads are difficult, you could use these working cards as a reference and manually source the missing ones from legitimate tarot resources.

## Currently Working Cards ✓

- All 22 Major Arcana (m00-m21)
- Swords: s07, s10, s12, s13
- Pentacles: p08, p14
- Wands: w04, w07, w08, w09, w12, w13
- Cups: c02, c03, c05, c06, c07, c08, c09, c10, c13

## File Specifications

- Format: JPEG (.jpg)
- Recommended size: 300-500px width
- Aspect ratio: Standard tarot card proportions (roughly 1:1.7)
- Place in: `/public/cards/` directory
