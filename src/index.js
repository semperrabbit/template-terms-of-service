require('dotenv').config();

const axios      = require('axios');
const bodyParser = require('body-parser');
const express    = require('express');
const qs         = require('querystring');

const app = express();

const message = {
	token: process.env.SLACK_TOKEN,
	as_user: true,
	link_names: true,
	text: `Welcome to the Screeps Slack! We\'re glad you\'re here.

Below are a few do\'s and dont\'s for the slack. Note that the Do Not\'s include bannable offenses based off of severity and repeated offenses. All warnings, temporary bans and permanant bans are at the moderators\' discretion.

The community here is usually a friendly and helpful group, but should you run into any issues, please bring them up to the moderators.`,
	attachments: JSON.stringify([
		{
			title: 'Do:',
			text: `* Check #announcements for updates, but do not respond to post or attempt discussion in that channel. You may react to posts with emojis
* Discuss announcements in #announcements-any
* Ask for assistance in #help, not #general
* Ask permission before removing pinned posts or modifying integrations
* Try to keep the discussions in line with the channel you\'re in`,
			color: '#74c8ed',
		},
		{
			title: 'Do Not:',
			text: `* Remove others' pinned posts without permission
* Remove/reconfigure others' integrations without permissions
* Disrespect people who were asking for help in #help
* Threaten physical injury or harass anyone
* Repeatedly provoke serious arguments
* Refuse to disengage from serious arguments when asked to by an admin`,
			color: '#74c8ed',
		},
		{
			title: 'Moderators',
			text: `@atavus
@daboross
@dissi  (community manager too)
@o4apuk (community manager too)
@semperrabbit`,
			color: '#74c8ed',
		},
		{
			title: 'Helpful Links:',
			text: `*API*: http://docs.screeps.com/api/
*Game source code*: https://github.com/Screeps
*Alliances*: http://www.leagueofautomatednations.com
*Wiki*: https://wiki.screepspl.us
*Third party tools*: http://docs.screeps.com/third-party.html
*Screeps World*: https://screepsworld.com/
*Spawning room recommendation*: https://screepsworld.com/2017/07/warning-novice-zones-are-lies-where-to-spawn-as-a-noob/`,
		}]),
};

const postResult = result => console.log(result.data);

/*
 * send the initial message
*/
const initialMessage = (teamId, userId) => {
	// enable testing 
	if(process.env.TEST_USER && userId !== process.env.TEST_USER){
		return;
	}

	// send the default message as a DM to the user
	message.channel = userId;
	const params = qs.stringify(message);
	const sendMessage = axios.post('https://slack.com/api/chat.postMessage', params);
	sendMessage.then(postResult);
};


/*
 * parse application/x-www-form-urlencoded && application/json
 */
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('<h2>The Screeps Slack WelcomeBot is running</h2> <p>If there are any issues, please contact @semperrabbit in the slack.</p>');
});

/*
 * Endpoint to receive events from Slack's Events API.
 * Handles:
 *   - url_verification: Returns challenge token sent when present.
 *   - event_callback: Confirm verification token & handle `team_join` event.
 */
app.post('/events', (req, res) => {
  switch (req.body.type) {
    case 'url_verification': {
      // verify Events API endpoint by returning challenge if present
      res.send({ challenge: req.body.challenge });
      break;
    }
    case 'event_callback': {
      if (req.body.token === process.env.SLACK_VERIFICATION_TOKEN) {
        const event = req.body.event;

        // `team_join` is fired whenever a new user (incl. a bot) joins the team
        // check if `event.is_restricted == true` to limit to guest accounts
        if (event.type === 'team_join' && !event.is_bot) {
          const { team_id, id } = event.user;
          onboard.initialMessage(team_id, id);
        }
        res.sendStatus(200);
      } else { res.sendStatus(500); }
      break;
    }
    default: { res.sendStatus(500); }
  }
});

app.listen(process.env.PORT, () => {
  console.log(`App listening on port ${process.env.PORT}!`);
});
