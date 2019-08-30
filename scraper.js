const request = require('request');
const cheerio = require('cheerio');

// Variable Locations of Elements on McKaig's Site... Since they could change, I put them here for ease of reference
const customerNameLoc = '.italic.font-18.black.notranslate';
const dateLoc = '.italic.col-xs-6.col-sm-12.pad-none.margin-none.font-20';
const reviewLoc = '.pull-left.font-14.boldest.lt-grey.line-height-1.pad-right-sm.margin-right-sm.border-right';
const employeesLoc = '.employees-wrapper';
const ratingLoc = '.rating-static.hidden-xs';
const reviewTextLoc = '.font-16.review-content.margin-bottom-none.line-height-25';
const staticRatingLoc = '.rating-static';

let kloutDict = {};
let mode = 'prod'; // Change Mode to 'test' or 'prod'

mode === 'prod' ? runProd() : runTest();

function runProd() {
    fillDictionary();
    analyzer();
}

async function runTest() {
    console.log('Running in TEST mode');
    fillDictionary();
    let testsPassed = await testSuite();
    if (testsPassed) {
        analyzer();
    } else {
        console.log('TEST MODE: FAILED');
    }
}

async function analyzer() {
    try {
        scrape(5).then((reviews) => {
            let sortedReviews = [];
            let bestReviews = [];
            reviews.forEach((review) => {
                let string =
                    review.title.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()"]/g, '') +
                    review.text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()"]/g, '');
                let words = string.toLowerCase().split(' ');
                flags = [];
                let score = 0;
                for (let word of words) {
                    if (kloutDict[word]) {
                        score += kloutDict[word];
                        flags.push(' ' + word);
                    }
                }
                score += 10 * review.rating;
                review.employeeQuality < 0 ? (score *= review.employeeQuality) : (score = score);
                review.kloutScore = score;
                review.kloutFlags = flags;
                sortedReviews.push(review);
            });
            sortedReviews.sort(comparator);
            bestReviews = sortedReviews.slice(0, 3);
            worstReviews = sortedReviews.slice(sortedReviews.length - 3, sortedReviews.length);
            printReviews(bestReviews);
        });
    } catch (e) {
        console.log(e);
    }
}

async function scrape(numPages) {
    let reviews = [];
    let calls = 0;
    return new Promise((resolve) => {
        for (i = 0; i < numPages; ++i) {
            request(
                `https://www.dealerrater.com/dealer/McKaig-Chevrolet-Buick-A-Dealer-For-The-People-dealer-reviews-23685/page${i}/?filter=ALL_REVIEWS#link`,
                (err, res, html) => {
                    calls++;
                    if (err) {
                        console.log(err);
                    } else {
                        try {
                            const $ = cheerio.load(html);

                            $('.review-entry').each((index, element) => {
                                let reviewer = $(element)
                                    .find(customerNameLoc)
                                    .text()
                                    .replace('- ', '');
                                let date = $(element)
                                    .find(dateLoc)
                                    .text();
                                let currentEmployees = $(element).find(employeesLoc).length > 0;
                                let hasReviews = $(element).find(reviewLoc).length > 0;
                                let scores = [];
                                if (currentEmployees && hasReviews) {
                                    $(element)
                                        .find(employeesLoc)
                                        .find('.table')
                                        .each((ind, el) => {
                                            if ($(el).find(staticRatingLoc).length > 0) {
                                                scores.push(
                                                    parseInt(
                                                        $(el)
                                                            .find(staticRatingLoc)
                                                            .attr('class')
                                                            .split(/\s+/)[1]
                                                            .replace('rating-', '') / 10,
                                                    ),
                                                );
                                            }
                                        });
                                }
                                let avgEmpScore;
                                scores.length > 0
                                    ? (avgEmpScore = scores.reduce((a, b) => a + b) / scores.length)
                                    : (avgEmpScore = 3);
                                let title = $(element)
                                    .find('h3')
                                    .text()
                                    .replace(/\s\s+/g, '');
                                let rating =
                                    $(element)
                                        .find(ratingLoc)
                                        .attr('class')
                                        .split(/\s+/)[2]
                                        .replace('rating-', '') / 10;
                                let body = $(element)
                                    .find(reviewTextLoc)
                                    .text()
                                    .replace(/\s\s+/g, '');
                                body += '\n';

                                const review = {
                                    name: reviewer,
                                    date: date,
                                    employeeQuality: avgEmpScore / 5,
                                    title: title,
                                    text: body,
                                    rating: rating,
                                };
                                reviews.push(review);
                            });
                            if (numPages === calls) {
                                resolve(reviews);
                            }
                        } catch (error) {
                            console.log(error);
                        }
                    }
                },
            );
        }
    });
}

