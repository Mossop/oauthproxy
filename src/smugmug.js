/*
Copyright 2016 Mozilla

Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed
under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
CONDITIONS OF ANY KIND, either express or implied. See the License for the
specific language governing permissions and limitations under the License.
*/

import express from 'express';
import OAuth from 'oauth';
import { setSecret } from './secrets';

const oauth = new OAuth.OAuth(
  'http://api.smugmug.com/services/oauth/1.0a/getRequestToken',
  'http://api.smugmug.com/services/oauth/1.0a/getAccessToken',
  process.env.SMUGMUG_KEY,
  process.env.SMUGMUG_SECRET,
  '1.0A',
  'https://auth.fractalbrew.com/smugmug/callback',
  'HMAC-SHA1'
);

const authorizeURL = 'http://api.smugmug.com/services/oauth/1.0a/authorize?' +
                     'Access=Full&allowThirdPartyLogin=1';

function displayError(response, error) {
  response.status(500);
  response.set('Content-Type', 'text/plain');
  response.send(String(error));
}

const router = express.Router();

router.get('', (request, response) => {
  oauth.getOAuthRequestToken((error, requestToken, requestSecret) => {
    if (error) {
      displayError(response, error);
      return;
    }

    request.session.requestToken = requestToken;
    request.session.requestSecret = requestSecret;

    response.redirect(`${authorizeURL}&oauth_token=${requestToken}`);
  });
});

router.get('/callback', (request, response) => {
  const requestToken = request.query.oauth_token;
  if (requestToken !== request.session.requestToken) {
    displayError(response, 'Mismatched session data');
    return;
  }

  oauth.getOAuthAccessToken(requestToken, request.session.requestSecret,
    request.query.oauth_verifier, (error, accessToken, accessTokenSecret) => {
      if (error) {
        displayError(response, error);
        return;
      }

      const id = setSecret({
        accessToken,
        accessTokenSecret,
      });

      response.status(200);
      response.set('Content-Type', 'text/plain');
      response.send(`Please enter the code ${id} into Plex.`);
    });
});

export default router;
