const puppeteer = require('puppeteer');
const assert = require('assert');
const cas = require('../../cas.js');

async function startAuthFlow(page, username) {
    console.log("Removing previous sessions and logging out");
    await cas.goto(page, "https://localhost:8443/cas/logout");
    console.log(`Starting authentication flow for ${username}`);
    await cas.goto(page, "https://localhost:8443/cas/login?locale=en");
    let pswd = await page.$('#password');
    assert(pswd == null);
    await cas.type(page, '#username', username);
    await page.waitForTimeout(1000);
    await page.keyboard.press('Enter');
    await page.waitForNavigation();
    await page.waitForTimeout(1000);
    console.log(`Page url: ${await page.url()}`);

    await cas.loginWith(page, "casuser", "Mellon");
    await page.waitForTimeout(5000);
    console.log(`Page url: ${await page.url()}`);
    await cas.assertCookie(page);
    await cas.assertInnerTextStartsWith(page, "#content div p", "You, user3, have successfully logged in");

    await cas.click(page, "#auth-tab");
    await page.waitForTimeout(1000);
    await cas.type(page, "#attribute-tab-1 input[type=search]", "surrogate");
    await page.waitForTimeout(1000);
    await cas.screenshot(page);
    await cas.assertInnerTextStartsWith(page, "#surrogateEnabled td code kbd", "[true]");
    await cas.assertInnerTextStartsWith(page, "#surrogatePrincipal td code kbd", "[casuser]");
    await cas.assertInnerTextStartsWith(page, "#surrogateUser td code kbd", "[user3]");
    await page.waitForTimeout(1000);
}

(async () => {
    const browser = await puppeteer.launch(cas.browserOptions());
    const page = await cas.newPage(browser);

    await startAuthFlow(page, "user3+casuser-server");
    await startAuthFlow(page, "user3+casuser-none");
    await startAuthFlow(page, "user3+casuser-client");

    await browser.close();
})();
