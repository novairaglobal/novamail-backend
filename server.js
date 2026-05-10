const express = require("express")
const cors = require("cors")
const axios = require("axios")

require("dotenv").config()

const app = express()

app.use(cors())
app.use(express.json())

/*
|--------------------------------------------------------------------------
| HOME ROUTE
|--------------------------------------------------------------------------
*/

app.get("/", (req, res) => {
  res.send("NovaMail API Running 🚀")
})

/*
|--------------------------------------------------------------------------
| ZOHO LOGIN ROUTE
|--------------------------------------------------------------------------
*/

app.get("/auth/zoho", (req, res) => {

  const authUrl =
    `https://accounts.zoho.in/oauth/v2/auth?` +
    `scope=ZohoMail.messages.ALL,ZohoMail.accounts.READ&` +
    `client_id=${process.env.ZOHO_CLIENT_ID}&` +
    `response_type=code&` +
    `access_type=offline&` +
    `redirect_uri=${process.env.ZOHO_REDIRECT_URI}`

  res.redirect(authUrl)

})

/*
|--------------------------------------------------------------------------
| ZOHO CALLBACK ROUTE
|--------------------------------------------------------------------------
*/

app.get("/auth/zoho/callback", async (req, res) => {

  const { code } = req.query

  try {

    const response = await axios.post(
      "https://accounts.zoho.in/oauth/v2/token",
      null,
      {
        params: {
          grant_type: "authorization_code",
          client_id: process.env.ZOHO_CLIENT_ID,
          client_secret: process.env.ZOHO_CLIENT_SECRET,
          redirect_uri: process.env.ZOHO_REDIRECT_URI,
          code,
        },
      }
    )

    res.json({
      success: true,
      data: response.data
    })

  } catch (error) {

    console.log(error.response?.data || error.message)

    res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    })

  }

})

/*
|--------------------------------------------------------------------------
| GENERATE ACCESS TOKEN
|--------------------------------------------------------------------------
*/

app.get("/get-access-token", async (req, res) => {

  try {

    const response = await axios.post(
      "https://accounts.zoho.in/oauth/v2/token",
      null,
      {
        params: {
          refresh_token: process.env.ZOHO_REFRESH_TOKEN,
          client_id: process.env.ZOHO_CLIENT_ID,
          client_secret: process.env.ZOHO_CLIENT_SECRET,
          grant_type: "refresh_token",
        },
      }
    )

    res.json({
      success: true,
      access_token: response.data.access_token
    })

  } catch (error) {

    console.log(error.response?.data || error.message)

    res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    })

  }

})

/*
|--------------------------------------------------------------------------
| GET ZOHO ACCOUNT DETAILS
|--------------------------------------------------------------------------
*/

app.get("/zoho/accounts", async (req, res) => {

  try {

    const tokenResponse = await axios.post(
      "https://accounts.zoho.in/oauth/v2/token",
      null,
      {
        params: {
          refresh_token: process.env.ZOHO_REFRESH_TOKEN,
          client_id: process.env.ZOHO_CLIENT_ID,
          client_secret: process.env.ZOHO_CLIENT_SECRET,
          grant_type: "refresh_token",
        },
      }
    )

    const accessToken = tokenResponse.data.access_token

    const response = await axios.get(
      "https://mail.zoho.in/api/accounts",
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
        },
      }
    )

    res.json(response.data)

  } catch (error) {

    console.log(error.response?.data || error.message)

    res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    })

  }

})

/*
|--------------------------------------------------------------------------
| SEND EMAIL API
|--------------------------------------------------------------------------
*/

app.post("/send-email", async (req, res) => {

  try {

    const {
      to,
      subject,
      content
    } = req.body

    const tokenResponse = await axios.post(
      "https://accounts.zoho.in/oauth/v2/token",
      null,
      {
        params: {
          refresh_token: process.env.ZOHO_REFRESH_TOKEN,
          client_id: process.env.ZOHO_CLIENT_ID,
          client_secret: process.env.ZOHO_CLIENT_SECRET,
          grant_type: "refresh_token",
        },
      }
    )

    const accessToken = tokenResponse.data.access_token

    const response = await axios.post(
      `https://mail.zoho.in/api/accounts/${process.env.ZOHO_ACCOUNT_ID}/messages`,
      {
        fromAddress: "subhadeep@novairasolution.com",
        toAddress: to,
        subject: subject,
        content: content,
      },
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
        },
      }
    )

    res.json({
      success: true,
      data: response.data
    })

  } catch (error) {

    console.log(error.response?.data || error.message)

    res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    })

  }

})

/*
|--------------------------------------------------------------------------
| FETCH INBOX EMAILS
|--------------------------------------------------------------------------
*/

app.get("/inbox", async (req, res) => {

  try {

    const tokenResponse = await axios.post(
      "https://accounts.zoho.in/oauth/v2/token",
      null,
      {
        params: {
          refresh_token: process.env.ZOHO_REFRESH_TOKEN,
          client_id: process.env.ZOHO_CLIENT_ID,
          client_secret: process.env.ZOHO_CLIENT_SECRET,
          grant_type: "refresh_token",
        },
      }
    )

    const accessToken = tokenResponse.data.access_token

    const response = await axios.get(
      `https://mail.zoho.in/api/accounts/${process.env.ZOHO_ACCOUNT_ID}/messages/view`,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
        },
      }
    )

    res.json({
      success: true,
      data: response.data
    })

  } catch (error) {

    console.log(error.response?.data || error.message)

    res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    })

  }

})

/*
|--------------------------------------------------------------------------
| SERVER START
|--------------------------------------------------------------------------
*/

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})