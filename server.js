const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')

const request = require('request')

const Credentials = {
  ClientId: '<YOUR CLIENT ID>',
  ClientSecret: '<YOUR CLIENT SECRET>'
}
// To base64
const encoded = Buffer.from(`${Credentials.ClientId}:${Credentials.ClientSecret}`).toString('base64')

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
app.post('/v1/artistInfo', (req, response) => {
  const ids = req.query.ids.length ? req.query.ids.split(',') : null
  let orderBy = ''
  if (req.query.order_by === 'followers' || req.query.order_by === 'popularity') {
    orderBy = req.query.order_by || 'followers'
  }
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

          let list = []
          ids.forEach((id) => {
            // Get artist info
            const item = {}
            request.get(
              {
                url: `${spotifyArtistAPI}artists/${id}`,
                headers: {
                  Authorization: `${authData.token_type} ${authData.access_token}`
                }
              },
              (err, artist, artistBody) => {
                if (!err && artist.statusCode === 200) {
                  const artistData = JSON.parse(artistBody)
                  item.artists = {
                    spotify_url: artistData.external_urls.spotify,
                    name: artistData.name,
                    followers: artistData.followers.total,
                    popularity: artistData.popularity,
                    albums: [],
                    related_artists: []
                  }

                  // Function to eliminate dupes goes here
                  item.genres = artistData.genres

                  // Get artist albums
                  request.get(
                    {
                      url: `${spotifyArtistAPI}artists/${id}/albums?market=${validFor}&limit=3`,
                      headers: {
                        Authorization: `${authData.token_type} ${authData.access_token}`
                      }
                    },
                    (err, albums, albumsBody) => {
                      if (!err && albums.statusCode === 200) {
                        const albumsData = JSON.parse(albumsBody)
                        const albumsList = []

                        albumsData.items.forEach((i) => {
                          albumsList.push({
                            name: i.name,
                            release_date: i.release_date,
                            type: i.type,
                            is_available: true
                          })
                        })
                        item.artists.albums = albumsList

                        // Get artist albums alternate version
                        /*
                        request.get(
                          {
                            url: `${spotifyArtistAPI}artists/${id}/albums?limit=3`,
                            headers: {
                              Authorization: `${authData.token_type} ${authData.access_token}`
                            }
                          },
                          (err, albums, albumsBody) => {
                            if (!err && albums.statusCode === 200) {
                              const albumsData = JSON.parse(albumsBody)
                              const albumsList = []

                              albumsData.items.forEach((i) => {
                                albumsList.push({
                                  name: i.name,
                                  release_date: i.release_date,
                                  type: i.type,
                                  is_available: i.available_markets.includes(validFor)
                                })
                              })
                              item.artists.albums = albumsList
                            }
                          }
                        )
                        */

                        // Get artist related artists
                        request.get(
                          {
                            url: `${spotifyArtistAPI}artists/${id}/related-artists`,
                            headers: {
                              Authorization: `${authData.token_type} ${authData.access_token}`
                            }
                          },
                          (err, related, relatedBody) => {
                            if (!err && related.statusCode === 200) {
                              let relatedData = JSON.parse(relatedBody)
                              const relatedList = []
                              relatedData = relatedData.artists.splice(0, 3)
                              relatedData.forEach((i) => {
                                relatedList.push({
                                  name: i.name,
                                  followers: i.followers.total,
                                  popularity: i.popularity
                                })
                              })
                              item.artists.related_artists = relatedList
                              list.push(item)

                              if (list.length === ids.length) {
                                if (orderBy === 'followers') {
                                  list.sort((x, y) => {
                                    return y.artists.followers - x.artists.followers
                                  })
                                } else if (orderBy === 'popularity') {
                                  list.sort((x, y) => {
                                    return y.artists.popularity - x.artists.popularity
                                  })
                                }

                                return response.send(list)
                              }
                            }
                          }
                        )
                      }
                    }
                  )
                }
              }
            )
          })
        }
      }
    )
  }
})

app.listen(port, () => console.log(`Server ready on port ${port}, Using Spoty API on ${spotifyArtistAPI}`))
