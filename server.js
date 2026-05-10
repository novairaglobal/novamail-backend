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

  res.json({
    success: true,
    message: "NovaMail API Running 🚀"
  })

})

/*
|--------------------------------------------------------------------------
| GENERATE ACCESS TOKEN
|--------------------------------------------------------------------------
*/

async function generateAccessToken() {

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

  return response.data.access_token

}

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

    if (!to || !subject || !content) {

      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      })

    }

    const accessToken =
      await generateAccessToken()

    const response = await axios.post(
      `https://mail.zoho.in/api/accounts/${process.env.ZOHO_ACCOUNT_ID}/messages`,
      {
        fromAddress:
          "subhadeep@novairasolution.com",

        toAddress: to,

        subject: subject,

        content: content,
      },
      {
        headers: {
          Authorization:
            `Zoho-oauthtoken ${accessToken}`,
        },
      }
    )

    res.json({
      success: true,
      data: response.data
    })

  } catch (error) {

    console.log(
      error.response?.data || error.message
    )

    res.status(500).json({
      success: false,
      error:
        error.response?.data ||
        error.message
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

    const accessToken =
      await generateAccessToken()

    // FETCH MAIL LIST

    const response = await axios.get(
      `https://mail.zoho.in/api/accounts/${process.env.ZOHO_ACCOUNT_ID}/messages/view`,
      {
        headers: {
          Authorization:
            `Zoho-oauthtoken ${accessToken}`,
        },
      }
    )

    const mails =
      response?.data?.data || []

    // FETCH FULL DETAILS

    const detailedMails =
      await Promise.all(

        mails.map(async (mail) => {

          try {

            const detailResponse =
              await axios.get(
                `https://mail.zoho.in/api/accounts/${process.env.ZOHO_ACCOUNT_ID}/messages/${mail.messageId}`,
                {
                  headers: {
                    Authorization:
                      `Zoho-oauthtoken ${accessToken}`,
                  },
                }
              )

            return {
              ...mail,

              content:
                detailResponse?.data?.data
                  ?.content ||

                detailResponse?.data?.data
                  ?.contentHTML ||

                mail.summary,
            }

          } catch {

            return {
              ...mail,
              content:
                mail.summary ||
                "No content available"
            }

          }

        })

      )

    res.json({
      success: true,
      count: detailedMails.length,
      data: detailedMails
    })

  } catch (error) {

    console.log(
      error.response?.data || error.message
    )

    res.status(500).json({
      success: false,
      error:
        error.response?.data ||
        error.message
    })

  }

})

/*
|--------------------------------------------------------------------------
| SERVER START
|--------------------------------------------------------------------------
*/

const PORT =
  process.env.PORT || 5000

app.listen(PORT, () => {

  console.log(
    `Server running on port ${PORT}`
  )

})