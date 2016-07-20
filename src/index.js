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
import session from 'express-session';
import smugmug from './smugmug';
import { getSecret } from './secrets';

const app = express();

app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
}));

function displayError(response, error) {
  response.status(500);
  response.set('Content-Type', 'text/plain');
  response.send(String(error));
}

app.get('/fetch', (request, response) => {
  const secret = getSecret(request.query.id);

  if (secret === undefined) {
    displayError('Unknown ID');
    return;
  }

  response.status(200);
  response.set('Content-Type', 'application/json');
  response.send(JSON.stringify(secret));
});

app.use('/smugmug', smugmug);

app.listen(process.env.PORT);
console.log(`Server listening on port ${process.env.PORT}`);
