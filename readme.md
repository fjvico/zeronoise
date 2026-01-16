# News Content Filter

A lightweight userscript that filters unwanted news articles based on customizable keywords. Built for Tampermonkey/Greasemonkey browser extensions.

## Overview

ZeroNoise automatically hides news articles containing specific keywords from supported news websites. It works on both static and dynamically loaded content (infinite scroll, AJAX updates), ensuring a cleaner, quieter browsing experience.

## Features

- **Single-file simplicity**: All configuration and logic in one JavaScript file
- **Easy customization**: Keywords and site templates defined at the top for quick editing
- **Dynamic content support**: Monitors page changes and filters new articles automatically
- **Multi-site support**: Pre-configured for 8 major Spanish news sites
- **Whole-word matching**: Intelligent pattern matching avoids false positives
- **Case-insensitive**: Matches keywords regardless of capitalization
- **Zero dependencies**: Pure vanilla JavaScript, no external libraries

## Project Structure

```
zeronoise/
│
├── readme.md              # Documentation (this file)
│
└── zeronoise.js           # Main userscript
    ├── Configuration      # Keywords list (edit here)
    ├── Site Templates     # CSS selectors for each news site
    └── Core Logic         # Filtering and detection algorithms
```

### Single File Architecture

ZeroNoise consolidates everything into one file for easier management and portability.


## Installation

### 1. Install a Userscript Manager