function printReviews(reviews) {
    console.log('\n');
    for (let review of reviews) {
        console.log('CUSTOMER:            ' + review.name);
        console.log('REVIEW TITLE:        ' + review.title);
        console.log('REVIEW DATE:         ' + review.date);
        console.log('KLOUT SCORE:         ' + review.kloutScore);
        console.log('USER RATING:         ' + review.rating + '/5');
        console.log('EMPLOYEE QUALITY:    ' + review.employeeQuality * 5 + '/5');
        console.log('FLAGGED WORDS:       ' + review.kloutFlags);
        console.log('REVIEW CONTENT:      \n\t' + review.text + '\n\n\n');
    }
}

function fillDictionary() {
    kloutDict['awesome'] = 8;
    kloutDict['very'] = 5;
    kloutDict['amazing'] = 8;
    kloutDict['wonderful'] = 7;
    kloutDict['polite'] = 6;
    kloutDict['good'] = 3;
    kloutDict['fantastic'] = 10;
    kloutDict['great'] = 8;
    kloutDict['best'] = 10;
    kloutDict['favorite'] = 10;
    kloutDict['quick'] = 5;
    kloutDict['kind'] = 5;
    kloutDict['helpful'] = 7;
    kloutDict['immediately'] = 10;
    kloutDict['highly recommend'] = 10;
    kloutDict['dream'] = 9;
    kloutDict['super'] = 7;
    kloutDict['simple'] = 5;
    kloutDict['propmt'] = 6;
    kloutDict['help'] = 3;
    kloutDict['terrific'] = 4;
    kloutDict['true'] = 5;
    kloutDict['excellent'] = 7;
    kloutDict['easy'] = 6;
    kloutDict['so'] = 4;
    kloutDict['exactly'] = 7;
    kloutDict['really'] = 5;
    kloutDict['glad'] = 4;
    kloutDict['special'] = 5;
    kloutDict['by far'] = 6;
    kloutDict['highly'] = 5;
    kloutDict['honest'] = 6;
    kloutDict['pleasure'] = 3;
    kloutDict['deceitful'] = -6;
    kloutDict['accommodating'] = 5;
    kloutDict['nice'] = 5;
    kloutDict['approved'] = 3;
    kloutDict['smile'] = 5;
    kloutDict['smiling'] = 5;
    kloutDict['convenient'] = 5;
    kloutDict['understand'] = 3;
    kloutDict['considerate'] = 4;
    kloutDict['pressure'] = -5;
    kloutDict['accident'] = -8;
    kloutDict['hate'] = -8;
    kloutDict['evil'] = -8;
    kloutDict['bad'] = -3;
    kloutDict['worst'] = -7;
    kloutDict['omg'] = 8;
}

function comparator(a, b) {
    if (a.kloutScore > b.kloutScore) {
        return -1;
    } else if (a.kloutScore < b.kloutScore) {
        return 1;
    }
    return 0;
}

async function testSuite() {
    return new Promise((resolve) => {
        return request(
            `https://www.dealerrater.com/dealer/McKaig-Chevrolet-Buick-A-Dealer-For-The-People-dealer-reviews-23685/page1/?filter=ALL_REVIEWS#link`,
            (err, res, html) => {
                if (err) {
                    console.log("FAILED: Couldn't send node request " + err);
                    resolve(false);
                } else {
                    try {
                        const $ = cheerio.load(html);
                        counter = 0;
                        $('.review-entry').each((index, element) => {
                            counter++;
                            let reviewer = $(element)
                                .find(customerNameLoc)
                                .text()
                                .replace('- ', '');
                            if (!reviewer || reviewer.length === 0) {
                                console.log("FAILED: can't locate name to attach to review");
                                resolve(false);
                            }
                            let date = $(element)
                                .find(dateLoc)
                                .text();
                            if (!date || date.length === 0) {
                                console.log("FAILED: can't locate review's DATE.");
                                resolve(false);
                            }
                            let rating = $(element)
                                .find(ratingLoc)
                                .attr('class');
                            if (!rating || rating.length === 0) {
                                console.log("FAILED: can't locate name to attach to review");
                                resolve(false);
                            }
                        });
                        if (counter === 0) {
                            console.log("FAILED: couldn't find reviews to parse");
                            resolve(false);
                        }
                    } catch (e) {
                        console.log('FAILED... Other error: ' + e);
                        resolve(false);
                    }
                }
                resolve(true);
            },
        );
    }).then((a) => {
        if (a) {
            console.log('ALL TESTS PASSED... Running Scraper Now');
        }
        return a;
    });
}
