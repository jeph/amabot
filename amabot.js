import puppeteer from 'puppeteer'

const productId = '' // ex B0815Y8J9N
const priceYoureWillingToPay = 0 // Number ex. 849.99
const email = ''
const password = ''

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const getElementTextContent = element => element.textContent

const runAmabot = async () => {
  const browser = await puppeteer.launch({
    args: ['--disable-features=site-per-process'],
    headless: false
  })
  const page = await browser.newPage()
  await page.goto(
    'https://amazon.com/gp/sign-in.html',
    { waitUntil: 'domcontentloaded' }
  )
  await page.type('#ap_email', email)
  await page.click('#continue')
  await page.waitForNavigation()
  await page.type('#ap_password', password)
  await page.click('#signInSubmit')
  await page.waitForNavigation()
  await page.goto(
    `https://www.amazon.com/dp/${productId}`,
    { waitUntil: 'domcontentloaded' }
  )
  await page.waitForSelector('#availability')
  let availabilityElement = await page.$('#availability')
  let availabilityText = await page.evaluate(getElementTextContent, availabilityElement)
  while (
    !availabilityText.trim().toLowerCase().includes('in stock')
    && !availabilityText.trim().toLowerCase().includes('to ship')
    || availabilityText.trim().toLowerCase().includes('unavailable')
    ) {
    await sleep(5000)
    await page.setCacheEnabled(false)
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForSelector('#availability')
    availabilityElement = await page.$("#availability")
    availabilityText = await page.evaluate(getElementTextContent, availabilityElement)
    console.log('Not available :(')
  }
  console.log('Available :D')
  const priceElement = await page.$('#price_inside_buybox')
  const priceText = await page.evaluate(getElementTextContent, priceElement)
  const price = priceText.trim().substring(1)
  if (Number(price) <= priceYoureWillingToPay) {
    console.log('Not a scalp! Price is', price)
    await page.click('#buy-now-button')
    await page.waitForSelector('iframe#turbo-checkout-iframe')
    const checkoutModel = await page.$('iframe#turbo-checkout-iframe')
    const frame = await checkoutModel.contentFrame()
    await frame.waitForSelector('#turbo-checkout-pyo-button')
    await frame.click('#turbo-checkout-pyo-button')
  } else {
    console.log('rip it was a scalp')
  }
}

runAmabot()