Choose one for your browser:
- **[Tampermonkey](https://www.tampermonkey.net/)** (Recommended - Chrome, Firefox, Safari, Edge, Opera)
- **[Greasemonkey](https://www.greasespot.net/)** (Firefox only)
- **[Violentmonkey](https://violentmonkey.github.io/)** (Chrome, Firefox, Edge)

### 2. Install ZeroNoise

1. Click on the Tampermonkey icon in your browser toolbar
2. Select **"Create a new script"**
3. Delete the default template content
4. Copy and paste the entire contents of `zeronoise.js`
5. Save the script (Ctrl+S or Cmd+S)

### 3. Verify Installation

1. Visit a supported news site (e.g., elpais.com, elmundo.es)
2. Open browser console (F12 → Console tab)
3. Look for ZeroNoise log messages:
   ```
   [ZeroNoise] Initializing for elpais.com with 37 keywords
   [ZeroNoise] Filtered 12 articles on initial load
   [ZeroNoise] Watching for new content
   ```

## Configuration

### Adding/Removing Keywords

Open `zeronoise.js` in the Tampermonkey editor and modify the `KEYWORDS` array:

```javascript
const KEYWORDS = [
    'Trump',
    'Mazón',
    // Add your keywords here
    'new keyword',
    'last keyword'
    // Remove any keywords you don't want
];
```

**Tips for Keywords:**
- Multi-word phrases are supported: `'Donald Trump'`
- Keywords are case-insensitive: `'trump'` matches "Trump", "TRUMP", "trump"
- Whole-word matching: `'Trump'` won't match "trumpet"
- Special characters work: `'Mazón'`

### Performance Note

ZeroNoise uses explicit `@match` directives in the script header, which means:
- The script **only loads on news sites** (not on every website you visit)
- **Zero overhead** when browsing non-news sites
- Faster browser performance overall
- When adding a new site, you must update **both** the `@match` directive and the `SITE_TEMPLATES` section

### Supported News Sites

ZeroNoise comes pre-configured for these Spanish news sites:

| Site | Domain | Type |
|------|--------|------|
| ABC | abc.es | General news |
| El Mundo | elmundo.es | General news |
| El País | elpais.com | General news |
| La Vanguardia | lavanguardia.com | General news |
| La Razón | larazon.es | General news |
| Menéame | meneame.net | News aggregator |
| Marca | marca.com | Sports |
| AS | as.com | Sports |

### Adding a New Site

To add support for a new news website, you need to make **two changes**:

#### Step 1: Add @match directive (header)

1. Open `zeronoise.js` in Tampermonkey editor
2. Locate the `@match` directives at the top (lines 7-22)
3. Add two new lines for your site:

```javascript
// @match        *://yournewssite.com/*
// @match        *://*.yournewssite.com/*
```

The `*://` matches both http and https. The second line with `*.` catches subdomains like `www.yournewssite.com`.

#### Step 2: Add site template (configuration)

1. Scroll down to the `SITE_TEMPLATES` section
2. Add a new entry following this structure:

```javascript
const SITE_TEMPLATES = {
    // ... existing sites ...
    
    'yournewssite.com': {
        // Selector for article containers
        articleSelector: 'article, div.news-item',
        
        // Selector for headlines within articles
        headlineSelector: 'h2, h3, .title',
        
        // Selector for descriptions (optional)
        descriptionSelector: 'p.summary, .description'
    }
};
```

#### Finding the Right Selectors

1. Visit the news site
2. Open Developer Tools (F12)
3. Use the Element Inspector (Ctrl+Shift+C)
4. Click on an article, then find:
   - **Article container**: The element wrapping the entire article
   - **Headline**: The link or heading with the article title
   - **Description**: The summary or excerpt text (if present)

**Example walkthrough:**

```html
<!-- If the site HTML looks like this: -->
<article class="story">
    <h2 class="story-title">
        <a href="/news/123">Breaking News Title</a>
    </h2>
    <p class="story-summary">This is the article summary...</p>
</article>

<!-- Your template should be: -->
'example.com': {
    articleSelector: 'article.story',
    headlineSelector: 'h2.story-title a',
    descriptionSelector: 'p.story-summary'
}
```

## How It Works

### Filtering Process

1. **Page Load**: When you visit a news site, ZeroNoise checks if it's supported
2. **Initial Scan**: Finds all articles using the site template selectors
3. **Text Analysis**: Extracts headline and description text from each article
4. **Keyword Matching**: Checks if text contains any blacklisted keywords
5. **Article Hiding**: Sets `display: none` on matching articles
6. **Continuous Monitoring**: Watches for new articles loaded via scroll/AJAX

### Matching Algorithm

```
Article text: "Trump announces new policy on trade"
Normalized:   "Trump announces new policy on trade"
Keyword:      "Trump"
Regex:        (^|\s)Trump(\s|$)
Result:       ✓ MATCH (whole word at start)

Article text: "The trumpet player wins award"
Normalized:   "The trumpet player wins award"
Keyword:      "Trump"
Regex:        (^|\s)Trump(\s|$)
Result:       ✗ NO MATCH (not a whole word)
```

### Performance

- **Lightweight**: Pure JavaScript, no heavy frameworks
- **Efficient**: Only processes new content, marks filtered articles
- **Non-blocking**: Uses MutationObserver for asynchronous updates
- **Memory-friendly**: Minimal DOM manipulation

## Troubleshooting

### Articles aren't being filtered

1. **Check the console** (F12) for ZeroNoise messages
   - No messages? Script might not be enabled in Tampermonkey
   - "No template found"? Site isn't supported yet

2. **Verify selectors** for the site
   - Site may have updated their HTML structure
   - Use browser DevTools to find new selectors

3. **Test keywords**
   - Try a very common word to see if filtering works
   - Check if keywords match exactly (accounting for punctuation)

### Too many articles are hidden

- Review your keywords list for overly broad terms
- Consider removing generic keywords that match unrelated content

### Script slows down the page

- Reduce the number of keywords (fewer = faster)
- The 1-second delay in `init()` can be adjusted if needed

### Site is supported but not working

The site may have changed their HTML structure. Steps to fix:

1. Right-click an article → Inspect Element
2. Find the CSS selectors for:
   - Article container
   - Headline
   - Description
3. Update the template in `SITE_TEMPLATES`

## Privacy & Security

- **No external requests**: All processing happens locally in your browser
- **No data collection**: ZeroNoise doesn't track or store any data
- **No remote code**: No code is loaded from external sources
- **Open source**: All code is visible and auditable in the userscript

## Contributing

To contribute new site templates:

1. Test the selectors thoroughly on the target site
2. Verify they work with dynamic content (scroll, load more)
3. Use specific selectors to avoid false positives
4. Document any site-specific quirks

## License

This project is open source and available for personal use.

## Credits

- Concept initially inspired by Antiayuseame.

---

**Version**: 1.0  
**Last Updated**: January 2026  
**Compatibility**: All modern browsers with Tampermonkey/Greasemonkey support