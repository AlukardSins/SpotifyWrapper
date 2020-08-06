SpotifyWrapper

Server loaded by command `npm start` on `localhost:3000` by default

It has 2 Endpoints

> GET `/v1/special-search`
> ### Input
>>URL parameter `q`
>>
> ### Output
>>10 of each Artists, Albums and Tracks after the first 5 results

> POST `/v1/artistInfo`
> ### Input
>> ```javascript
>>  {
>>    ids: ['spotify_id'],                  // Up to 5 Ids
>>    valid_for: ['CO'],                    // Default value: 'US'
>>    order_by: 'followers | popularity'    // Default value: 'followers'
>>  }
>> ```
> ### Output
>>```javascript
>>  // An array of 3 of these ordered by followers or popularity descending from highest to lowest
>>  {
>>    artists: {
>>      spotify_url: 'SpotifyURL',
>>      name: 'Artist Name',
>>      followers: Number,
>>      popularity: Number,
>>      albums: [                         // A list of 3 albums
>>        {
>>          name: 'Album Name',
>>          release_date: 'YYYY-MM-DD',
>>          type: 'Type',
>>          is_available: Boolean         // Determined when making the call or inline
>>        }
>>      ],
>>      related_artists: [                // A list of 3 related artists
>>        {
>>          name: 'Artist Name',
>>          followers: Number,
>>          popularity: Number
>>        }
>>      ]
>>    },
>>    genres: [                           // Spotify does not return repeated genres
>>      'any genre'
>>    ]
>>  }
>>```
>
>