# Purflux Catalog Scraper

## Overview

This project is a web scraper built with **Puppeteer** and **Node.js** that extracts product details from the Purflux Group Catalog website. It dynamically fetches data by modifying the request URL instead of interacting with the UI elements. I tried looping by selecting
the items in the dropdown by using page.select() then page.click() on the search button. Did not manage to do that so I opt for modifying the URL.

## Features

- Uses **Puppeteer Extra with Stealth Plugin** to avoid bot detection.
- Extracts dropdown options and scrapes data for each available product.
- Saves extracted information into a JSON file.
- Bypasses UI interactions by modifying the URL for faster scraping.
- Handles errors and timeouts to prevent script crashes.

## Prerequisites

Make sure you have the following installed:

- **Node.js** (Latest LTS version recommended)
- **Google Chrome** (Installed on your system)

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/amadzufa/purflux-scraper.git
   cd purflux-scraper
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

Run the scraper with the following command:

```bash
node scrape.js
```

## Output

The scraped data will be saved in a file named `scrapedData.json` in the root directory.

## Configuration

If you want to run the scraper in headless mode, update the `puppeteer.launch` settings:

```js
const browser = await puppeteer.launch({
    headless: true, // Change to true for headless mode
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
});
```

## Troubleshooting

- **Error: Puppeteer not launching Chrome**
  - Ensure you have **Google Chrome** installed and the path is correctly set in `executablePath`.
- **Timeouts on page loading**
  - Check your internet connection and increase `timeout` in `page.goto()` if necessary.
- **Scraped data is empty**
  - The website structure might have changed. Inspect the page manually and adjust the selectors.



