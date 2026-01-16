// ==UserScript==
// @name         ZeroNoise - News Filter
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Filter unwanted news articles based on keywords
// @author       Francisco J. Vico
// @match        *://abc.es/*
// @match        *://*.abc.es/*
// @match        *://elmundo.es/*
// @match        *://*.elmundo.es/*
// @match        *://elpais.com/*
// @match        *://*.elpais.com/*
// @match        *://lavanguardia.com/*
// @match        *://*.lavanguardia.com/*
// @match        *://larazon.es/*
// @match        *://*.larazon.es/*
// @match        *://meneame.net/*
// @match        *://*.meneame.net/*
// @match        *://marca.com/*
// @match        *://*.marca.com/*
// @match        *://as.com/*
// @match        *://*.as.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // ============================================================================
    // CONFIGURATION - Edit keywords here, separate with comma
    // ============================================================================
    
    const KEYWORDS = [
        'Trump',
        'Mazón'
    ];

    // ============================================================================
    // SITE TEMPLATES - CSS selectors for each supported news site
    // ============================================================================
    // To add a new site:
    // 1. Add the domain as a key (without 'www.')
    // 2. Define three selectors:
    //    - articleSelector: container for each article/news item
    //    - headlineSelector: title/headline within the article
    //    - descriptionSelector: summary/description text (optional)
    // ============================================================================
    
    const SITE_TEMPLATES = {
        // ABC - Spanish newspaper
        'abc.es': {
            articleSelector: 'article, div.noticia, div.voc-noticia, div[data-noticia], section article',
            headlineSelector: 'h2 a, h3 a, h2.titular a, h3.titular a, a.titular-link, a[href*="/noticias/"]',
            descriptionSelector: 'p.sumario, p.entradilla, p.descripcion, div.bajada'
        },

        // El Mundo - Spanish newspaper
        'elmundo.es': {
            articleSelector: 'article, div.ue-c-cover-content, div.ue-l-article, div[data-vr-zone], section.ue-c-cover-grid__main article',
            headlineSelector: 'h2 a, h3 a, h2.ue-c-cover-content__headline a, h3.ue-c-cover-content__headline a, a.ue-c-cover-content__link',
            descriptionSelector: 'p.ue-c-cover-content__standfirst, p.ue-c-cover-content__summary, div.ue-c-cover-content__byline-and-standfirst'
        },

        // El País - Spanish newspaper
        'elpais.com': {
            articleSelector: 'article.c',
            headlineSelector: 'h2.c_t a, h3.c_t a',
            descriptionSelector: 'p.c_d'
        },

        // La Vanguardia - Spanish newspaper
        'lavanguardia.com': {
            articleSelector: 'article',
            headlineSelector: 'h2, h3, h4, .headline, .title',
            descriptionSelector: 'p, .summary, .lead'
        },

        // La Razón - Spanish newspaper
        'larazon.es': {
            articleSelector: 'article, .noticia',
            headlineSelector: 'h2, h3, .title',
            descriptionSelector: 'p, .lead'
        },

        // Menéame - Spanish social news aggregator
        'meneame.net': {
            articleSelector: 'article.story, div.news-summary, ul.news-summary li',
            headlineSelector: 'h2 a, h3 a, .story-title a, .news-summary .news-content a, [data-title]',
            descriptionSelector: '.story-content, .news-details, .news-body'
        },

        // Marca - Spanish sports newspaper
        'marca.com': {
            articleSelector: 'article, .principal',
            headlineSelector: 'h2, h3, .title',
            descriptionSelector: 'p, .summary'
        },

        // AS - Spanish sports newspaper
        'as.com': {
            articleSelector: 'article, .principal',
            headlineSelector: 'h2, h3, .title',
            descriptionSelector: 'p, .summary'
        }
    };

    // ============================================================================
    // CORE FILTERING LOGIC
    // ============================================================================

    /**
     * Get the current domain without 'www.' prefix
     * @returns {string} Clean domain name (e.g., 'elpais.com')
     */
    function getCurrentDomain() {
        const hostname = window.location.hostname;
        return hostname.replace(/^www\./, '');
    }

    /**
     * Normalize text by removing punctuation while preserving spaces
     * This helps match keywords even when surrounded by punctuation
     * @param {string} text - Text to normalize
     * @returns {string} Normalized text
     */
    function normalizeText(text) {
        return text.replace(/[.,/#!$%^&*;:{}=\-_`~()¿?¡!""''«»]/g, '').trim();
    }

    /**
     * Check if text contains any blacklisted keyword
     * Uses case-insensitive whole word/phrase matching to avoid false positives
     * Example: "Trump" will match "Trump says..." but not "trumpet"
     * 
     * @param {string} text - Text to check
     * @param {Array<string>} keywords - List of keywords to match
     * @returns {boolean} True if any keyword is found
     */
    function containsKeyword(text, keywords) {
        const normalized = normalizeText(text);
        
        return keywords.some(function(keyword) {
            const normalizedKeyword = normalizeText(keyword);
            
            // Escape special regex characters to treat them literally
            const escapedKeyword = normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            
            // Match whole word/expression (case-insensitive)
            // (^|\s) = start of string or whitespace before
            // (\s|$) = whitespace after or end of string
            const pattern = new RegExp(`(^|\\s)${escapedKeyword}(\\s|$)`, 'i');
            
            return pattern.test(normalized);
        });
    }

    /**
     * Hide an article element from view
     * Marks it as filtered to avoid reprocessing
     * @param {HTMLElement} element - Article element to hide
     */
    function hideArticle(element) {
        element.style.display = 'none';
        element.setAttribute('data-zeronoise-filtered', 'true');
    }

    /**
     * Filter articles on the page based on template selectors
     * Checks both headlines and descriptions for keyword matches
     * 
     * @param {Object} template - Site-specific selector template
     * @param {Array<string>} keywords - Keywords to filter
     * @returns {number} Count of newly filtered articles
     */
    function filterArticles(template, keywords) {
        const articles = document.querySelectorAll(template.articleSelector);
        let filteredCount = 0;

        articles.forEach(function(article) {
            // Skip already filtered articles
            if (article.getAttribute('data-zeronoise-filtered')) {
                return;
            }

            let shouldHide = false;

            // Check headline text
            const headlines = article.querySelectorAll(template.headlineSelector);
            headlines.forEach(function(headline) {
                const text = headline.textContent || headline.innerText;
                if (text && containsKeyword(text, keywords)) {
                    shouldHide = true;
                }
            });

            // Check description text if headline didn't match
            if (!shouldHide && template.descriptionSelector) {
                const descriptions = article.querySelectorAll(template.descriptionSelector);
                descriptions.forEach(function(desc) {
                    const text = desc.textContent || desc.innerText;
                    if (text && containsKeyword(text, keywords)) {
                        shouldHide = true;
                    }
                });
            }

            // Hide article if keyword was found
            if (shouldHide) {
                hideArticle(article);
                filteredCount++;
            }
        });

        return filteredCount;
    }

    /**
     * Set up mutation observer to handle dynamically loaded content
     * Many news sites load articles via infinite scroll or AJAX
     * This observer watches for new content and filters it automatically
     * 
     * @param {Object} template - Site-specific selector template
     * @param {Array<string>} keywords - Keywords to filter
     * @returns {MutationObserver} The observer instance
     */
    function observeChanges(template, keywords) {
        const observer = new MutationObserver(function(mutations) {
            filterArticles(template, keywords);
        });

        // Watch for new elements being added anywhere in the page
        observer.observe(document.body, {
            childList: true,  // Watch for added/removed nodes
            subtree: true     // Watch entire DOM tree
        });

        return observer;
    }

    // ============================================================================
    // INITIALIZATION
    // ============================================================================

    /**
     * Initialize the filtering system
     * Main entry point that coordinates all filtering operations
     */
    function init() {
        // Check if keywords are defined
        if (KEYWORDS.length === 0) {
            console.log('[ZeroNoise] No keywords defined, exiting');
            return;
        }

        // Get current domain and check if template exists
        const domain = getCurrentDomain();
        const template = SITE_TEMPLATES[domain];
        
        if (!template) {
            // Not a supported site - exit silently
            return;
        }

        console.log(`[ZeroNoise] Initializing for ${domain} with ${KEYWORDS.length} keywords`);

        // Wait for page to load, then start filtering
        setTimeout(function() {
            // Initial filtering pass
            const count = filterArticles(template, KEYWORDS);
            console.log(`[ZeroNoise] Filtered ${count} articles on initial load`);

            // Watch for dynamically loaded content
            observeChanges(template, KEYWORDS);
            console.log('[ZeroNoise] Watching for new content');
        }, 1000);
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();