import type { App } from '@slack/bolt';
import { trimMentions } from '../trim/trim-mentions';
import { fetchTextDavinci003 } from '../../openai/fetch-text-davinci-003';

export type SetMentionEventArgs = {
  app: App;
  openAiApiKey: string;
  appLog?: (args: unknown) => unknown;
  errorLog?: (args: unknown) => unknown;
};

// Require app_mentions:read
export function setMentionEvent({ app, openAiApiKey, appLog, errorLog }: SetMentionEventArgs) {
  app.event('app_mention', async ({ event, say, context }) => {
    appLog?.(event);
    appLog?.(context);
    const trimmedText = trimMentions(event.text);
    if (context.retryNum !== undefined) {
      // If when retry, not say
      appLog?.('not say');
      return;
    }
    try {
      // Fetch OpenAI
      appLog?.('try fetch openai');
      const message = await fetchTextDavinci003({ prompt: trimmedText, apiKey: openAiApiKey }).then((response) => {
        appLog?.(response);
        appLog?.('finished fetch openai');
        return response.choices[0].text;
      });
      // Say Slack
      appLog?.('try say slack');
      const sayArgs = { thread_ts: event.ts, text: `<@${event.user}> ${message}` };
      await say(sayArgs).then(() => {
        appLog?.(sayArgs);
      });
    } catch (error) {
      errorLog?.(error);
      await say(`${error?.toString()}`);
    }
  });
}