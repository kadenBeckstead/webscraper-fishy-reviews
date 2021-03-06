


##### Coding Challenge: “A Dealer For the People”

The KGB has noticed a resurgence of overly excited reviews for a McKaig Chevrolet Buick, a dealership they have planted in the United States. In order to avoid attracting unwanted attention, you’ve been enlisted to scrape reviews for this dealership from DealerRater.com and uncover the top three worst offenders of these overly positive endorsements.

Your mission, should you choose to accept it, is to write a tool that:

- 1 scrapes the first five pages of reviews
- 2 identifies the top three most “overly positive” endorsements (using criteria of your choosing, documented in the README)
- 3 outputs these three reviews to the console, in order of severity



# Documentation:

I solved this problem using Node js and a scraping library (cheerio js) a library that allows you to take the html from a node request and interact with it using jQuery.

I start the process by defining the number of pages to scrape (currently a variable [n] that will scrape pages 1 - n) Once the useful information has been scraped from the review, the data is then placed into a review object and appended to the object of reviews. 

I constructed a map in which I appended a bunch of common trigger words along with an impact rating. Then, as I loop through the reviews, I compare the title and review body's contents to the map I made. This approach is not unlike the commonly used "Klout Scoring" methodology. (Of course, my klout score range extends from negative infinity to infinity rather than 0-100)

The overall "Klout Score" is generated by the combination of several things; the weighted star rating the user gave McKaig's, as well as the total klout of the title and review body's text. And I also came up with an idea that would be more useful if there were more negative reviews on the site, but basically, I took the average employee rating that the customer dealt with and if their overall score was negative, I discounted their Klout value because their experience may very well have been predicated on the fact that they were dealing with a bad employee rather than the company itself being bad. 

I then took all the reviews and sorted them by my assigned klout value (best to worst) and then printed them in a (hopefully) more user-friendly format.


# Testing:
My test cases cover the inability to send a node request, the failure to grab critical elements from the html, and other miscellaneous cheerio errors. If test cases fail, it will be a good indication that the html of the page has been changed. If you wanted to run this function in it's verbose (test) form, then update line 14 of scraper.js
to ``` let mode = 'test' ``` as opposed to ``` let mode = 'prod' ``` then run with ``` node scraper.js ``` prod mode will run without any test cases, and verbose mode may be nominally slower, but will output a success or failure message (if fail, it will include some information as to why it failed)




### Instructions Below



