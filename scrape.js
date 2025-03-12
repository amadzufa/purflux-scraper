import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "fs";

puppeteer.use(StealthPlugin()); 
// hide automation signature
// used to bypass bot detector, this will make browser like a real user

const scrape = async () => {
    const browser = await puppeteer.launch({
        headless: false, 
        // opens a visible browser, set true if dont want to run in the bg
        executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
         // uses your actual installed chrome browser instead of puppeteer built in chromium
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
        // no sandbox is needed when running in some restricter env (eg linux servers)
        // helps prevent crashes when running puppeteer with chrome
    });

    const page = await browser.newPage();
    // creates a new tab
    
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
    // websites check User-Agent to identify type of browser and device
    // therefore mimics a real chrome on windows to make request looks human

    try {
        // go to the main page and extract dropdown values
        await page.goto(
            "http://www.purfluxgroupcatalog.com/catalogues/FO/scripts/cat_fich_filtre.php?zone=FR&catalogue=PFX&lang=GB",
            { waitUntil: "domcontentloaded", timeout: 60000 }
        );

        // xtract all option values from the dropdown
        const options = await page.evaluate(() => {
            return Array.from(document.querySelectorAll("#ref_filtre option"))
                .map(option => option.value)
                .filter(value => value !== ""); // emove empty values
        });

        console.log(`Found ${options.length} items to scrape.`);

        let allData = []; // store all scraped data

        // loop through each option value by changing the URL
        for (let i = 0; i < options.length; i++) {
            const optionValue = options[i]; 
            console.log(`Scraping data for: ${optionValue}`);

            // encode the value for URL safety
            const encodedValue = encodeURIComponent(optionValue);

            // construct the URL dynamically
            const newUrl = `http://www.purfluxgroupcatalog.com/catalogues/FO/scripts/cat_fich_filtre.php?zone=FR&catalogue=PFX&lang=GB&ref_filtre=${encodedValue}&searchref=&old_marque=`;

            // go to the page with the selected filter
            await page.goto(newUrl, { waitUntil: "domcontentloaded", timeout: 60000 });

            // wait for data to load (Handle timeout properly)
            try {
                // wait for results to load (Handle timeout properly)
                await page.waitForSelector(".row2.txtcontent", { timeout: 10000 });
                console.log(`Data loaded for ${optionValue}`);
            } catch (error) {
                console.warn(`Timeout: No data found for ${optionValue}`);
                continue; // skip to the next option
            }

            // extract data
            const data = await page.evaluate((optionValue) => { 
                const titleElement = document.querySelector('h2.title.background4.color1');
                // to select the h2 element with those class
                if (!titleElement) // if no such elements exist, return null
                    return null; // this prevents errors when null

                const Product_Line = titleElement.querySelector('span')?.innerText.trim() || '';
                // to find product line inside the <span>
                // ?. ensures no error if <span> is missing, it will return undefined
                // innerText.trim gets the text inside <span> and removes extra spaces
                const IAM_PN = titleElement.childNodes[2]?.textContent.trim() || '';
                // .childNodes retrieves all child nodes, [2] refers to text node after <br>
                // ?.textContent.trim ensures no error, textContent retrieves the raw text content

                const getText = (selector) => {
                    const element = document.querySelector(selector);
                    return element ? element.innerText.replace(/.*:\s*/, "").trim() : null;
                    // remove everything before ':' and trims spaces
                };

                const dimensions = { // extract dimensions
                    Dimensions: {
                        Height: getText(".caracteristics div.row1.color3:nth-of-type(1)"),
                        Length: getText(".caracteristics div.row1.color3:nth-of-type(2)"),
                        Width: getText(".caracteristics div.row1.color3:nth-of-type(3)")
                    }
                };

                const imageElement = document.querySelector("figure a.thumbnail.fancybox img");
                // selecting the image element inside <figure>
                const baseURL = "http://www.purfluxgroupcatalog.com/catalogues/";
                // base URL for the site
                const imageURL800 = imageElement ? baseURL + imageElement.getAttribute("src").replace("../", "") : null;
                 // constructs full image URL, replaces "../" with correct path

                const OE_PN = Array.from(document.querySelectorAll('.row2.txtcontent .col-xs-3.txtcenter'))
                    .map(el => el.innerText.trim())
                    .filter(text => text !== ""); // remove empty values

                    // Extract all OE_PN values dynamically
                const Vehicle_Application = Array.from(document.querySelectorAll('.row2.txtcontent'))
                    .map(row => {
                        return Array.from(row.querySelectorAll('.col-xs-2')) // Select only relevant columns
                            .map(col => col.innerText.trim()) // Extract text
                            .join("") // Merge all text into a single string
                    })
                    .filter(text => text !== "") // Remove any empty entries

                return {
                    IAM_PN, // product line extracted from <h2>
                    Product_Line, // IAM part number from <h2>
                    ...dimensions, // merge dimensions object
                    Source: imageURL800 ? [{ imageURL800 }] : [], // store image URL in an array
                    OE_PN, // store all extracted OE_PN values
                    Vehicle_Application
                };
            }, optionValue); // Pass `optionValue` into `page.evaluate`

            // Step 5: Save data
            if (data) {
                allData.push(data);
                fs.writeFileSync("scrapedData.json", JSON.stringify(allData, null, 2));
                console.log(`Data saved after scraping ${optionValue}`);
            }

            console.log(`Finished scraping for: ${optionValue}`);
        }

        console.log("Scraping completed");
        await browser.close(); // close browser properly
    } catch (error) {
        console.error("An error occurred:", error);// proper error handling
        await browser.close();// Ensure the browser closes even on error
    }
};

scrape();
