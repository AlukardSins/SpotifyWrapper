const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')

const request = require('request')

// To base64
const encoded = Buffer.from('f4ff9ef1fb9a46e28540a65b47452b26:f3e982a07fbb4a2fa243a0dd588567f3').toString('base64')

const app = express()
const port = process.env.PORT || 3000

const spotifyArtistAPI = 'https://api.spotify.com/v1/'

app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// Special search
/*
** Endpoint to search an artist
** skipping the first 5 results
** Show only the next 10 results
** Searching by album, artist and track
**
** input:   q
** output:  JSON response
*/
app.get('/v1/special-search', (req, response) => {
  // Get authorization from Spotify API
  request.post(
    {
      url: 'https://accounts.spotify.com/api/token',
      headers: {
        Authorization: `Basic ${encoded}`
      },
      form: {
        grant_type: 'client_credentials'
      }
    },
    (err, auth, authBody) => {
      // Proper https request
      if (!err && auth.statusCode === 200) {
        const authData = JSON.parse(authBody)

        const searchType = 'album,artist,track'

        request.get(
          {
            url: `${spotifyArtistAPI}search?q=${req.query.q}&type=${searchType}&limit=10&offset=5`,
            headers: {
              Authorization: `${authData.token_type} ${authData.access_token}`
            }
          },
          (err, data, dataBody) => {
            if (!err && data.statusCode === 200) {
              return response.send(JSON.parse(dataBody))
            }
          }
        )
      }
    }
  )
})

// Get artist(s)
/*
** Endpoint to search an artist info
** Max of 5 artists per query
** No repeated Genre
** First 3 Albums
** First 3 Related Artists ordered by popularity
**
** input:     ids       spotify_id
** optional:  order_by  default = followers
** optional:  valid_for defaukt = US
** output:    JSON response
*/
app.post('/v1/artistInfo', (req, respose) => {
  const ids = req.query.ids.length ? req.query.ids.split(',') : null
  const orderBy = req.query.order_by || 'followers'
  const validFor = req.query.valid_for || 'US'

  if (ids && ids.length <= 5) {
    // Get authorization from Spotify API
    request.post(
      {
        url: 'https://accounts.spotify.com/api/token',
        headers: {
          Authorization: `Basic ${encoded}`
        },
        form: {
          grant_type: 'client_credentials'
        }
      },
      (err, auth, authBody) => {
        // Proper https request
        if (!err && auth.statusCode === 200) {
          const authData = JSON.parse(authBody)
          /*
        request.get({
          url: `${spotifyArtistAPI}artists?ids=${}`

        }, (req, data, body) => {

        })
        */
        }
      }
    )
  }
})

app.listen(port, () => console.log(`Server ready on port ${port}, Using Spoty API on ${spotifyArtistAPI}`))
