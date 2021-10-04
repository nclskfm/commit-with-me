import got from 'got';
import * as vscode from 'vscode';
import { API, GitExtension } from '../interfaces/git';

export async function getUserEvents(user: string): Promise<any> {
  return got(
    `https://api.github.com/users/${user}/events/public?per_page=100`,
    {
      headers: {
        accept: 'Accept: application/vnd.github.v3+json',
      },
    }
  );
}

export async function parseEvents(
  events: any,
  user: string
): Promise<[string, string[]]> {
  const pushEvents = events?.filter((e: any) => e.type === 'PushEvent');

  user = pushEvents[0]?.actor.display_login || user;
  const emails: string[] = [];

  pushEvents?.forEach((e: any) => {
    e.payload?.commits?.forEach((c: any) => emails.push(c.author.email));
  });

  if (emails.length === 0) {
    return await getFallbackUser(user);
  } else {
    return [user, emails];
  }
}

export function getGitApi(): API | undefined {
  const gitExtension =
    vscode.extensions.getExtension<GitExtension>('vscode.git')?.exports;
  return gitExtension?.getAPI(1);
}

/**
 * Function to get the most frequent element in an `array`.
 *
 * Developed by https://stackoverflow.com/a/1053865/10967372
 */
export function getMostFrequent(array: any[]): any {
  return array
    .sort(
      (a, b) =>
        array.filter((v) => v === a).length -
        array.filter((v) => v === b).length
    )
    .pop();
}

export function commitMessage(user: string, email: string): string {
  return `Co-authored-by: ${user} <${email}>`;
}

async function getFallbackUser(user: string): Promise<[string, string[]]> {
  return got(`https://api.github.com/users/${user}`, {
    headers: {
      accept: 'Accept: application/vnd.github.v3+json',
    },
  }).then((raw) => {
    const user = JSON.parse(raw.body);
    const name = user.login;
    const emails = [`${user.id}+${name}@users.noreply.github.com`];
    vscode.window.showWarningMessage(
      `no email found for user ${name}. Using default GitHub email ${emails[0]}`
    );
    return [name, emails];
  });
}
